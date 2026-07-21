import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles, TRAIT_ICONS, TRAIT_RGB, primaryTrait } from "../styles";
import { store, StoreController } from "../store";
import { openItemEditor } from "../dialog";
import type { HomeAssistant, YahtlItemSummary } from "../types";

type FilterKey = "status" | "trait" | "tag";

interface Filters {
  status: string | null;
  trait: string | null;
  tag: string | null;
}

const STATUSES = ["pending", "in_progress", "completed", "missed"];
const TRAITS = ["actionable", "recurring", "habit", "chore", "reminder", "note"];

@customElement("yahatl-list-card")
export class YahtlListCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};
  @state() private _activeListIdx = 0;
  @state() private _filters: Filters = { status: null, trait: null, tag: null };
  @state() private _showFilters = false;
  private _store = new StoreController(this);
  private _initialized = false;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      /* Tab bar */
      .tabs {
        display: flex;
        overflow-x: auto;
        border-bottom: 1px solid var(--yahatl-divider);
        -webkit-overflow-scrolling: touch;
        padding: 0 8px;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      .tab {
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 500;
        border: none;
        border-bottom: 2px solid transparent;
        background: none;
        color: var(--yahatl-text-secondary);
        cursor: pointer;
        white-space: nowrap;
        letter-spacing: 0.1px;
        margin-bottom: -1px;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        transition: color 180ms ease, border-color 180ms ease;
      }

      .tab.active {
        color: rgb(var(--rgb-primary-color));
        border-bottom-color: rgb(var(--rgb-primary-color));
      }

      /* Filter toggle row */
      .filter-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
      }

      .filter-toggle__count {
        font-size: 13px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
      }

      .filter-toggle__btn {
        font-size: 13px;
        background: none;
        border: none;
        color: rgb(var(--rgb-primary-color));
        cursor: pointer;
        padding: 4px 8px;
        font-family: inherit;
        font-weight: 500;
        letter-spacing: 0.1px;
        -webkit-tap-highlight-color: transparent;
      }

      .active-filter-badge {
        font-size: 11px;
        font-weight: 700;
        background: rgba(var(--rgb-primary-color), 0.20);
        color: rgb(var(--rgb-primary-color));
        border-radius: 10px;
        padding: 2px 7px;
        margin-left: 4px;
      }

      /* Filter area */
      .filters {
        padding: 0 16px 10px;
      }

      .filter-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 500;
        color: var(--yahatl-text-secondary);
        margin-bottom: 6px;
        margin-top: 8px;
      }

      .filter-label:first-child {
        margin-top: 0;
      }

      /* Item rows */
      .item-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-top: 1px solid var(--yahatl-divider);
        cursor: pointer;
        position: relative;
        -webkit-tap-highlight-color: transparent;
        transition: background-color 120ms ease;
      }

      .item-row:hover {
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .item-row:active {
        background: rgba(var(--rgb-primary-color), 0.08);
      }

      .item-info {
        flex: 1;
        min-width: 0;
      }

      .item-title {
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        letter-spacing: 0.1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-title--done {
        text-decoration: line-through;
        opacity: 0.6;
      }

      .item-tags {
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
      }

      .item-badges {
        display: flex;
        gap: 6px;
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
        margin-top: 2px;
        flex-wrap: wrap;
      }

      .item-badges .streak {
        color: rgb(var(--rgb-state-streak));
        font-weight: 500;
      }

      .item-badges .overdue {
        color: rgb(var(--rgb-state-overdue));
        font-weight: 500;
      }

      .item-badges .due-today {
        color: rgb(var(--rgb-state-due-today));
        font-weight: 500;
      }

      .item-badges .needs-detail {
        color: rgb(var(--rgb-warning));
        font-weight: 500;
      }

      .item-badges .deferred {
        color: rgb(var(--rgb-state-deferred));
      }
    `,
  ];

  setConfig(config: Record<string, unknown>) {
    this._config = config;
  }

  static getStubConfig(): Record<string, unknown> {
    return {};
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      store.setHass(this.hass);
      store.loadLists();
      this._loadActiveList();
    } else if (changed.has("hass") && this.hass) {
      store.setHass(this.hass);
    }
  }

  render() {
    const lists = this._store.state.lists;
    const activeList = lists[this._activeListIdx];
    const entityId = activeList?.entity_id || "";
    const items = this._store.state.items.get(entityId) || [];
    const filtered = this._applyFilters(items);
    const filterCount = Object.values(this._filters).filter(Boolean).length;

    return html`
      <ha-card>
        ${lists.length > 0
          ? html`
              <div class="tabs">
                ${lists.map(
                  (list, i) => html`
                    <button
                      class="tab ${i === this._activeListIdx ? "active" : ""}"
                      @click=${() => this._selectList(i)}
                    >
                      ${list.name}
                    </button>
                  `
                )}
              </div>
            `
          : nothing}

        <div class="filter-toggle">
          <span class="filter-toggle__count">${filtered.length} items</span>
          <button class="filter-toggle__btn" @click=${() => (this._showFilters = !this._showFilters)}>
            Filters${filterCount > 0
              ? html`<span class="active-filter-badge">${filterCount}</span>`
              : nothing}
          </button>
        </div>

        ${this._showFilters ? this._renderFilters() : nothing}

        ${filtered.length === 0
          ? html`<div class="empty-state">No items match</div>`
          : filtered.map((item) => this._renderItem(item, entityId))}
      </ha-card>
    `;
  }

  private _renderFilters() {
    return html`
      <div class="filters">
        <div class="filter-label">Status</div>
        <div class="chips-strip" style="padding: 0 0 4px">
          ${STATUSES.map(
            (s) => html`
              <button
                class="mush-chip ${this._filters.status === s ? "mush-chip--filled" : ""}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => this._toggleFilter("status", s)}
              >
                ${s.replace("_", " ")}
              </button>
            `
          )}
        </div>
        <div class="filter-label">Traits</div>
        <div class="chips-strip" style="padding: 0">
          ${TRAITS.map(
            (t) => html`
              <button
                class="mush-chip ${this._filters.trait === t ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: ${TRAIT_RGB[t]}"
                @click=${() => this._toggleFilter("trait", t)}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${TRAIT_ICONS[t]}></ha-icon>
                </span>
                ${t}
              </button>
            `
          )}
        </div>
      </div>
    `;
  }

  private _renderItem(item: YahtlItemSummary, entityId: string) {
    const isCompleted = item.status === "completed";
    const trait = primaryTrait(item.traits);
    const traitRgb = trait ? TRAIT_RGB[trait] : "var(--rgb-primary-color)";
    const traitIcon = trait ? TRAIT_ICONS[trait] : "";
    const due = this._formatDue(item.due);
    const isDeferred = item.deferred_until && new Date(item.deferred_until) > new Date();

    return html`
      <div
        class="item-row"
        style="--rgb-state: ${traitRgb}"
        @click=${() => this._openEditor(entityId, item.uid)}
      >
        ${item.priority
          ? html`<div class="priority-rail priority-rail--${item.priority}"></div>`
          : nothing}

        <div
          class="item-check ${isCompleted ? "item-check--done" : ""}"
          @click=${(e: Event) => {
            e.stopPropagation();
            if (!isCompleted) this._complete(entityId, item.uid);
          }}
        ></div>

        ${traitIcon
          ? html`<div class="mush-shape-icon mush-shape-icon--sm">
              <ha-icon icon=${traitIcon}></ha-icon>
            </div>`
          : nothing}

        <div class="item-info">
          <div class="item-title ${isCompleted ? "item-title--done" : ""}">
            ${item.title}
          </div>
          <div class="item-badges">
            ${due
              ? html`<span class=${due.className}>${due.label}</span>`
              : nothing}
            ${item.time_estimate
              ? html`<span>${item.time_estimate}m</span>`
              : nothing}
            ${item.has_recurrence ? html`<span>repeats</span>` : nothing}
            ${item.current_streak > 0
              ? html`<span class="streak">${item.current_streak}d streak</span>`
              : nothing}
            ${item.needs_detail
              ? html`<span class="needs-detail">needs detail</span>`
              : nothing}
            ${isDeferred
              ? html`<span class="deferred">deferred</span>`
              : nothing}
          </div>
        </div>

        ${item.tags.length > 0
          ? html`<span class="item-tags">${item.tags.map((t) => `#${t}`).join(" ")}</span>`
          : nothing}
      </div>
    `;
  }

  private _applyFilters(items: YahtlItemSummary[]): YahtlItemSummary[] {
    let result = items;
    if (this._filters.status) {
      result = result.filter((i) => i.status === this._filters.status);
    }
    if (this._filters.trait) {
      result = result.filter((i) => i.traits.includes(this._filters.trait!));
    }
    if (this._filters.tag) {
      result = result.filter((i) => i.tags.includes(this._filters.tag!));
    }
    return result;
  }

  private _toggleFilter(key: FilterKey, value: string) {
    this._filters = {
      ...this._filters,
      [key]: this._filters[key] === value ? null : value,
    };
  }

  private _selectList(index: number) {
    this._activeListIdx = index;
    this._loadActiveList();
  }

  private async _loadActiveList() {
    const lists = this._store.state.lists;
    const activeList = lists[this._activeListIdx];
    if (activeList) {
      await store.loadItems(activeList.entity_id);
    }
  }

  private async _complete(entityId: string, itemId: string) {
    await store.completeItem(entityId, itemId);
  }

  private _openEditor(entityId: string, itemId: string) {
    openItemEditor(this, { entityId, itemId, hass: this.hass });
  }

  private _formatDue(
    due: string | null
  ): { label: string; className: string } | null {
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

  getCardSize() {
    return 6;
  }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "yahatl-list-card",
  name: "Yahatl List",
  description: "Filterable item browser with Mushroom chips and trait icons",
});
