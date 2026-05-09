import { ReactiveController, ReactiveControllerHost } from "lit";
import { YahtlApi } from "./api";
import type {
  HomeAssistant,
  YahtlListInfo,
  YahtlItemSummary,
  YahtlItem,
  QueueResult,
  ContextOverride,
} from "./types";

type Subscriber = () => void;

interface StoreState {
  lists: YahtlListInfo[];
  items: Map<string, YahtlItemSummary[]>; // entityId -> items
  queue: QueueResult | null;
  context: ContextOverride | null;
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

  async setContext(ctx: Partial<ContextOverride>) {
    if (!this._api) return;
    this.state.context = await this._api.setContext(ctx);
    await this.loadQueue();
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
