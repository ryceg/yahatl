import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles, TRAIT_ICONS, TRAIT_RGB, primaryTrait } from "../styles";
import { store, StoreController } from "../store";
import { openItemEditor } from "../dialog";
import type { HomeAssistant, QueueEntry } from "../types";

@customElement("yahatl-queue-card")
export class YahtlQueueCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};
  @state() private _quickAddValue = "";
  @state() private _quickAddBusy = false;
  @state() private _flash = "";
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
        background: rgba(var(--rgb-primary-color), 0.05);
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

      .queue-btn--ghost {
        background: rgba(var(--rgb-primary-text-color), 0.06);
        color: var(--yahatl-text-secondary);
      }

      .flash {
        margin: 4px 16px 0;
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(var(--rgb-primary-color), 0.12);
        color: rgb(var(--rgb-primary-color));
        font-size: 13px;
        font-weight: 500;
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
          @click=${() => this._onItemClick(entityId, item.uid)}
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
      await store.createItem(entityId, { title, needs_detail: true });
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
    const queueEntity =
      Object.keys(states).find(
        (e) => e.startsWith("sensor.") && e.includes("yahatl") && e.endsWith("_queue")
      ) ?? "sensor.yahatl_queue";
    const todoEntity =
      Object.keys(states).find((e) => e.startsWith("todo.") && e.includes("yahatl")) ??
      "todo.yahatl";
    return { entity: queueEntity, todo_entity: todoEntity, title: "Up Next", max_items: 8 };
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

  private static readonly _schema = [
    { name: "entity", required: true, selector: { entity: { domain: "sensor" } } },
    { name: "todo_entity", required: true, selector: { entity: { domain: "todo" } } },
    { name: "title", selector: { text: {} } },
    { name: "max_items", selector: { number: { min: 1, max: 50, mode: "box" } } },
  ];

  private static readonly _labels: Record<string, string> = {
    entity: "Queue sensor",
    todo_entity: "Todo list entity",
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
