import { ReactiveController, ReactiveControllerHost } from "lit";
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
} from "./types";

type Subscriber = () => void;

interface StoreState {
  lists: YahtlListInfo[];
  items: Map<string, YahtlItemSummary[]>; // entityId -> items
  queue: QueueResult | null;
  context: ContextOverride | null;
  meta: MetaConfig | null;
  tags: TagInfo[];
  loading: boolean;
}

class YahtlStore {
  private _api: YahtlApi | null = null;
  private _hass: HomeAssistant | null = null;
  private _subscribers = new Set<Subscriber>();

  state: StoreState = {
    lists: [],
    items: new Map(),
    queue: null,
    context: null,
    meta: null,
    tags: [],
    loading: false,
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
  }

  subscribe(cb: Subscriber): () => void {
    this._subscribers.add(cb);
    return () => this._subscribers.delete(cb);
  }

  private _notify() {
    for (const cb of this._subscribers) cb();
  }

  // --- Data loading ---

  async loadLists() {
    if (!this._api) return;
    this.state.lists = await this._api.getLists();
    this._notify();
  }

  async loadItems(entityId: string, filters?: Parameters<YahtlApi["getItems"]>[1]) {
    if (!this._api) return;
    const items = await this._api.getItems(entityId, filters);
    this.state.items.set(entityId, items);
    this._notify();
  }

  async loadQueue(overrides?: Parameters<YahtlApi["getQueue"]>[0]) {
    if (!this._api) return;
    this.state.queue = await this._api.getQueue(overrides);
    this._notify();
  }

  async loadContext() {
    if (!this._api) return;
    this.state.context = await this._api.getContext();
    this._notify();
  }

  async loadMeta() {
    if (!this._api) return;
    this.state.meta = await this._api.getMeta();
    this._notify();
  }

  async loadTags() {
    if (!this._api) return;
    this.state.tags = await this._api.getTags();
    this._notify();
  }

  // --- Mutations (call API then refresh) ---

  async createItem(entityId: string, data: Parameters<YahtlApi["createItem"]>[1]) {
    if (!this._api) return;
    await this._api.createItem(entityId, data);
    await this.loadItems(entityId);
    await this.loadQueue();
  }

  async saveItem(entityId: string, itemId: string, data: Partial<YahtlItem>) {
    if (!this._api) return;
    await this._api.saveItem(entityId, itemId, data);
    await this.loadItems(entityId);
    await this.loadQueue();
  }

  async deleteItem(entityId: string, itemId: string) {
    if (!this._api) return;
    await this._api.deleteItem(entityId, itemId);
    await this.loadItems(entityId);
    await this.loadQueue();
  }

  async completeItem(entityId: string, itemId: string) {
    if (!this._api) return;
    // Optimistically remove from queue for instant UI feedback
    if (this.state.queue) {
      this.state.queue = {
        ...this.state.queue,
        items: this.state.queue.items.filter((e) => e.item.uid !== itemId),
      };
      this._notify();
    }
    await this._api.completeItem(entityId, itemId);
    await this.loadItems(entityId);
    await this.loadQueue();
  }

  async deferItem(entityId: string, itemId: string, until: string | null) {
    if (!this._api) return;
    await this._api.deferItem(entityId, itemId, until);
    await this.loadItems(entityId);
    await this.loadQueue();
  }

  /** Delay to next valid period (server-computed). Returns the new
   *  deferred_until ISO string so the UI can confirm when it'll be back. */
  async delayItem(entityId: string, itemId: string): Promise<string | null> {
    if (!this._api) return null;
    // Optimistically drop from the queue for instant feedback.
    if (this.state.queue) {
      this.state.queue = {
        ...this.state.queue,
        items: this.state.queue.items.filter((e) => e.item.uid !== itemId),
      };
      this._notify();
    }
    const updated = await this._api.delayItem(entityId, itemId);
    await this.loadItems(entityId);
    await this.loadQueue();
    return updated?.deferred_until ?? null;
  }

  async setContext(ctx: Partial<ContextOverride>) {
    if (!this._api) return;
    this.state.context = await this._api.setContext(ctx);
    await this.loadQueue();
  }

  async saveMeta(data: MetaConfig, renames?: Record<string, string>) {
    if (!this._api) return;
    this.state.meta = await this._api.setMeta(data, renames);
    this._notify();
    await this.loadQueue();
  }

  async renameTag(oldName: string, newName: string) {
    if (!this._api) return;
    await this._api.renameTag(oldName, newName);
    await this.loadTags();
  }

  async deleteTag(name: string) {
    if (!this._api) return;
    await this._api.deleteTag(name);
    await this.loadTags();
  }

  async getItemDetails(entityId: string, itemId: string): Promise<YahtlItem | null> {
    if (!this._api) return null;
    return this._api.getItemDetails(entityId, itemId);
  }
}

// Singleton
export const store = new YahtlStore();

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
