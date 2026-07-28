import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { sharedStyles, TRAIT_ICONS, TRAIT_RGB, primaryTrait } from "../styles";
import { store, StoreController, renderStoreError } from "../store";
import { formatDue } from "../format";
import { keyActivate } from "../a11y";
import { showSnackbar } from "./yahatl-snackbar";
import { openItemEditor } from "../dialog";
import type { HomeAssistant, QueueEntry, QueueResult } from "../types";

@customElement("yahatl-queue-card")
export class YahtlQueueCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};
  @state() private _quickAddValue = "";
  @state() private _quickAddBusy = false;
  @state() private _flash = "";
  @state() private _showUpcoming = false;
  private _store = new StoreController(this);
  private _initialized = false;

  // Swipe-gesture drag state (touch only)
  private _drag = {
    id: "",
    entity: "",
    startX: 0,
    startY: 0,
    dx: 0,
    active: false,
    moved: false,
    el: null as HTMLElement | null,
  };
  private static readonly SWIPE_THRESHOLD = 80;
  private static readonly SWIPE_MAX = 140;

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
        border-color: rgb(var(--yahatl-rgb-primary));
      }

      .capture-row button {
        padding: 0 18px;
        border: none;
        border-radius: 8px;
        background: rgba(var(--yahatl-rgb-primary), 0.20);
        color: rgb(var(--yahatl-rgb-primary));
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
        position: relative;
        border-top: 1px solid var(--yahatl-divider);
        overflow: hidden;
      }

      /* Foreground row (slides during swipe) */
      .queue-item__fg {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
        cursor: pointer;
        position: relative;
        background: var(--yahatl-card-bg);
        transition: background-color 120ms ease;
        -webkit-tap-highlight-color: transparent;
        touch-action: pan-y;
      }

      .queue-item__fg:hover {
        background: rgba(var(--yahatl-rgb-primary), 0.05);
      }

      /* Swipe reveal layers behind the row */
      .swipe-hint {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 22px;
        color: #fff;
        font-weight: 600;
        font-size: 15px;
        opacity: 0;
        pointer-events: none;
      }

      .swipe-hint ha-icon {
        --mdc-icon-size: 22px;
      }

      .swipe-hint--done {
        justify-content: flex-start;
        background: rgb(var(--rgb-success));
      }

      .swipe-hint--delay {
        justify-content: flex-end;
        background: rgb(var(--rgb-warning));
      }

      /* On touch devices, swipe replaces the action buttons */
      @media (pointer: coarse) {
        .queue-actions {
          display: none;
        }
      }

      .queue-rank {
        min-width: 22px;
        font-weight: 700;
        font-size: 15px;
        color: rgb(var(--yahatl-rgb-primary));
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

      .queue-btn--ghost {
        background: rgba(var(--rgb-primary-text-color), 0.06);
        color: var(--yahatl-text-secondary);
      }

      .flash {
        margin: 4px 16px 0;
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(var(--yahatl-rgb-primary), 0.12);
        color: rgb(var(--yahatl-rgb-primary));
        font-size: 13px;
        font-weight: 500;
      }

      /* "Not yet" (lead-blocked / upcoming) group */
      .upcoming-header {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 12px 16px;
        margin-top: 4px;
        border: none;
        border-top: 1px solid var(--yahatl-divider);
        background: none;
        cursor: pointer;
        font-family: inherit;
        color: var(--yahatl-text-secondary);
        -webkit-tap-highlight-color: transparent;
      }

      .upcoming-header__label {
        flex: 1;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .upcoming-header__count {
        font-size: 12px;
        font-weight: 700;
        background: rgba(var(--yahatl-rgb-primary), 0.12);
        color: var(--yahatl-text-secondary);
        border-radius: 10px;
        padding: 1px 8px;
      }

      .upcoming-header__chevron {
        --mdc-icon-size: 20px;
        transition: transform 180ms ease;
      }

      .upcoming-header--open .upcoming-header__chevron {
        transform: rotate(180deg);
      }

      .upcoming-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 16px;
        border-top: 1px solid var(--yahatl-divider);
        opacity: 0.75;
      }

      .upcoming-row__title {
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .upcoming-row__reason {
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        white-space: nowrap;
        letter-spacing: 0.2px;
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
      store.loadMeta();
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
        ${renderStoreError()}
        ${this._flash ? html`<div class="flash">${this._flash}</div>` : nothing}

        <div class="queue-controls" style="padding-top: 10px">
          <select @change=${(e: Event) => this._setLocation((e.target as HTMLSelectElement).value)}>
            <option value="">Location: any</option>
            ${this._getZones().map(
              (z) => html`<option value=${z.id} ?selected=${ctx?.location === z.id}>${z.name}</option>`
            )}
          </select>
          <select @change=${(e: Event) => this._setContextFilter((e.target as HTMLSelectElement).value)}>
            <option value="">Context: any</option>
            ${(this._store.state.meta?.contexts || []).map(
              (c) => html`<option value=${c.id} ?selected=${(ctx?.contexts || []).includes(c.id)}>${c.name}</option>`
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
          : repeat(
              items,
              (entry) => entry.item.uid,
              (entry, i) => this._renderItem(entry, i, todoEntity)
            )}
        ${this._renderUpcoming(q)}
      </ha-card>
    `;
  }

  /** Collapsible "Not yet" group: items a blocker (lead-time, time window,
   *  dependency) is holding out of the queue, each with its reason. */
  private _renderUpcoming(q: QueueResult | null) {
    const upcoming = q?.upcoming || [];
    if (!upcoming.length) return nothing;
    return html`
      <button
        class="upcoming-header ${this._showUpcoming ? "upcoming-header--open" : ""}"
        @click=${() => (this._showUpcoming = !this._showUpcoming)}
      >
        <ha-icon icon="mdi:clock-outline"></ha-icon>
        <span class="upcoming-header__label">Not yet</span>
        <span class="upcoming-header__count">${upcoming.length}</span>
        <ha-icon class="upcoming-header__chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${this._showUpcoming
        ? upcoming.map(
            (entry) => html`
              <div
                class="upcoming-row"
                role="button"
                tabindex="0"
                @click=${() =>
                  openItemEditor(this, {
                    entityId: `todo.${entry.list_id}`,
                    itemId: entry.item.uid,
                    hass: this.hass,
                  })}
                @keydown=${keyActivate(() =>
                  openItemEditor(this, {
                    entityId: `todo.${entry.list_id}`,
                    itemId: entry.item.uid,
                    hass: this.hass,
                  }))}
              >
                <span class="upcoming-row__title">${entry.item.title}</span>
                <span class="upcoming-row__reason">${entry.reason || "not yet"}</span>
              </div>
            `
          )
        : nothing}
    `;
  }

  private _renderItem(entry: QueueEntry, index: number, todoEntity: string) {
    const item = entry.item;
    const trait = primaryTrait(item.traits);
    const traitRgb = trait ? TRAIT_RGB[trait] : "var(--yahatl-rgb-primary)";
    const traitIcon = trait ? TRAIT_ICONS[trait] : "mdi:checkbox-marked-circle-outline";
    const due = formatDue(item.due);
    // Use the item's OWN list, not the inbox: queue items come from many lists
    // (post list-split), so completing/opening must address the list that
    // actually holds the uid or the backend returns item_not_found.
    const entityId = entry.list_id ? `todo.${entry.list_id}` : todoEntity;

    return html`
      <div class="queue-item">
        <div class="swipe-hint swipe-hint--done">
          <ha-icon icon="mdi:check"></ha-icon> Done
        </div>
        <div class="swipe-hint swipe-hint--delay">
          Delay <ha-icon icon="mdi:clock-outline"></ha-icon>
        </div>
        <div
          class="queue-item__fg"
          style="--rgb-state: ${traitRgb}"
          role="button"
          tabindex="0"
          @click=${() => this._onItemClick(entityId, item.uid)}
          @keydown=${keyActivate(() => this._openEditor(entityId, item.uid))}
          @touchstart=${(e: TouchEvent) => this._onTouchStart(e, entityId, item.uid)}
          @touchmove=${(e: TouchEvent) => this._onTouchMove(e)}
          @touchend=${() => this._onTouchEnd()}
          @touchcancel=${() => this._onTouchEnd()}
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
        <div class="queue-actions">
          <button
            class="queue-btn queue-btn--ghost"
            title="Delay to the next time this task is schedulable"
            @click=${(e: Event) => {
              e.stopPropagation();
              this._delay(entityId, item.uid);
            }}
          >
            delay
          </button>
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
      </div>
    `;
  }

  private async _complete(entityId: string, itemId: string) {
    // Capture the pre-completion state for UNDO before completeItem's
    // optimistic removal drops the entry from the queue.
    const entry = this._store.state.queue?.items.find(
      (e) => e.item.uid === itemId
    );
    const item = entry?.item;
    const ok = await store.completeItem(entityId, itemId);
    if (ok && item) {
      const prior = {
        status: item.status,
        due: item.due ?? null,
        deferred_until: item.deferred_until ?? null,
      };
      showSnackbar(`Completed "${item.title}"`, {
        label: "UNDO",
        // Failures surface via the store's lastError banner.
        run: () => store.uncompleteItem(entityId, itemId, prior),
      });
    }
  }

  // --- Swipe gestures ---

  private _onItemClick(entityId: string, itemId: string) {
    // Suppress the click that fires at the end of a swipe.
    if (this._drag.moved) {
      this._drag.moved = false;
      return;
    }
    this._openEditor(entityId, itemId);
  }

  private _onTouchStart(e: TouchEvent, entityId: string, itemId: string) {
    const t = e.touches[0];
    const el = e.currentTarget as HTMLElement;
    el.style.transition = "";
    this._drag = {
      id: itemId,
      entity: entityId,
      startX: t.clientX,
      startY: t.clientY,
      dx: 0,
      active: true,
      moved: false,
      el,
    };
  }

  private _onTouchMove(e: TouchEvent) {
    const d = this._drag;
    if (!d.active || !d.el) return;
    const t = e.touches[0];
    const dx = t.clientX - d.startX;
    const dy = t.clientY - d.startY;

    // First meaningful move decides intent: vertical → let the list scroll.
    if (!d.moved && Math.abs(dx) < Math.abs(dy)) {
      d.active = false;
      return;
    }
    if (Math.abs(dx) > 6) d.moved = true;
    if (!d.moved) return;

    e.preventDefault();
    d.dx = dx;
    const max = YahtlQueueCard.SWIPE_MAX;
    const clamped = Math.max(-max, Math.min(max, dx));
    d.el.style.transform = `translateX(${clamped}px)`;

    const parent = d.el.parentElement;
    if (parent) {
      const mag = Math.min(1, Math.abs(clamped) / YahtlQueueCard.SWIPE_THRESHOLD);
      const done = parent.querySelector<HTMLElement>(".swipe-hint--done");
      const delay = parent.querySelector<HTMLElement>(".swipe-hint--delay");
      if (done) done.style.opacity = dx > 0 ? String(mag) : "0";
      if (delay) delay.style.opacity = dx < 0 ? String(mag) : "0";
    }
  }

  private _onTouchEnd() {
    const d = this._drag;
    if (!d.active || !d.el) {
      d.active = false;
      return;
    }
    const el = d.el;
    const parent = el.parentElement;
    const threshold = YahtlQueueCard.SWIPE_THRESHOLD;
    const doDelay = d.dx <= -threshold;
    const doDone = d.dx >= threshold;

    // Slide back and clear the reveal.
    el.style.transition = "transform 180ms ease";
    el.style.transform = "translateX(0)";
    window.setTimeout(() => {
      el.style.transition = "";
      if (parent) {
        const done = parent.querySelector<HTMLElement>(".swipe-hint--done");
        const delay = parent.querySelector<HTMLElement>(".swipe-hint--delay");
        if (done) done.style.opacity = "0";
        if (delay) delay.style.opacity = "0";
      }
    }, 180);

    const { entity, id } = d;
    d.active = false;
    if (doDelay) this._delay(entity, id);
    else if (doDone) this._complete(entity, id);
    else if (!d.moved) {
      // A plain tap (no swipe): open the editor here. Touch devices don't
      // reliably synthesize a @click after our gesture handling, so we can't
      // depend on _onItemClick firing. Mark moved so the click that MAY still
      // follow is suppressed (avoids a double-open).
      this._drag.moved = true;
      this._openEditor(entity, id);
    }
  }

  private async _delay(entityId: string, itemId: string) {
    const until = await store.delayItem(entityId, itemId);
    if (until) {
      this._flash = `Delayed until ${this._formatDelayTarget(until)}`;
      window.setTimeout(() => {
        this._flash = "";
      }, 3500);
    }
  }

  /** Friendly label for a delay target, e.g. "Sunday" or "Monday 9am". */
  private _formatDelayTarget(iso: string): string {
    const d = new Date(iso);
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    if (d.getHours() === 0 && d.getMinutes() === 0) return weekday;
    const time = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      ...(d.getMinutes() ? { minute: "2-digit" } : {}),
    });
    return `${weekday} ${time}`;
  }

  private async _quickAdd(todoEntity: string) {
    const title = this._quickAddValue.trim();
    if (!title) return;
    const entityId = todoEntity || this._store.state.lists[0]?.entity_id;
    if (!entityId) return;
    this._quickAddBusy = true;
    try {
      // Keep the draft in the input if the create failed (flaky wifi etc);
      // the store surfaces the error via the banner.
      const ok = await store.createItem(entityId, { title, needs_detail: true });
      if (ok) this._quickAddValue = "";
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
    openItemEditor(this, { entityId, itemId, hass: this.hass });
  }

  // --- Lovelace card editor support ---
  // Makes the card fully configurable from the UI card picker rather than
  // hand-written YAML: getStubConfig seeds sensible defaults when the card is
  // first added, getConfigElement supplies the ha-form visual editor below.

  static getConfigElement(): HTMLElement {
    return document.createElement("yahatl-queue-card-editor");
  }

  static getStubConfig(hass?: HomeAssistant): Record<string, unknown> {
    const states = hass?.states ?? {};
    const todoEntity =
      Object.keys(states).find((e) => e.startsWith("todo.") && e.includes("yahatl")) ??
      "todo.yahatl";
    return { todo_entity: todoEntity, title: "Up Next", max_items: 8 };
  }

  getCardSize() {
    return 4;
  }
}

/** Visual config editor for the queue card, rendered by HA's card editor. */
@customElement("yahatl-queue-card-editor")
export class YahtlQueueCardEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};

  // Only fields the card actually reads: todo_entity (quick-add target),
  // title and max_items. Older configs may still carry a legacy `entity`
  // (queue sensor) key — it's ignored by render and preserved harmlessly.
  private static readonly _schema = [
    { name: "todo_entity", required: true, selector: { entity: { domain: "todo" } } },
    { name: "title", selector: { text: {} } },
    { name: "max_items", selector: { number: { min: 1, max: 50, mode: "box" } } },
  ];

  private static readonly _labels: Record<string, string> = {
    todo_entity: "Todo list entity (quick-add target)",
    title: "Card title",
    max_items: "Max items shown",
  };

  setConfig(config: Record<string, unknown>) {
    this._config = config;
  }

  render() {
    if (!this.hass) return nothing;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${YahtlQueueCardEditor._schema}
        .computeLabel=${(s: { name: string }) =>
          YahtlQueueCardEditor._labels[s.name] ?? s.name}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: ev.detail.value },
        bubbles: true,
        composed: true,
      })
    );
  }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "yahatl-queue-card",
  name: "Yahatl Queue",
  description: "Prioritized task queue with Mushroom-style layout",
});
