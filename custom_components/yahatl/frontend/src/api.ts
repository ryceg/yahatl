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

export class YahtlApi {
  constructor(private hass: HomeAssistant) {}

  get userId(): string {
    return this.hass.user.id;
  }

  // --- Lists ---

  async getLists(): Promise<YahtlListInfo[]> {
    return this.hass.callWS({
      type: "yahatl/lists",
      user_id: this.userId,
    });
  }

  // --- Items ---

  async getItems(
    entityId: string,
    filters?: {
      status?: string;
      traits?: string[];
      tags?: string[];
      needs_detail?: boolean;
      assigned_to?: string;
    }
  ): Promise<YahtlItemSummary[]> {
    return this.hass.callWS({
      type: "yahatl/items_list",
      entity_id: entityId,
      ...filters,
    });
  }

  async getItemDetails(
    entityId: string,
    itemId: string
  ): Promise<YahtlItem> {
    return this.hass.callWS({
      type: "yahatl/item_details",
      entity_id: entityId,
      item_id: itemId,
    });
  }

  async createItem(
    entityId: string,
    data: Partial<YahtlItem> & { title: string }
  ): Promise<YahtlItem> {
    return this.hass.callWS({
      type: "yahatl/item_create",
      entity_id: entityId,
      ...data,
    });
  }

  async saveItem(
    entityId: string,
    itemId: string,
    data: Partial<YahtlItem>
  ): Promise<YahtlItem> {
    return this.hass.callWS({
      type: "yahatl/item_save",
      entity_id: entityId,
      item_id: itemId,
      ...data,
    });
  }

  async deleteItem(entityId: string, itemId: string): Promise<void> {
    await this.hass.callWS({
      type: "yahatl/item_delete",
      entity_id: entityId,
      item_id: itemId,
    });
  }

  async completeItem(
    entityId: string,
    itemId: string
  ): Promise<YahtlItem> {
    return this.hass.callWS({
      type: "yahatl/item_complete",
      entity_id: entityId,
      item_id: itemId,
      user_id: this.userId,
    });
  }

  /** Undo a completion: restore the item to its pre-completion state.
   *  `prior` holds the status/due/deferred_until captured BEFORE completing. */
  async uncompleteItem(
    entityId: string,
    itemId: string,
    prior: UncompletePrior
  ): Promise<YahtlItem> {
    return this.hass.callWS({
      type: "yahatl/item_uncomplete",
      entity_id: entityId,
      item_id: itemId,
      prior,
    });
  }

  async deferItem(
    entityId: string,
    itemId: string,
    deferredUntil: string | null
  ): Promise<YahtlItem> {
    return this.hass.callWS({
      type: "yahatl/item_defer",
      entity_id: entityId,
      item_id: itemId,
      deferred_until: deferredUntil,
    });
  }

  /** Delay an item to its next valid period (computed server-side from its
   *  schedule). Returns the updated item, incl. the new deferred_until. */
  async delayItem(entityId: string, itemId: string): Promise<YahtlItem> {
    return this.hass.callWS({
      type: "yahatl/item_delay",
      entity_id: entityId,
      item_id: itemId,
    });
  }

  // --- Queue ---

  async getQueue(overrides?: {
    available_time?: number;
    location?: string;
    people?: string[];
    contexts?: string[];
  }): Promise<QueueResult> {
    return this.hass.callWS({
      type: "yahatl/queue",
      user_id: this.userId,
      ...overrides,
    });
  }

  // --- Context ---

  async getContext(): Promise<ContextOverride> {
    return this.hass.callWS({ type: "yahatl/context_get" });
  }

  async setContext(
    ctx: Partial<ContextOverride>
  ): Promise<ContextOverride> {
    return this.hass.callWS({
      type: "yahatl/context_set",
      ...ctx,
    });
  }

  // --- Meta config ---

  async getMeta(): Promise<MetaConfig> {
    return this.hass.callWS({ type: "yahatl/meta_get" });
  }

  async setMeta(
    data: MetaConfig,
    renames?: Record<string, string>
  ): Promise<MetaConfig> {
    return this.hass.callWS({
      type: "yahatl/meta_set",
      data,
      ...(renames && Object.keys(renames).length > 0 ? { renames } : {}),
    });
  }

  // --- Tags ---

  async getTags(): Promise<TagInfo[]> {
    return this.hass.callWS({ type: "yahatl/tags_list" });
  }

  async renameTag(oldName: string, newName: string): Promise<void> {
    await this.hass.callWS({
      type: "yahatl/tag_rename",
      old_name: oldName,
      new_name: newName,
    });
  }

  async deleteTag(name: string): Promise<void> {
    await this.hass.callWS({
      type: "yahatl/tag_delete",
      name,
    });
  }
}
