import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles, TRAIT_ICONS, TRAIT_RGB, primaryTrait } from "../styles";
import { store, StoreController, renderStoreError } from "../store";
import { formatDue } from "../format";
import { keyActivate } from "../a11y";
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
  @state() private _showNotYet = false;
  @state() private _showDeferred = false;
  @state() private _showCompleted = false;
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
        color: rgb(var(--yahatl-rgb-primary));
        border-bottom-color: rgb(var(--yahatl-rgb-primary));
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
        color: rgb(var(--yahatl-rgb-primary));
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
        background: rgba(var(--yahatl-rgb-primary), 0.20);
        color: rgb(var(--yahatl-rgb-primary));
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
        background: rgba(var(--yahatl-rgb-primary), 0.04);
      }

      .item-row:active {
        background: rgba(var(--yahatl-rgb-primary), 0.08);
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

      /* Collapsible group headers (deferred / completed) */
      .group-header {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 12px 16px;
        border: none;
        border-top: 1px solid var(--yahatl-divider);
        background: none;
        cursor: pointer;
        font-family: inherit;
        color: var(--yahatl-text-secondary);
        -webkit-tap-highlight-color: transparent;
        transition: background-color 120ms ease;
      }

      .group-header:hover {
        background: rgba(var(--yahatl-rgb-primary), 0.04);
      }

      .group-header:active {
        background: rgba(var(--yahatl-rgb-primary), 0.08);
      }

      .group-header__icon {
        --mdc-icon-size: 18px;
        color: var(--yahatl-text-secondary);
      }

      .group-header__label {
        flex: 1;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .group-header__count {
        font-size: 12px;
        font-weight: 700;
        background: rgba(var(--yahatl-rgb-primary), 0.12);
        color: var(--yahatl-text-secondary);
        border-radius: 10px;
        padding: 1px 8px;
      }

      .group-header__chevron {
        --mdc-icon-size: 20px;
        transition: transform 180ms ease;
      }

      .group-header--open .group-header__chevron {
        transform: rotate(180deg);
      }
    `,
  ];

  setConfig(config: Record<string, unknown>) {
    this._config = config;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("yahatl-list-card-editor");
  }

  static getStubConfig(): Record<string, unknown> {
    return {};
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      store.setHass(this.hass);
      void this._initialLoad();
    } else if (changed.has("hass") && this.hass) {
      store.setHass(this.hass);
    }
  }

  /** Load lists first, THEN the active list's items — _loadActiveList reads
   *  state.lists, so firing both un-awaited left the first tab empty until
   *  the user tapped around. */
  private async _initialLoad() {
    await store.loadLists();
    await this._loadActiveList();
  }

  render() {
    const lists = this._store.state.lists;
    const activeList = lists[this._activeListIdx];
    const entityId = activeList?.entity_id || "";
    const items = this._store.state.items.get(entityId) || [];
    const filtered = this._applyFilters(items);
    const filterCount = Object.values(this._filters).filter(Boolean).length;

    // "Not Yet" = items an automatic blocker (lead-time, time window, or a
    // dependency) is holding out of the active list. Manual deferral is checked
    // first so those items keep their own "Deferred" group; a block_reason on a
    // non-deferred item means it's automatically held.
    const active: YahtlItemSummary[] = [];
    const notYet: YahtlItemSummary[] = [];
    const deferred: YahtlItemSummary[] = [];
    const completed: YahtlItemSummary[] = [];
    for (const item of filtered) {
      if (item.status === "completed") completed.push(item);
      else if (this._isDeferred(item)) deferred.push(item);
      else if (item.block_reason) notYet.push(item);
      else active.push(item);
    }

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
        ${renderStoreError()}

        <div class="filter-toggle">
          <span class="filter-toggle__count">${active.length} items</span>
          <button class="filter-toggle__btn" @click=${() => (this._showFilters = !this._showFilters)}>
            Filters${filterCount > 0
              ? html`<span class="active-filter-badge">${filterCount}</span>`
              : nothing}
          </button>
        </div>

        ${this._showFilters ? this._renderFilters() : nothing}

        ${filtered.length === 0
          ? html`<div class="empty-state">No items match</div>`
          : nothing}
        ${active.map((item) => this._renderItem(item, entityId))}
        ${notYet.length > 0
          ? this._renderGroup(
              "Not Yet",
              "mdi:timer-sand",
              notYet,
              entityId,
              this._showNotYet,
              () => (this._showNotYet = !this._showNotYet)
            )
          : nothing}
        ${deferred.length > 0
          ? this._renderGroup(
              "Deferred",
              "mdi:clock-outline",
              deferred,
              entityId,
              this._showDeferred,
              () => (this._showDeferred = !this._showDeferred)
            )
          : nothing}
        ${completed.length > 0
          ? this._renderGroup(
              "Completed",
              "mdi:check-circle-outline",
              completed,
              entityId,
              this._showCompleted,
              () => (this._showCompleted = !this._showCompleted)
            )
          : nothing}
      </ha-card>
    `;
  }

  private _renderGroup(
    label: string,
    icon: string,
    items: YahtlItemSummary[],
    entityId: string,
    expanded: boolean,
    toggle: () => void
  ) {
    return html`
      <button
        class="group-header ${expanded ? "group-header--open" : ""}"
        @click=${toggle}
      >
        <ha-icon class="group-header__icon" icon=${icon}></ha-icon>
        <span class="group-header__label">${label}</span>
        <span class="group-header__count">${items.length}</span>
        <ha-icon class="group-header__chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${expanded
        ? items.map((item) => this._renderItem(item, entityId))
        : nothing}
    `;
  }

  private _isDeferred(item: YahtlItemSummary): boolean {
    return (
      !!item.deferred_until && new Date(item.deferred_until) > new Date()
    );
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
                style="--rgb-state: var(--yahatl-rgb-primary)"
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
    const traitRgb = trait ? TRAIT_RGB[trait] : "var(--yahatl-rgb-primary)";
    const traitIcon = trait ? TRAIT_ICONS[trait] : "";
    const due = formatDue(item.due);
    const isDeferred = this._isDeferred(item);

    return html`
      <div
        class="item-row"
        style="--rgb-state: ${traitRgb}"
        role="button"
        tabindex="0"
        @click=${() => this._openEditor(entityId, item.uid)}
        @keydown=${keyActivate(() => this._openEditor(entityId, item.uid))}
      >
        ${item.priority
          ? html`<div class="priority-rail priority-rail--${item.priority}"></div>`
          : nothing}

        <div
          class="item-check ${isCompleted ? "item-check--done" : ""}"
          role="button"
          tabindex="0"
          aria-label="Complete ${item.title}"
          @click=${(e: Event) => {
            e.stopPropagation();
            if (!isCompleted) this._complete(entityId, item.uid);
          }}
          @keydown=${keyActivate((e: Event) => {
            e.stopPropagation();
            if (!isCompleted) this._complete(entityId, item.uid);
          })}
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
            ${item.private ? html`<span>private</span>` : nothing}
            ${isDeferred
              ? html`<span class="deferred">deferred</span>`
              : nothing}
            ${item.block_reason && !isDeferred
              ? html`<span class="deferred">${item.block_reason}</span>`
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

  getCardSize() {
    return 6;
  }
}

/** Config editor: the list card is honestly zero-config (it discovers every
 *  yahatl list and tabs between them), so the editor just says so instead of
 *  inventing dead fields. */
@customElement("yahatl-list-card-editor")
export class YahtlListCardEditor extends LitElement {
  setConfig(_config: Record<string, unknown>) {}

  render() {
    return html`
      <p style="color: var(--secondary-text-color); font-size: 14px">
        No options — this card automatically shows all your yahatl lists as
        tabs, with filters built in.
      </p>
    `;
  }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "yahatl-list-card",
  name: "Yahatl List",
  description: "Filterable item browser with Mushroom chips and trait icons",
});
