import { html, nothing, ReactiveController, ReactiveControllerHost } from "lit";
import { YahtlApi } from "./api";
import type {
  HomeAssistant,
  YahtlListInfo,
  YahtlItemSummary,
  YahtlItem,
  QueueResult,
  ContextOverride,
  MetaConfig,
  TagInfo,
  UncompletePrior,
} from "./types";

type Subscriber = () => void;
type ItemFilters = Parameters<YahtlApi["getItems"]>[1];

interface StoreState {
  lists: YahtlListInfo[];
  items: Map<string, YahtlItemSummary[]>; // entityId -> full (unfiltered) items
  filteredItems: Map<string, YahtlItemSummary[]>; // "entityId|filter-sig" -> filtered items
  queue: QueueResult | null;
  context: ContextOverride | null;
  meta: MetaConfig | null;
  tags: TagInfo[];
  loading: boolean;
  // Most recent load/mutation failure; cards render it via renderStoreError().
  lastError: { message: string; at: number } | null;
}

class YahtlStore {
  private _api: YahtlApi | null = null;
  private _hass: HomeAssistant | null = null;
  private _subscribers = new Set<Subscriber>();
  // Monotonic counter so overlapping queue loads resolving out of order
  // can't overwrite a newer result with a stale one.
  private _queueGen = 0;

  // --- Live-update push subscription state ---
  // The connection object we subscribed on: setHass is called by every card on
  // every hass assignment, so this guards against duplicate subscriptions.
  // hass.connection.subscribeMessage replays the subscription automatically
  // after a reconnect, so one successful subscribe lasts the page's lifetime.
  private _pushConn: object | null = null;
  // Set when the backend rejects the subscription (e.g. unknown_command before
  // the HA restart that registers it) so we log once and stop retrying.
  private _pushUnavailable = false;
  private _pushDebounce: number | null = null;
  private _pushedListIds = new Set<string>();
  private _pushedMeta = false;
  // Filtered fetches we've served, so a push can re-run them with the exact
  // same filters (the cache key alone can't reconstruct the filter object).
  private _filterFetches = new Map<
    string,
    { entityId: string; filters: ItemFilters }
  >();
  // Whether loadTags has ever run: tags derive from item edits, so pushes
  // refresh them — but only for pages that actually use them.
  private _tagsLoaded = false;

  state: StoreState = {
    lists: [],
    items: new Map(),
    filteredItems: new Map(),
    queue: null,
    context: null,
    meta: null,
    tags: [],
    loading: false,
    lastError: null,
  };

  get api(): YahtlApi | null {
    return this._api;
  }

  get hass(): HomeAssistant | null {
    return this._hass;
  }

  setHass(hass: HomeAssistant) {
    this._hass = hass;
    this._api = new YahtlApi(hass);
    this._ensureSubscribed();
  }

  // --- Live updates (yahatl/subscribe push events) ---

  /** Open the single push subscription, once per connection object. Safe to
   *  call from every setHass: it no-ops unless the connection changed. */
  private _ensureSubscribed() {
    const conn = this._hass?.connection;
    if (!conn || this._pushUnavailable) return;
    if (this._pushConn === conn) return; // already subscribed on this connection
    this._pushConn = conn;
    conn
      .subscribeMessage<{ list_id: string }>(
        (event) => this._onPushEvent(event),
        { type: "yahatl/subscribe" }
      )
      .catch((err: { code?: string; message?: string }) => {
        // Backend not restarted yet (or too old): degrade to manual refresh.
        this._pushConn = null;
        this._pushUnavailable = true;
        console.info(
          "yahatl: live updates unavailable (%s) — continuing without them",
          err?.code || err?.message || err
        );
      });
  }

  /** Collect pushed list ids and debounce ~400ms so save bursts coalesce
   *  into one round of refreshes. */
  private _onPushEvent(event: { list_id: string }) {
    if (!event?.list_id) return;
    if (event.list_id === "meta") this._pushedMeta = true;
    else this._pushedListIds.add(event.list_id);
    if (this._pushDebounce !== null) window.clearTimeout(this._pushDebounce);
    this._pushDebounce = window.setTimeout(() => {
      this._pushDebounce = null;
      void this._refreshFromPush();
    }, 400);
  }

  /** Refresh only what some card has actually loaded. Individual loads carry
   *  their own error handling and generation guards. */
  private async _refreshFromPush() {
    const listIds = [...this._pushedListIds];
    const metaChanged = this._pushedMeta;
    this._pushedListIds.clear();
    this._pushedMeta = false;

    const jobs: Promise<void>[] = [];

    if (metaChanged) {
      if (this.state.meta) jobs.push(this.loadMeta());
      if (this.state.context) jobs.push(this.loadContext());
    }

    for (const listId of listIds) {
      const entityId = `todo.${listId}`;
      // Full item lists any card has loaded for this entity.
      if (this.state.items.has(entityId)) jobs.push(this.loadItems(entityId));
      // Filtered fetches (e.g. inbox needs_detail) re-run with their filters.
      for (const f of this._filterFetches.values()) {
        if (f.entityId === entityId) jobs.push(this.loadItems(entityId, f.filters));
      }
    }

    if (listIds.length > 0) {
      // List membership/counts may have shifted, and the queue spans lists.
      if (this.state.lists.length > 0) jobs.push(this.loadLists());
      if (this.state.queue) jobs.push(this.loadQueue());
      if (this._tagsLoaded) jobs.push(this.loadTags());
    }

    await Promise.all(jobs);
  }

  subscribe(cb: Subscriber): () => void {
    this._subscribers.add(cb);
    return () => this._subscribers.delete(cb);
  }

  private _notify() {
    for (const cb of this._subscribers) cb();
  }

  // --- Error surface ---

  private _setError(err: unknown) {
    const message =
      (err as { message?: string })?.message || String(err) || "Unknown error";
    this.state.lastError = { message, at: Date.now() };
    this._notify();
  }

  clearError() {
    if (!this.state.lastError) return;
    this.state.lastError = null;
    this._notify();
  }

  private _notReady(): false {
    this._setError(new Error("Not connected to Home Assistant yet"));
    return false;
  }

  // --- Items cache keys ---

  private _hasFilters(filters?: ItemFilters): boolean {
    return !!filters && Object.keys(filters).length > 0;
  }

  /** Stable cache key for a filtered items fetch (sorted keys → stable sig). */
  private _filterKey(entityId: string, filters: ItemFilters): string {
    const f = filters as Record<string, unknown>;
    const sig = Object.keys(f)
      .sort()
      .map((k) => `${k}=${JSON.stringify(f[k])}`)
      .join("&");
    return `${entityId}|${sig}`;
  }

  /** Cached items for an entity. Filtered fetches live in their own map so
   *  they never overwrite the full lists other cards render (and vice versa). */
  getCachedItems(entityId: string, filters?: ItemFilters): YahtlItemSummary[] {
    return (
      (this._hasFilters(filters)
        ? this.state.filteredItems.get(this._filterKey(entityId, filters))
        : this.state.items.get(entityId)) ?? []
    );
  }

  // --- Data loading (failures land in state.lastError) ---

  async loadLists() {
    if (!this._api) return;
    try {
      this.state.lists = await this._api.getLists();
      this._notify();
    } catch (err) {
      this._setError(err);
    }
  }

  async loadItems(entityId: string, filters?: ItemFilters) {
    if (!this._api) return;
    try {
      const items = await this._api.getItems(entityId, filters);
      if (this._hasFilters(filters)) {
        const key = this._filterKey(entityId, filters);
        this.state.filteredItems.set(key, items);
        // Remember the filters so push events can re-run this exact fetch.
        this._filterFetches.set(key, { entityId, filters });
      } else {
        this.state.items.set(entityId, items);
      }
      this._notify();
    } catch (err) {
      this._setError(err);
    }
  }

  async loadQueue(overrides?: Parameters<YahtlApi["getQueue"]>[0]) {
    if (!this._api) return;
    const gen = ++this._queueGen;
    try {
      const queue = await this._api.getQueue(overrides);
      if (gen !== this._queueGen) return; // a newer load superseded this one
      this.state.queue = queue;
      this._notify();
    } catch (err) {
      if (gen !== this._queueGen) return;
      this._setError(err);
    }
  }

  async loadContext() {
    if (!this._api) return;
    try {
      this.state.context = await this._api.getContext();
      this._notify();
    } catch (err) {
      this._setError(err);
    }
  }

  async loadMeta() {
    if (!this._api) return;
    try {
      this.state.meta = await this._api.getMeta();
      this._notify();
    } catch (err) {
      this._setError(err);
    }
  }

  async loadTags() {
    if (!this._api) return;
    try {
      this.state.tags = await this._api.getTags();
      this._tagsLoaded = true;
      this._notify();
    } catch (err) {
      this._setError(err);
    }
  }

  // --- Mutations (call API then refresh) ---
  // Each returns true on success; on failure it records state.lastError and
  // returns false so callers can keep drafts / stay open instead of silently
  // pretending the write happened.

  async createItem(
    entityId: string,
    data: Parameters<YahtlApi["createItem"]>[1]
  ): Promise<boolean> {
    if (!this._api) return this._notReady();
    try {
      await this._api.createItem(entityId, data);
    } catch (err) {
      this._setError(err);
      return false;
    }
    this.clearError();
    await this.loadItems(entityId);
    await this.loadQueue();
    return true;
  }

  async saveItem(
    entityId: string,
    itemId: string,
    data: Partial<YahtlItem>
  ): Promise<boolean> {
    if (!this._api) return this._notReady();
    try {
      await this._api.saveItem(entityId, itemId, data);
    } catch (err) {
      this._setError(err);
      return false;
    }
    this.clearError();
    await this.loadItems(entityId);
    await this.loadQueue();
    return true;
  }

  async deleteItem(entityId: string, itemId: string): Promise<boolean> {
    if (!this._api) return this._notReady();
    try {
      await this._api.deleteItem(entityId, itemId);
    } catch (err) {
      this._setError(err);
      return false;
    }
    this.clearError();
    await this.loadItems(entityId);
    await this.loadQueue();
    return true;
  }

  async completeItem(entityId: string, itemId: string): Promise<boolean> {
    if (!this._api) return this._notReady();
    // Optimistically remove from queue for instant UI feedback; keep the
    // prior state so a failed call can roll back instead of "losing" the task.
    const prevQueue = this.state.queue;
    if (this.state.queue) {
      this.state.queue = {
        ...this.state.queue,
        items: this.state.queue.items.filter((e) => e.item.uid !== itemId),
      };
      this._notify();
    }
    try {
      await this._api.completeItem(entityId, itemId);
    } catch (err) {
      this.state.queue = prevQueue;
      this._setError(err); // notifies
      return false;
    }
    this.clearError();
    await this.loadItems(entityId);
    await this.loadQueue();
    return true;
  }

  /** Undo a completion: restore the item's pre-completion state (`prior` is
   *  captured from the item dict before completeItem ran). */
  async uncompleteItem(
    entityId: string,
    itemId: string,
    prior: UncompletePrior
  ): Promise<boolean> {
    if (!this._api) return this._notReady();
    try {
      await this._api.uncompleteItem(entityId, itemId, prior);
    } catch (err) {
      this._setError(err);
      return false;
    }
    this.clearError();
    await this.loadItems(entityId);
    await this.loadQueue();
    return true;
  }

  async deferItem(
    entityId: string,
    itemId: string,
    until: string | null
  ): Promise<boolean> {
    if (!this._api) return this._notReady();
    try {
      await this._api.deferItem(entityId, itemId, until);
    } catch (err) {
      this._setError(err);
      return false;
    }
    this.clearError();
    await this.loadItems(entityId);
    await this.loadQueue();
    return true;
  }

  /** Delay to next valid period (server-computed). Returns the new
   *  deferred_until ISO string so the UI can confirm when it'll be back,
   *  or null on failure (state.lastError is set, queue rolled back). */
  async delayItem(entityId: string, itemId: string): Promise<string | null> {
    if (!this._api) {
      this._notReady();
      return null;
    }
    // Optimistically drop from the queue for instant feedback; roll back on failure.
    const prevQueue = this.state.queue;
    if (this.state.queue) {
      this.state.queue = {
        ...this.state.queue,
        items: this.state.queue.items.filter((e) => e.item.uid !== itemId),
      };
      this._notify();
    }
    let updated: YahtlItem;
    try {
      updated = await this._api.delayItem(entityId, itemId);
    } catch (err) {
      this.state.queue = prevQueue;
      this._setError(err); // notifies
      return null;
    }
    this.clearError();
    await this.loadItems(entityId);
    await this.loadQueue();
    return updated?.deferred_until ?? null;
  }

  async setContext(ctx: Partial<ContextOverride>): Promise<boolean> {
    if (!this._api) return this._notReady();
    try {
      this.state.context = await this._api.setContext(ctx);
      this._notify();
    } catch (err) {
      this._setError(err);
      return false;
    }
    this.clearError();
    await this.loadQueue();
    return true;
  }

  async saveMeta(
    data: MetaConfig,
    renames?: Record<string, string>
  ): Promise<boolean> {
    if (!this._api) return this._notReady();
    try {
      this.state.meta = await this._api.setMeta(data, renames);
      this._notify();
    } catch (err) {
      this._setError(err);
      return false;
    }
    this.clearError();
    await this.loadQueue();
    return true;
  }

  async renameTag(oldName: string, newName: string): Promise<boolean> {
    if (!this._api) return this._notReady();
    try {
      await this._api.renameTag(oldName, newName);
    } catch (err) {
      this._setError(err);
      return false;
    }
    this.clearError();
    await this.loadTags();
    return true;
  }

  async deleteTag(name: string): Promise<boolean> {
    if (!this._api) return this._notReady();
    try {
      await this._api.deleteTag(name);
    } catch (err) {
      this._setError(err);
      return false;
    }
    this.clearError();
    await this.loadTags();
    return true;
  }

  async getItemDetails(entityId: string, itemId: string): Promise<YahtlItem | null> {
    if (!this._api) return null;
    return this._api.getItemDetails(entityId, itemId);
  }
}

// Singleton
export const store = new YahtlStore();

/** Small dismissible banner for the store's last error. Cards drop this into
 *  their template near the top; styling lives in sharedStyles (.store-error). */
export function renderStoreError() {
  const err = store.state.lastError;
  if (!err) return nothing;
  return html`
    <div class="store-error" role="alert" aria-live="polite">
      <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
      <span class="store-error__msg">${err.message}</span>
      <button
        class="store-error__dismiss"
        aria-label="Dismiss error"
        @click=${() => store.clearError()}
      >
        &times;
      </button>
    </div>
  `;
}

/**
 * Lit reactive controller that subscribes to the store
 * and triggers host updates on changes.
 */
export class StoreController implements ReactiveController {
  private _unsub?: () => void;

  constructor(private host: ReactiveControllerHost) {
    host.addController(this);
  }

  hostConnected() {
    this._unsub = store.subscribe(() => this.host.requestUpdate());
  }

  hostDisconnected() {
    this._unsub?.();
  }

  get state() {
    return store.state;
  }
}
