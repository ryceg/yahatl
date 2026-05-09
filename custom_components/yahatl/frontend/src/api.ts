import type {
  HomeAssistant,
  YahtlListInfo,
  YahtlItemSummary,
  YahtlItem,
  QueueResult,
  ContextOverride,
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
}
