/**
 * Home Assistant API client for yahatl
 */

import axios, { AxiosInstance } from 'axios';
import type { YahtlItem, YahtlList, QueueItem, ContextState, PomodoroState, Trait } from '../types';

export class YahtlApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private token: string;

  constructor(haUrl: string, haToken: string) {
    this.baseUrl = haUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = haToken;

    this.client = axios.create({
      baseURL: `${this.baseUrl}/api`,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Test connection to Home Assistant
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/');
      return response.data.message === 'API running.';
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get all yahatl lists
   */
  async getLists(): Promise<YahtlList[]> {
    const response = await this.client.get('/states');
    const entities = response.data;

    // Filter for yahatl todo entities
    const yahtlEntities = entities.filter((e: any) =>
      e.entity_id.startsWith('todo.') && e.attributes.integration === 'yahatl'
    );

    // For each entity, get the full list data via service call
    const lists: YahtlList[] = [];
    for (const entity of yahtlEntities) {
      // The attributes should contain our yahatl data
      const listData = entity.attributes.list_data;
      if (listData) {
        lists.push(listData);
      }
    }

    return lists;
  }

  /**
   * Get a specific list
   */
  async getList(entityId: string): Promise<YahtlList | null> {
    const response = await this.client.get(`/states/${entityId}`);
    return response.data.attributes.list_data || null;
  }

  /**
   * Get all items from a list
   */
  async getItems(entityId: string): Promise<YahtlItem[]> {
    const list = await this.getList(entityId);
    return list?.items || [];
  }

  /**
   * Add a new item
   */
  async addItem(
    entityId: string,
    title: string,
    options: {
      description?: string;
      traits?: Trait[];
      tags?: string[];
      due?: string;
      time_estimate?: number;
      needs_detail?: boolean;
    } = {}
  ): Promise<void> {
    await this.client.post('/services/yahatl/add_item', {
      entity_id: entityId,
      title,
      ...options,
    });
  }

  /**
   * Update an item
   */
  async updateItem(
    entityId: string,
    itemId: string,
    updates: Partial<YahtlItem>
  ): Promise<void> {
    await this.client.post('/services/yahatl/update_item', {
      entity_id: entityId,
      item_id: itemId,
      ...updates,
    });
  }

  /**
   * Complete an item
   */
  async completeItem(
    entityId: string,
    itemId: string,
    userId?: string
  ): Promise<void> {
    await this.client.post('/services/yahatl/complete_item', {
      entity_id: entityId,
      item_id: itemId,
      user_id: userId,
    });
  }

  /**
   * Delete an item
   */
  async deleteItem(entityId: string, itemId: string): Promise<void> {
    await this.client.post('/services/todo/remove_item', {
      entity_id: entityId,
      item: itemId,
    });
  }

  /**
   * Set traits on an item
   */
  async setTraits(
    entityId: string,
    itemId: string,
    traits: Trait[]
  ): Promise<void> {
    await this.client.post('/services/yahatl/set_traits', {
      entity_id: entityId,
      item_id: itemId,
      traits,
    });
  }

  /**
   * Add tags to an item
   */
  async addTags(
    entityId: string,
    itemId: string,
    tags: string[]
  ): Promise<void> {
    await this.client.post('/services/yahatl/add_tags', {
      entity_id: entityId,
      item_id: itemId,
      tags,
    });
  }

  /**
   * Remove tags from an item
   */
  async removeTags(
    entityId: string,
    itemId: string,
    tags: string[]
  ): Promise<void> {
    await this.client.post('/services/yahatl/remove_tags', {
      entity_id: entityId,
      item_id: itemId,
      tags,
    });
  }

  /**
   * Flag an item as needing detail
   */
  async flagNeedsDetail(
    entityId: string,
    itemId: string,
    needsDetail: boolean = true
  ): Promise<void> {
    await this.client.post('/services/yahatl/flag_needs_detail', {
      entity_id: entityId,
      item_id: itemId,
      needs_detail: needsDetail,
    });
  }

  /**
   * Get the priority queue
   */
  async getQueue(context?: ContextState): Promise<QueueItem[]> {
    const response = await this.client.post('/services/yahatl/get_queue', {
      ...context,
    });

    // The queue is returned via event, but for simplicity we'll poll the sensor
    // In a real implementation, you'd subscribe to events
    const queueResponse = await this.client.get('/states/sensor.yahatl_queue');
    return queueResponse.data.attributes.items || [];
  }

  /**
   * Update context
   */
  async updateContext(context: ContextState): Promise<void> {
    await this.client.post('/services/yahatl/update_context', context);
  }

  /**
   * Start a pomodoro timer
   */
  async startPomodoro(itemId: string): Promise<void> {
    await this.client.post('/services/yahatl/start_pomodoro', {
      item_id: itemId,
    });
  }

  /**
   * Stop the pomodoro timer
   */
  async stopPomodoro(): Promise<void> {
    await this.client.post('/services/yahatl/stop_pomodoro', {});
  }

  /**
   * Get pomodoro status
   */
  async getPomodoroStatus(): Promise<PomodoroState | null> {
    const response = await this.client.post('/services/yahatl/pomodoro_status', {});
    return response.data || null;
  }
}

export default YahtlApiClient;
