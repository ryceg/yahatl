import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles, TRAIT_ICONS, TRAIT_RGB, PRIORITY_RGB, primaryTrait } from "../styles";
import { store, StoreController } from "../store";
import type { HomeAssistant, QueueEntry } from "../types";

@customElement("yahatl-queue-card")
export class YahtlQueueCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};
  @state() private _quickAddValue = "";
  @state() private _quickAddBusy = false;
  private _store = new StoreController(this);
  private _initialized = false;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .queue-controls {
        display: flex;
        gap: 8px;
        padding: 0 16px 12px;
        flex-wrap: wrap;
      }

      .queue-controls select {
        padding: 7px 10px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 8px;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        font-size: 13px;
        font-family: inherit;
      }

      .capture-row {
        display: flex;
        gap: 8px;
        padding: 0 16px 14px;
      }

      .capture-row input {
        flex: 1;
        padding: 9px 12px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 8px;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        font-size: 14px;
        font-family: inherit;
        -webkit-appearance: none;
      }

      .capture-row input:focus {
        outline: none;
        border-color: rgb(var(--rgb-primary-color));
      }

      .capture-row button {
        padding: 0 18px;
        border: none;
        border-radius: 8px;
        background: rgba(var(--rgb-primary-color), 0.20);
        color: rgb(var(--rgb-primary-color));
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
      }

      .capture-row button:active {
        opacity: 0.7;
      }

      .queue-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-top: 1px solid var(--yahatl-divider);
        gap: 12px;
        cursor: pointer;
        position: relative;
        transition: background-color 120ms ease;
        -webkit-tap-highlight-color: transparent;
      }

      .queue-item:hover {
        background: rgba(var(--rgb-primary-color), 0.05);
      }

      .queue-item:active {
        background: rgba(var(--rgb-primary-color), 0.08);
      }

      .queue-rank {
        min-width: 22px;
        font-weight: 700;
        font-size: 15px;
        color: rgb(var(--rgb-primary-color));
        text-align: center;
        flex: none;
      }

      .queue-info {
        flex: 1;
        min-width: 0;
      }

      .queue-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }

      .greeting {
        padding: 4px 16px 0;
        font-size: 12px;
        letter-spacing: 0.4px;
        color: var(--yahatl-text-secondary);
      }
    `,
  ];

  setConfig(config: Record<string, unknown>) {
    this._config = config;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      store.setHass(this.hass);
      store.loadQueue();
      store.loadLists();
    } else if (changed.has("hass") && this.hass) {
      store.setHass(this.hass);
    }
  }

  render() {
    const q = this._store.state.queue;
    const maxItems = (this._config.max_items as number) || 10;
    const title = (this._config.title as string) || "Up Next";
    const todoEntity = (this._config.todo_entity as string) || "";
    const items = q?.items.slice(0, maxItems) || [];
    const userName = this.hass?.user?.name;
    const ctx = this._store.state.context;

    return html`
      <ha-card>
        <div class="card-header">${title}</div>
        ${userName
          ? html`<div class="greeting">Hello, ${userName}</div>`
          : nothing}

        <div class="queue-controls" style="padding-top: 10px">
          <select @change=${(e: Event) => this._setLocation((e.target as HTMLSelectElement).value)}>
            <option value="">Location: any</option>
            ${this._getZones().map(
              (z) => html`<option value=${z.id} ?selected=${ctx?.location === z.id}>${z.name}</option>`
            )}
          </select>
          <select @change=${(e: Event) => this._setContextFilter((e.target as HTMLSelectElement).value)}>
            <option value="">Context: any</option>
            ${["focused_work", "calls_ok", "errands", "exercise", "relaxation"].map(
              (c) => html`<option value=${c} ?selected=${(ctx?.contexts || []).includes(c)}>${c.replace(/_/g, " ")}</option>`
            )}
          </select>
        </div>

        <div class="capture-row">
          <input
            type="text"
            placeholder="Quick add a task…"
            .value=${this._quickAddValue}
            @input=${(e: InputEvent) =>
              (this._quickAddValue = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") this._quickAdd(todoEntity);
            }}
            ?disabled=${this._quickAddBusy}
          />
          <button
            @click=${() => this._quickAdd(todoEntity)}
            ?disabled=${this._quickAddBusy || !this._quickAddValue.trim()}
          >
            add
          </button>
        </div>

        ${items.length === 0
          ? html`<div class="empty-state">Nothing in the queue</div>`
          : items.map((entry, i) => this._renderItem(entry, i, todoEntity))}
      </ha-card>
    `;
  }

  private _renderItem(entry: QueueEntry, index: number, todoEntity: string) {
    const item = entry.item;
    const trait = primaryTrait(item.traits);
    const traitRgb = trait ? TRAIT_RGB[trait] : "var(--rgb-primary-color)";
    const traitIcon = trait ? TRAIT_ICONS[trait] : "mdi:checkbox-marked-circle-outline";
    const due = this._formatDue(item.due);
    const entityId = todoEntity || `todo.${entry.list_id}`;

    return html`
      <div
        class="queue-item"
        style="--rgb-state: ${traitRgb}"
        @click=${() => this._openEditor(entityId, item.uid)}
      >
        ${item.priority
          ? html`<div class="priority-rail priority-rail--${item.priority}"></div>`
          : nothing}
        <div class="queue-rank">${index + 1}</div>
        <div class="mush-shape-icon">
          <ha-icon icon=${traitIcon}></ha-icon>
        </div>
        <div class="queue-info">
          <div class="mush-state-info__primary">${item.title}</div>
          <div class="queue-meta">
            ${due
              ? html`<span class=${due.className}>${due.label}</span>`
              : nothing}
            ${due && (item.time_estimate || item.tags.length)
              ? html`<span class="sep">·</span>`
              : nothing}
            ${item.time_estimate
              ? html`<span>${item.time_estimate}m</span>`
              : nothing}
            ${item.time_estimate && item.tags.length
              ? html`<span class="sep">·</span>`
              : nothing}
            ${item.tags.length > 0
              ? html`<span>${item.tags.map((t) => `#${t}`).join(" ")}</span>`
              : nothing}
            ${item.current_streak > 0
              ? html`<span class="sep">·</span><span>${item.current_streak} day streak</span>`
              : nothing}
          </div>
        </div>
        <div class="queue-score">${Math.round(entry.score)}</div>
        <div class="queue-actions">
          <button
            class="queue-btn"
            @click=${(e: Event) => {
              e.stopPropagation();
              this._complete(entityId, item.uid);
            }}
          >
            done
          </button>
        </div>
      </div>
    `;
  }

  private _formatDue(due: string | null): { label: string; className: string } | null {
    if (!due) return null;
    const d = new Date(due);
    const now = new Date();
    if (d < now) {
      const days = Math.ceil((now.getTime() - d.getTime()) / 86400000);
      return { label: `Overdue ${days}d`, className: "overdue" };
    }
    if (d.toDateString() === now.toDateString())
      return { label: "Today", className: "due-today" };
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString())
      return { label: "Tomorrow", className: "" };
    return { label: d.toLocaleDateString(), className: "" };
  }

  private async _complete(entityId: string, itemId: string) {
    await store.completeItem(entityId, itemId);
  }

  private async _quickAdd(todoEntity: string) {
    const title = this._quickAddValue.trim();
    if (!title) return;
    const entityId = todoEntity || this._store.state.lists[0]?.entity_id;
    if (!entityId) return;
    this._quickAddBusy = true;
    try {
      await store.createItem(entityId, { title });
      this._quickAddValue = "";
    } finally {
      this._quickAddBusy = false;
    }
  }

  private _getZones(): { id: string; name: string }[] {
    if (!this.hass?.states) return [];
    const zones: { id: string; name: string }[] = [];
    for (const [eid, state] of Object.entries(this.hass.states)) {
      if (eid.startsWith("zone.")) {
        const name = (state.attributes.friendly_name as string) || eid.replace("zone.", "");
        zones.push({ id: name.toLowerCase(), name });
      }
    }
    return zones;
  }

  private async _setLocation(location: string) {
    await store.setContext({ location: location || null });
  }

  private async _setContextFilter(ctx: string) {
    if (!ctx) {
      await store.setContext({ contexts: [] });
    } else {
      await store.setContext({ contexts: [ctx] });
    }
  }

  private _openEditor(entityId: string, itemId: string) {
    this.dispatchEvent(
      new CustomEvent("yahatl-open-editor", {
        detail: { entityId, itemId, hass: this.hass },
        bubbles: true,
        composed: true,
      })
    );
  }

  getCardSize() {
    return 4;
  }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "yahatl-queue-card",
  name: "Yahatl Queue",
  description: "Prioritized task queue with Mushroom-style layout",
});
