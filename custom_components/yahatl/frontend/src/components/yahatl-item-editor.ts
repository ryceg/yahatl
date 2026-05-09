import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles, TRAIT_ICONS, TRAIT_RGB } from "../styles";
import { store } from "../store";
import type { HomeAssistant, YahtlItem, RecurrenceConfig } from "../types";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ALL_TRAITS = [
  "actionable",
  "recurring",
  "habit",
  "chore",
  "reminder",
  "note",
];
const OPERATORS = ["eq", "neq", "gt", "lt", "gte", "lte", "bool"];

/** Get friendly name for an entity, falling back to the entity_id */
function entityName(hass: HomeAssistant | undefined, entityId: string): string {
  if (!hass || !entityId) return entityId;
  const stateObj = hass.states[entityId];
  return (stateObj?.attributes?.friendly_name as string) || entityId;
}

type EditorMode = "dialog" | "inline";

@customElement("yahatl-item-editor")
export class YahtlItemEditor extends LitElement {
  @property() mode: EditorMode = "dialog";
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _visible = false;
  @state() private _entityId = "";
  @state() private _itemId: string | null = null;
  @state() private _item: Partial<YahtlItem> = {};
  @state() private _section = 0;
  @state() private _busy = false;
  @state() private _error = "";
  @state() private _allItems: { uid: string; title: string; status: string }[] = [];

  private _boundKey = this._onKey.bind(this);

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      /* Overlay */
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 9999;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        animation: overlay-in 200ms ease-out;
      }

      @keyframes overlay-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @media (min-width: 600px) {
        .overlay {
          align-items: center;
        }
      }

      /* Modal */
      .modal {
        background: var(--yahatl-card-bg);
        border-radius: 16px 16px 0 0;
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
        animation: modal-slide-up 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      @keyframes modal-slide-up {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      @media (min-width: 600px) {
        .modal {
          border-radius: 16px;
          max-height: 80vh;
          animation: modal-scale-in 200ms ease-out;
        }

        @keyframes modal-scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      }

      .modal__header {
        padding: 18px 20px 12px;
        border-bottom: 1px solid var(--yahatl-divider);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .modal__header-info {
        flex: 1;
      }

      .modal__title {
        font-size: 18px;
        font-weight: 500;
        letter-spacing: 0.15px;
        margin: 0;
        color: var(--yahatl-text);
      }

      .modal__sub {
        font-size: 12px;
        color: var(--yahatl-text-secondary);
        margin-top: 4px;
        letter-spacing: 0.4px;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.4em;
        cursor: pointer;
        color: var(--yahatl-text-secondary);
        padding: 4px;
        line-height: 1;
        -webkit-tap-highlight-color: transparent;
      }

      /* Tabs */
      .tabs {
        display: flex;
        gap: 4px;
        padding: 8px 12px 0;
        border-bottom: 1px solid var(--yahatl-divider);
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      .tab {
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 500;
        color: var(--yahatl-text-secondary);
        border: 0;
        background: transparent;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        letter-spacing: 0.1px;
        margin-bottom: -1px;
        font-family: inherit;
        white-space: nowrap;
        -webkit-tap-highlight-color: transparent;
        transition: color 180ms ease, border-color 180ms ease;
      }

      .tab.is-active {
        color: rgb(var(--rgb-primary-color));
        border-color: rgb(var(--rgb-primary-color));
      }

      /* Content */
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 18px 20px;
        -webkit-overflow-scrolling: touch;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .modal__footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 20px;
        border-top: 1px solid var(--yahatl-divider);
        background: rgba(var(--rgb-primary-text-color), 0.02);
      }

      .error-msg {
        padding: 8px 20px;
        color: rgb(var(--rgb-danger));
        font-size: 13px;
      }

      /* Traits as pills */
      .traits-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      /* Tags inline */
      .tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }

      .tag-input {
        flex: 1;
        min-width: 120px;
        max-width: 200px;
        padding: 5px 10px;
        font-size: 12px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 6px;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        font-family: inherit;
      }

      .tag-input:focus {
        outline: none;
        border-color: rgb(var(--rgb-primary-color));
      }

      /* Recurrence presets */
      .preset-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .preset-btn {
        padding: 10px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 10px;
        background: none;
        color: var(--yahatl-text);
        cursor: pointer;
        font-size: 13px;
        text-align: left;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        transition: background-color 180ms ease, border-color 180ms ease;
      }

      .preset-btn.active {
        border-color: rgb(var(--rgb-primary-color));
        background: rgba(var(--rgb-primary-color), 0.08);
      }

      .preset-label {
        font-weight: 500;
      }

      .preset-desc {
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        margin-top: 2px;
      }

      /* Day picker */
      .day-picker {
        display: flex;
        gap: 4px;
        margin: 8px 0;
      }

      .day-btn {
        flex: 1;
        padding: 8px 0;
        border: 1px solid var(--yahatl-divider);
        border-radius: 6px;
        background: none;
        color: var(--yahatl-text);
        cursor: pointer;
        font-size: 12px;
        text-align: center;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
      }

      .day-btn.active {
        background: rgb(var(--rgb-primary-color));
        border-color: rgb(var(--rgb-primary-color));
        color: white;
      }

      /* Fieldset */
      fieldset {
        border: 1px solid var(--yahatl-divider);
        border-radius: 10px;
        padding: 12px;
        margin: 0;
      }

      legend {
        font-size: 12px;
        font-weight: 500;
        padding: 0 6px;
        color: var(--yahatl-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }

      /* Check row */
      .check-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        cursor: pointer;
        font-size: 13px;
        color: var(--yahatl-text);
      }

      .check-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
      }

      /* Dynamic rows */
      .dyn-row {
        border: 1px solid var(--yahatl-divider);
        border-radius: 10px;
        padding: 10px;
        margin-bottom: 8px;
      }

      /* Assign row */
      .assign-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .assign-current {
        font-size: 13px;
        color: var(--yahatl-text);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 5px 10px;
        border-radius: 999px;
        background: rgba(var(--rgb-primary-color), 0.10);
      }

      .assign-current ha-icon {
        --mdc-icon-size: 16px;
        color: rgb(var(--rgb-primary-color));
      }

      /* Delete */
      .delete-area {
        margin-top: 8px;
        padding-top: 16px;
        border-top: 1px solid var(--yahatl-divider);
      }

      .inline-wrapper {
        background: var(--yahatl-card-bg);
        border-radius: 16px;
      }

      /* Entity picker list */
      .entity-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .entity-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 8px;
        background: rgba(var(--rgb-primary-text-color), 0.03);
      }

      .entity-row__name {
        flex: 1;
        font-size: 13px;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .entity-row__id {
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.3px;
      }

      .entity-row__remove {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--yahatl-text-secondary);
        font-size: 14px;
        padding: 2px 4px;
        line-height: 1;
        opacity: 0.6;
        -webkit-tap-highlight-color: transparent;
      }

      .entity-row__remove:hover {
        opacity: 1;
        color: rgb(var(--rgb-danger));
      }

      ha-entity-picker {
        display: block;
        width: 100%;
      }
    `,
  ];

  // --- Public API ---

  async open(detail: {
    entityId: string;
    itemId?: string;
    hass?: HomeAssistant;
  }) {
    this._entityId = detail.entityId;
    this._itemId = detail.itemId || null;
    if (detail.hass) this.hass = detail.hass;

    if (this._itemId) {
      const [item, allItems] = await Promise.all([
        store.getItemDetails(this._entityId, this._itemId),
        store.api!.getItems(this._entityId),
      ]);
      if (!item) return;
      this._item = { ...item };
      this._allItems = allItems.filter((i) => i.uid !== this._itemId);
    } else {
      this._item = {
        title: "",
        description: "",
        traits: ["actionable"],
        tags: [],
        priority: null,
        assigned_to: this.hass?.user ? [this.hass.user.id] : [],
        needs_detail: false,
      };
      this._allItems = [];
    }

    this._section = 0;
    this._error = "";
    this._visible = true;
    document.addEventListener("keydown", this._boundKey);
  }

  close() {
    this._visible = false;
    document.removeEventListener("keydown", this._boundKey);
    this.requestUpdate();
  }

  private _onKey(e: KeyboardEvent) {
    if (e.key === "Escape") this.close();
  }

  // --- Rendering ---

  render() {
    if (!this._visible) return nothing;

    const sectionNames = this._itemId
      ? ["Basics", "Traits & Tags", "Recurrence", "Blockers", "Requirements", "Schedule"]
      : ["Basics", "Traits & Tags", "Recurrence"];

    const inner = html`
      <div class="modal__header">
        <div class="modal__header-info">
          <h2 class="modal__title">${this._itemId ? "Edit item" : "New item"}</h2>
          ${this._itemId
            ? html`<div class="modal__sub">${this._entityId} · ${this._itemId.slice(0, 8)}…</div>`
            : nothing}
        </div>
        <button class="close-btn" @click=${this.close}>&times;</button>
      </div>
      <div class="tabs">
        ${sectionNames.map(
          (name, i) => html`
            <button
              class="tab ${i === this._section ? "is-active" : ""}"
              @click=${() => (this._section = i)}
            >
              ${name}
            </button>
          `
        )}
      </div>
      <div class="content">${this._renderSection()}</div>
      ${this._error
        ? html`<div class="error-msg">${this._error}</div>`
        : nothing}
      <div class="modal__footer">
        <button class="btn btn--ghost" @click=${this.close}>cancel</button>
        <button
          class="btn btn--primary"
          @click=${this._save}
          ?disabled=${this._busy}
        >
          ${this._itemId ? "save" : "create"}
        </button>
      </div>
    `;

    if (this.mode === "inline") {
      return html`<div class="inline-wrapper">${inner}</div>`;
    }

    return html`
      <div class="overlay" @click=${this._overlayClick}>
        <div class="modal">${inner}</div>
      </div>
    `;
  }

  private _overlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains("overlay")) this.close();
  }

  private _renderSection() {
    switch (this._section) {
      case 0: return this._renderBasics();
      case 1: return this._renderTraitsTags();
      case 2: return this._renderRecurrence();
      case 3: return this._renderBlockers();
      case 4: return this._renderRequirements();
      case 5: return this._renderSchedule();
      default: return nothing;
    }
  }

  // --- Section 0: Basics ---

  private _renderBasics() {
    const item = this._item;
    const currentUser = this.hass?.user;
    const isAssigned = (item.assigned_to || []).includes(currentUser?.id || "");

    return html`
      <div class="field">
        <div class="field__label">Title</div>
        <input
          class="input"
          type="text"
          .value=${item.title || ""}
          @input=${(e: InputEvent) =>
            this._set("title", (e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="field">
        <div class="field__label">Description</div>
        <textarea
          class="textarea"
          rows="3"
          placeholder="Optional notes…"
          .value=${item.description || ""}
          @input=${(e: InputEvent) =>
            this._set("description", (e.target as HTMLTextAreaElement).value)}
        ></textarea>
      </div>
      <div class="row2">
        <div class="field">
          <div class="field__label">Priority</div>
          <select
            class="select"
            .value=${item.priority || ""}
            @change=${(e: Event) =>
              this._set(
                "priority",
                (e.target as HTMLSelectElement).value || null
              )}
          >
            <option value="">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="field">
          <div class="field__label">Time estimate</div>
          <input
            class="input"
            type="number"
            min="1"
            max="480"
            placeholder="minutes"
            .value=${String(item.time_estimate || "")}
            @input=${(e: InputEvent) =>
              this._set(
                "time_estimate",
                parseInt((e.target as HTMLInputElement).value) || null
              )}
          />
        </div>
      </div>
      <div class="field">
        <div class="field__label">Due</div>
        <input
          class="input"
          type="datetime-local"
          .value=${this._toLocalDt(item.due)}
          @change=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            this._set("due", v ? new Date(v).toISOString() : null);
          }}
        />
      </div>
      <div class="field">
        <div class="field__label">Assigned to</div>
        <div class="assign-row">
          ${currentUser
            ? html`
                <button
                  class="trait-toggle ${isAssigned ? "is-on" : ""}"
                  style="--rgb-state: var(--rgb-primary-color)"
                  @click=${() => this._toggleAssign(currentUser.id)}
                >
                  <ha-icon icon="mdi:account"></ha-icon>
                  ${currentUser.name}
                </button>
              `
            : nothing}
        </div>
      </div>
      <label class="check-row">
        <input
          type="checkbox"
          .checked=${!!item.needs_detail}
          @change=${(e: Event) =>
            this._set("needs_detail", (e.target as HTMLInputElement).checked)}
        />
        Needs more detail
      </label>

      ${this._itemId
        ? html`
            <div class="delete-area">
              <button
                class="btn btn--danger"
                @click=${this._delete}
                ?disabled=${this._busy}
              >
                Delete this item
              </button>
            </div>
          `
        : nothing}
    `;
  }

  // --- Section 1: Traits & Tags ---

  private _renderTraitsTags() {
    const traits = this._item.traits || [];
    const tags = this._item.tags || [];
    return html`
      <div class="field">
        <div class="field__label">Traits</div>
        <div class="traits-row">
          ${ALL_TRAITS.map(
            (t) => html`
              <button
                class="trait-toggle ${traits.includes(t) ? "is-on" : ""}"
                style="--rgb-state: ${TRAIT_RGB[t]}"
                @click=${() => this._toggleTrait(t)}
              >
                <ha-icon icon=${TRAIT_ICONS[t]}></ha-icon>
                ${t}
              </button>
            `
          )}
        </div>
      </div>
      <div class="field">
        <div class="field__label">Tags</div>
        <div class="tags-row">
          ${tags.map(
            (tag, i) => html`
              <span class="tag-chip">
                #${tag}
                <button class="tag-chip__remove" @click=${() => this._removeTag(i)}>&times;</button>
              </span>
            `
          )}
          <input
            class="tag-input"
            type="text"
            placeholder="add tag…"
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") this._addTag(e.target as HTMLInputElement);
            }}
          />
        </div>
      </div>
    `;
  }

  // --- Section 2: Recurrence ---

  private _renderRecurrence() {
    const rec = this._item.recurrence;
    const type = rec?.type || "none";

    return html`
      <div class="preset-grid">
        <button
          class="preset-btn ${type === "none" ? "active" : ""}"
          @click=${() => this._setRecurrenceType("none")}
        >
          <div class="preset-label">One-off</div>
          <div class="preset-desc">Does not repeat</div>
        </button>
        <button
          class="preset-btn ${type === "calendar" ? "active" : ""}"
          @click=${() => this._setRecurrenceType("calendar")}
        >
          <div class="preset-label">On specific days</div>
          <div class="preset-desc">Pick days of week/month</div>
        </button>
        <button
          class="preset-btn ${type === "elapsed" ? "active" : ""}"
          @click=${() => this._setRecurrenceType("elapsed")}
        >
          <div class="preset-label">Every N days</div>
          <div class="preset-desc">Fixed interval from last done</div>
        </button>
        <button
          class="preset-btn ${type === "frequency" ? "active" : ""}"
          @click=${() => this._setRecurrenceType("frequency")}
        >
          <div class="preset-label">X times per period</div>
          <div class="preset-desc">Flexible goal tracking</div>
        </button>
      </div>

      ${type === "calendar" ? this._renderCalendarConfig() : nothing}
      ${type === "elapsed" ? this._renderElapsedConfig() : nothing}
      ${type === "frequency" ? this._renderFrequencyConfig() : nothing}
    `;
  }

  private _renderCalendarConfig() {
    const rec = this._item.recurrence!;
    const preset = rec.calendar_preset || null;
    const days = rec.calendar_days || [];
    const daysOfMonth = rec.calendar_days_of_month || [];
    const showDayPicker = !preset;
    const showMonthPicker = !preset && days.length === 0;

    return html`
      <div class="chips-strip" style="padding-left: 0; padding-top: 12px">
        ${(["daily", "weekdays", "weekends"] as const).map(
          (p) => html`
            <button
              class="mush-chip ${preset === p ? "mush-chip--filled" : ""}"
              style="--rgb-state: var(--rgb-primary-color)"
              @click=${() => this._setCalendarPreset(preset === p ? null : p)}
            >
              ${p}
            </button>
          `
        )}
        <button
          class="mush-chip ${showDayPicker && !showMonthPicker ? "mush-chip--filled" : ""}"
          style="--rgb-state: var(--rgb-primary-color)"
          @click=${() => this._setCalendarPreset(null)}
        >
          Custom days
        </button>
      </div>

      ${showDayPicker
        ? html`
            <div class="field">
              <div class="field__label">Days of the week</div>
              <div class="day-picker">
                ${DAY_LABELS.map(
                  (label, i) => html`
                    <button
                      class="day-btn ${days.includes(i) ? "active" : ""}"
                      @click=${() => this._toggleCalendarDay(i)}
                    >
                      ${label}
                    </button>
                  `
                )}
              </div>
            </div>

            ${days.length === 0
              ? html`
                  <div class="field">
                    <div class="field__label">Or days of the month (1-31, comma-separated)</div>
                    <input
                      class="input"
                      type="text"
                      placeholder="e.g. 1, 15"
                      .value=${daysOfMonth.join(", ")}
                      @change=${(e: Event) => {
                        const v = (e.target as HTMLInputElement).value;
                        const parsed = v
                          .split(",")
                          .map((s) => parseInt(s.trim()))
                          .filter((n) => n >= 1 && n <= 31);
                        this._updateRecurrence({
                          calendar_days_of_month: parsed.length ? parsed : null,
                        });
                      }}
                    />
                  </div>
                `
              : nothing}
          `
        : nothing}
    `;
  }

  private _renderElapsedConfig() {
    const rec = this._item.recurrence!;
    return html`
      <div class="row2" style="margin-top: 12px">
        <div class="field">
          <div class="field__label">Every</div>
          <input
            class="input"
            type="number"
            min="1"
            .value=${String(rec.elapsed_interval || "")}
            @input=${(e: InputEvent) =>
              this._updateRecurrence({
                elapsed_interval:
                  parseInt((e.target as HTMLInputElement).value) || null,
              })}
          />
        </div>
        <div class="field">
          <div class="field__label">Unit</div>
          <select
            class="select"
            .value=${rec.elapsed_unit || "days"}
            @change=${(e: Event) =>
              this._updateRecurrence({
                elapsed_unit: (e.target as HTMLSelectElement).value,
              })}
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
            <option value="years">years</option>
          </select>
        </div>
      </div>
    `;
  }

  private _renderFrequencyConfig() {
    const rec = this._item.recurrence!;
    return html`
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; font-size: 13px">
        <span>Do this</span>
        <input
          class="input"
          type="number"
          min="1"
          style="width: 60px; flex: none"
          .value=${String(rec.frequency_count || "")}
          @input=${(e: InputEvent) =>
            this._updateRecurrence({
              frequency_count:
                parseInt((e.target as HTMLInputElement).value) || null,
            })}
        />
        <span>times per</span>
        <input
          class="input"
          type="number"
          min="1"
          style="width: 60px; flex: none"
          .value=${String(rec.frequency_period || "")}
          @input=${(e: InputEvent) =>
            this._updateRecurrence({
              frequency_period:
                parseInt((e.target as HTMLInputElement).value) || null,
            })}
        />
        <select
          class="select"
          style="width: 90px; flex: none"
          .value=${rec.frequency_unit || "days"}
          @change=${(e: Event) =>
            this._updateRecurrence({
              frequency_unit: (e.target as HTMLSelectElement).value,
            })}
        >
          <option value="days">days</option>
          <option value="weeks">weeks</option>
          <option value="months">months</option>
        </select>
      </div>
    `;
  }

  // --- Section 3: Blockers ---

  private _renderBlockers() {
    const b = this._item.blockers || {
      mode: "ALL",
      items: [],
      item_mode: "ANY",
      sensors: [],
      sensor_mode: "ANY",
    };
    return html`
      <div class="field">
        <div class="field__label">Overall mode</div>
        <select
          class="select"
          .value=${b.mode || "ALL"}
          @change=${(e: Event) =>
            this._setBlockers({ ...b, mode: (e.target as HTMLSelectElement).value })}
        >
          <option value="ANY">ANY (blocked if items OR sensors match)</option>
          <option value="ALL">ALL (blocked if items AND sensors match)</option>
        </select>
      </div>

      <fieldset>
        <legend>Blocked by items</legend>
        <div class="field" style="margin-bottom: 8px">
          <select
            class="select"
            .value=${b.item_mode || "ANY"}
            @change=${(e: Event) =>
              this._setBlockers({ ...b, item_mode: (e.target as HTMLSelectElement).value })}
          >
            <option value="ANY">ANY incomplete blocks</option>
            <option value="ALL">ALL must be incomplete to block</option>
          </select>
        </div>
        ${this._allItems.length > 0
          ? this._allItems.map(
              (other) => html`
                <label class="check-row">
                  <input
                    type="checkbox"
                    .checked=${(b.items || []).includes(other.uid)}
                    @change=${() => this._toggleBlockerItem(other.uid)}
                  />
                  ${other.title}
                  <span style="font-size: 11px; color: var(--yahatl-text-secondary)">(${other.status})</span>
                </label>
              `
            )
          : html`<div style="font-size: 13px; color: var(--yahatl-text-secondary)">No other items</div>`}
      </fieldset>

      <fieldset>
        <legend>Blocked by sensors</legend>
        <div class="field" style="margin-bottom: 8px">
          <select
            class="select"
            .value=${b.sensor_mode || "ANY"}
            @change=${(e: Event) =>
              this._setBlockers({ ...b, sensor_mode: (e.target as HTMLSelectElement).value })}
          >
            <option value="ANY">ANY sensor on blocks</option>
            <option value="ALL">ALL must be on to block</option>
          </select>
        </div>
        <div class="entity-list">
          ${(b.sensors || []).map(
            (eid, i) => html`
              <div class="entity-row">
                <ha-icon icon="mdi:eye" style="--mdc-icon-size: 16px; color: var(--yahatl-text-secondary)"></ha-icon>
                <div class="entity-row__name">
                  ${entityName(this.hass, eid)}
                  <div class="entity-row__id">${eid}</div>
                </div>
                <button class="entity-row__remove" @click=${() => {
                  const sensors = [...(b.sensors || [])];
                  sensors.splice(i, 1);
                  this._setBlockers({ ...b, sensors });
                }}>&times;</button>
              </div>
            `
          )}
        </div>
        <ha-entity-picker
          .hass=${this.hass}
          @value-changed=${(e: CustomEvent) => {
            const eid = e.detail.value;
            if (eid && !(b.sensors || []).includes(eid)) {
              this._setBlockers({ ...b, sensors: [...(b.sensors || []), eid] });
            }
            // Reset picker
            const picker = e.target as any;
            setTimeout(() => { picker.value = ""; }, 0);
          }}
          label="Add sensor entity"
        ></ha-entity-picker>
      </fieldset>
    `;
  }

  // --- Section 4: Requirements ---

  private _renderRequirements() {
    const r = this._item.requirements || {
      mode: "ANY",
      location: [],
      people: [],
      time_constraints: [],
      context: [],
      sensors: [],
    };
    const timeOptions = [
      "business_hours",
      "weekend",
      "evening",
      "morning",
      "night",
    ];

    return html`
      <div class="field">
        <div class="field__label">Mode</div>
        <select
          class="select"
          .value=${r.mode || "ANY"}
          @change=${(e: Event) =>
            this._setRequirements({ ...r, mode: (e.target as HTMLSelectElement).value })}
        >
          <option value="ANY">ANY requirement met = eligible</option>
          <option value="ALL">ALL requirements must be met</option>
        </select>
      </div>
      <div class="field">
        <div class="field__label">Location (zones)</div>
        <div class="chips-strip" style="padding: 0">
          ${Object.entries(this._getZoneEntities()).map(
            ([zoneId, name]) => html`
              <button
                class="mush-chip ${(r.location || []).includes(zoneId) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => {
                  const loc = r.location || [];
                  this._setRequirements({
                    ...r,
                    location: loc.includes(zoneId)
                      ? loc.filter((x) => x !== zoneId)
                      : [...loc, zoneId],
                  });
                }}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${this._getZoneIcon(zoneId)}></ha-icon>
                </span>
                ${name}
              </button>
            `
          )}
        </div>
      </div>
      <div class="field">
        <div class="field__label">People</div>
        <div class="chips-strip" style="padding: 0">
          ${Object.entries(this._getPersonEntities()).map(
            ([id, name]) => html`
              <button
                class="mush-chip ${(r.people || []).includes(id) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => {
                  const ppl = r.people || [];
                  this._setRequirements({
                    ...r,
                    people: ppl.includes(id)
                      ? ppl.filter((x) => x !== id)
                      : [...ppl, id],
                  });
                }}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon="mdi:account"></ha-icon>
                </span>
                ${name}
              </button>
            `
          )}
        </div>
      </div>
      <fieldset>
        <legend>Time constraints</legend>
        <div class="chips-strip" style="padding: 0; padding-top: 4px">
          ${timeOptions.map(
            (t) => html`
              <button
                class="mush-chip ${(r.time_constraints || []).includes(t) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => {
                  const tc = r.time_constraints || [];
                  this._setRequirements({
                    ...r,
                    time_constraints: tc.includes(t)
                      ? tc.filter((x) => x !== t)
                      : [...tc, t],
                  });
                }}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${{business_hours: "mdi:briefcase-clock", weekend: "mdi:calendar-weekend", evening: "mdi:weather-sunset", morning: "mdi:weather-sunset-up", night: "mdi:weather-night"}[t]}></ha-icon>
                </span>
                ${t.replace(/_/g, " ")}
              </button>
            `
          )}
        </div>
      </fieldset>
      <div class="field">
        <div class="field__label">Context</div>
        <div class="chips-strip" style="padding: 0">
          ${(["focused_work", "calls_ok", "errands", "exercise", "relaxation"] as const).map(
            (c) => html`
              <button
                class="mush-chip ${(r.context || []).includes(c) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => {
                  const ctx = r.context || [];
                  this._setRequirements({
                    ...r,
                    context: ctx.includes(c)
                      ? ctx.filter((x) => x !== c)
                      : [...ctx, c],
                  });
                }}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${{focused_work: "mdi:head-cog", calls_ok: "mdi:phone", errands: "mdi:cart", exercise: "mdi:run", relaxation: "mdi:sofa"}[c]}></ha-icon>
                </span>
                ${c.replace(/_/g, " ")}
              </button>
            `
          )}
        </div>
      </div>
      <fieldset>
        <legend>Required sensors</legend>
        <div class="entity-list">
          ${(r.sensors || []).map(
            (eid, i) => html`
              <div class="entity-row">
                <ha-icon icon="mdi:eye" style="--mdc-icon-size: 16px; color: var(--yahatl-text-secondary)"></ha-icon>
                <div class="entity-row__name">
                  ${entityName(this.hass, eid)}
                  <div class="entity-row__id">${eid}</div>
                </div>
                <button class="entity-row__remove" @click=${() => {
                  const sensors = [...(r.sensors || [])];
                  sensors.splice(i, 1);
                  this._setRequirements({ ...r, sensors });
                }}>&times;</button>
              </div>
            `
          )}
        </div>
        <ha-entity-picker
          .hass=${this.hass}
          @value-changed=${(e: CustomEvent) => {
            const eid = e.detail.value;
            if (eid && !(r.sensors || []).includes(eid)) {
              this._setRequirements({ ...r, sensors: [...(r.sensors || []), eid] });
            }
            const picker = e.target as any;
            setTimeout(() => { picker.value = ""; }, 0);
          }}
          label="Add sensor entity"
        ></ha-entity-picker>
      </fieldset>
    `;
  }

  // --- Section 5: Schedule ---

  private _renderSchedule() {
    const tbs = this._item.time_blockers || [];
    const cts = this._item.condition_triggers || [];
    const deferred = this._item.deferred_until;

    return html`
      <fieldset>
        <legend>Time Blockers</legend>
        ${tbs.map(
          (tb, i) => html`
            <div class="dyn-row">
              <div class="row2">
                <div class="field">
                  <div class="field__label">Start</div>
                  <input
                    class="input"
                    type="time"
                    .value=${tb.start_time || ""}
                    @change=${(e: Event) =>
                      this._updateTimeBlocker(i, {
                        start_time: (e.target as HTMLInputElement).value,
                      })}
                  />
                </div>
                <div class="field">
                  <div class="field__label">End</div>
                  <input
                    class="input"
                    type="time"
                    .value=${tb.end_time || ""}
                    @change=${(e: Event) =>
                      this._updateTimeBlocker(i, {
                        end_time: (e.target as HTMLInputElement).value,
                      })}
                  />
                </div>
              </div>
              <div class="field" style="margin-top: 8px">
                <div class="field__label">Mode</div>
                <select
                  class="select"
                  .value=${tb.mode || "suppress"}
                  @change=${(e: Event) =>
                    this._updateTimeBlocker(i, {
                      mode: (e.target as HTMLSelectElement).value,
                    })}
                >
                  <option value="suppress">Suppress</option>
                  <option value="allow">Allow only</option>
                </select>
              </div>
              <div class="day-picker">
                ${DAY_LABELS.map(
                  (label, di) => html`
                    <button
                      class="day-btn ${!tb.days || tb.days.includes(di) ? "active" : ""}"
                      @click=${() => this._toggleTimeBlockerDay(i, di)}
                    >
                      ${label}
                    </button>
                  `
                )}
              </div>
              <button
                class="btn btn--danger"
                style="font-size: 12px; padding: 6px 12px"
                @click=${() => this._removeTimeBlocker(i)}
              >
                Remove
              </button>
            </div>
          `
        )}
        <button class="btn btn--ghost" style="font-size: 12px; padding: 6px 12px" @click=${this._addTimeBlocker}>
          + Add Time Blocker
        </button>
      </fieldset>

      <fieldset>
        <legend>Condition Triggers</legend>
        ${cts.map(
          (ct, i) => html`
            <div class="dyn-row">
              <div class="field" style="margin-bottom: 8px">
                <div class="field__label">Entity</div>
                <ha-entity-picker
                  .hass=${this.hass}
                  .value=${ct.entity_id || ""}
                  @value-changed=${(e: CustomEvent) =>
                    this._updateConditionTrigger(i, {
                      entity_id: e.detail.value,
                    })}
                  label="Select entity"
                ></ha-entity-picker>
              </div>
              <div class="row2">
                <div class="field">
                  <div class="field__label">Operator</div>
                  <select
                    class="select"
                    .value=${ct.operator || "eq"}
                    @change=${(e: Event) =>
                      this._updateConditionTrigger(i, {
                        operator: (e.target as HTMLSelectElement).value,
                      })}
                  >
                    ${OPERATORS.map(
                      (op) => html`<option value=${op}>${op}</option>`
                    )}
                  </select>
                </div>
              </div>
              <div class="row2" style="margin-top: 8px">
                <div class="field">
                  <div class="field__label">Value</div>
                  <input
                    class="input"
                    type="text"
                    .value=${ct.value || ""}
                    @change=${(e: Event) =>
                      this._updateConditionTrigger(i, {
                        value: (e.target as HTMLInputElement).value,
                      })}
                  />
                </div>
                <div class="field">
                  <div class="field__label">On match</div>
                  <select
                    class="select"
                    .value=${ct.on_match || "boost"}
                    @change=${(e: Event) =>
                      this._updateConditionTrigger(i, {
                        on_match: (e.target as HTMLSelectElement).value,
                      })}
                  >
                    <option value="boost">Boost priority</option>
                    <option value="set_due">Set due now</option>
                  </select>
                </div>
              </div>
              <button
                class="btn btn--danger"
                style="font-size: 12px; padding: 6px 12px; margin-top: 8px"
                @click=${() => this._removeConditionTrigger(i)}
              >
                Remove
              </button>
            </div>
          `
        )}
        <button class="btn btn--ghost" style="font-size: 12px; padding: 6px 12px" @click=${this._addConditionTrigger}>
          + Add Condition Trigger
        </button>
      </fieldset>

      <fieldset>
        <legend>Defer Until</legend>
        <div style="display: flex; gap: 8px; align-items: center">
          <input
            class="input"
            type="datetime-local"
            style="flex: 1"
            .value=${this._toLocalDt(deferred)}
            @change=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value;
              this._set(
                "deferred_until",
                v ? new Date(v).toISOString() : null
              );
            }}
          />
          <button
            class="btn btn--ghost"
            style="font-size: 12px; padding: 6px 12px"
            @click=${() => this._set("deferred_until", null)}
          >
            Clear
          </button>
        </div>
      </fieldset>
    `;
  }

  // --- State helpers ---

  private _set(key: string, value: unknown) {
    this._item = { ...this._item, [key]: value };
  }

  private _toggleTrait(trait: string) {
    const traits = [...(this._item.traits || [])];
    const idx = traits.indexOf(trait);
    if (idx >= 0) traits.splice(idx, 1);
    else traits.push(trait);
    this._set("traits", traits);
  }

  private _toggleAssign(userId: string) {
    const assigned = [...(this._item.assigned_to || [])];
    const idx = assigned.indexOf(userId);
    if (idx >= 0) assigned.splice(idx, 1);
    else assigned.push(userId);
    this._set("assigned_to", assigned);
  }

  private _addTag(input: HTMLInputElement) {
    const val = input.value.trim();
    if (val && !(this._item.tags || []).includes(val)) {
      this._set("tags", [...(this._item.tags || []), val]);
      input.value = "";
    }
  }

  private _removeTag(index: number) {
    const tags = [...(this._item.tags || [])];
    tags.splice(index, 1);
    this._set("tags", tags);
  }

  // Recurrence helpers
  private _setRecurrenceType(type: string) {
    if (type === "none") {
      this._set("recurrence", null);
    } else {
      this._set("recurrence", {
        type,
        ...(type === "calendar"
          ? { calendar_preset: "daily", calendar_days: null, calendar_days_of_month: null }
          : {}),
        ...(type === "elapsed"
          ? { elapsed_interval: 1, elapsed_unit: "days" }
          : {}),
        ...(type === "frequency"
          ? { frequency_count: 3, frequency_period: 1, frequency_unit: "weeks" }
          : {}),
      });
    }
  }

  private _updateRecurrence(patch: Partial<RecurrenceConfig>) {
    this._set("recurrence", { ...this._item.recurrence, ...patch });
  }

  private _setCalendarPreset(preset: string | null) {
    this._updateRecurrence({
      calendar_preset: preset,
      calendar_days: preset ? null : [],
      calendar_days_of_month: null,
    });
  }

  private _toggleCalendarDay(day: number) {
    const days = [...(this._item.recurrence?.calendar_days || [])];
    const idx = days.indexOf(day);
    if (idx >= 0) days.splice(idx, 1);
    else days.push(day);
    this._updateRecurrence({
      calendar_days: days.length ? days : null,
      calendar_days_of_month: null,
      calendar_preset: null,
    });
  }

  // Blocker helpers
  private _setBlockers(blockers: Record<string, unknown>) {
    this._set("blockers", blockers);
  }

  private _toggleBlockerItem(uid: string) {
    const b = this._item.blockers || { mode: "ALL", items: [], item_mode: "ANY", sensors: [], sensor_mode: "ANY" };
    const items = [...(b.items || [])];
    const idx = items.indexOf(uid);
    if (idx >= 0) items.splice(idx, 1);
    else items.push(uid);
    this._setBlockers({ ...b, items });
  }

  // Requirements helpers
  private _setRequirements(requirements: Record<string, unknown>) {
    this._set("requirements", requirements);
  }

  // Time blocker helpers
  private _addTimeBlocker() {
    const tbs = [...(this._item.time_blockers || [])];
    tbs.push({ start_time: "09:00", end_time: "17:00", mode: "suppress", days: null });
    this._set("time_blockers", tbs);
  }

  private _removeTimeBlocker(index: number) {
    const tbs = [...(this._item.time_blockers || [])];
    tbs.splice(index, 1);
    this._set("time_blockers", tbs);
  }

  private _updateTimeBlocker(index: number, patch: Record<string, unknown>) {
    const tbs = [...(this._item.time_blockers || [])];
    tbs[index] = { ...tbs[index], ...patch };
    this._set("time_blockers", tbs);
  }

  private _toggleTimeBlockerDay(tbIndex: number, day: number) {
    const tbs = [...(this._item.time_blockers || [])];
    const tb = { ...tbs[tbIndex] };
    const days = tb.days ? [...tb.days] : [0, 1, 2, 3, 4, 5, 6];
    const idx = days.indexOf(day);
    if (idx >= 0) days.splice(idx, 1);
    else days.push(day);
    tb.days = days.length === 7 ? null : days;
    tbs[tbIndex] = tb;
    this._set("time_blockers", tbs);
  }

  // Condition trigger helpers
  private _addConditionTrigger() {
    const cts = [...(this._item.condition_triggers || [])];
    cts.push({ entity_id: "", operator: "eq", value: "", on_match: "boost" });
    this._set("condition_triggers", cts);
  }

  private _removeConditionTrigger(index: number) {
    const cts = [...(this._item.condition_triggers || [])];
    cts.splice(index, 1);
    this._set("condition_triggers", cts);
  }

  private _updateConditionTrigger(index: number, patch: Record<string, unknown>) {
    const cts = [...(this._item.condition_triggers || [])];
    cts[index] = { ...cts[index], ...patch };
    this._set("condition_triggers", cts);
  }

  // --- Save / Delete ---

  private async _save() {
    if (!this._item.title?.trim()) {
      this._error = "Title is required";
      return;
    }
    this._busy = true;
    this._error = "";

    try {
      // Only include fields the websocket schema accepts
      const ALLOWED_FIELDS = [
        "title", "description", "traits", "tags", "assigned_to",
        "priority", "due", "time_estimate", "buffer_before", "buffer_after",
        "needs_detail", "recurrence", "blockers", "requirements",
        "condition_triggers", "time_blockers", "deferred_until",
      ] as const;

      const data: Record<string, unknown> = {};
      for (const key of ALLOWED_FIELDS) {
        if (key in this._item) {
          data[key] = (this._item as Record<string, unknown>)[key];
        }
      }

      // Clean up empty nested objects
      if (data.blockers) {
        const b = data.blockers as any;
        if (!(b.items?.length) && !(b.sensors?.length)) data.blockers = null;
      }
      if (data.requirements) {
        const r = data.requirements as any;
        if (
          !(r.location?.length) &&
          !(r.people?.length) &&
          !(r.time_constraints?.length) &&
          !(r.context?.length) &&
          !(r.sensors?.length)
        )
          data.requirements = null;
      }
      if (data.time_blockers && (data.time_blockers as any[]).length === 0) {
        delete data.time_blockers;
      }
      if (data.condition_triggers && (data.condition_triggers as any[]).length === 0) {
        delete data.condition_triggers;
      }

      if (this._itemId) {
        await store.saveItem(this._entityId, this._itemId, data as Partial<YahtlItem>);
      } else {
        await store.createItem(this._entityId, data as { title: string } & Partial<YahtlItem>);
      }
      this.close();
    } catch (err: unknown) {
      this._error = (err as Error).message || "Failed to save";
    } finally {
      this._busy = false;
    }
  }

  private async _delete() {
    if (!this._itemId) return;
    this._busy = true;
    try {
      await store.deleteItem(this._entityId, this._itemId);
      this.close();
    } catch (err: unknown) {
      this._error = (err as Error).message || "Failed to delete";
    } finally {
      this._busy = false;
    }
  }

  // --- Utilities ---

  private _toLocalDt(iso: string | null | undefined): string {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  }

  private _splitComma(s: string): string[] {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  /** Get all zone entities from hass.states as { zone_name: friendly_name } */
  private _getZoneEntities(): Record<string, string> {
    if (!this.hass?.states) return {};
    const result: Record<string, string> = {};
    for (const [eid, state] of Object.entries(this.hass.states)) {
      if (eid.startsWith("zone.")) {
        const name = (state.attributes.friendly_name as string) || eid.replace("zone.", "");
        // Use the friendly name as the zone identifier (matches device_tracker states)
        result[name.toLowerCase()] = name;
      }
    }
    return result;
  }

  private _getZoneIcon(zoneId: string): string {
    if (!this.hass?.states) return "mdi:map-marker";
    // Find matching zone entity
    for (const [eid, state] of Object.entries(this.hass.states)) {
      if (eid.startsWith("zone.")) {
        const name = (state.attributes.friendly_name as string) || eid.replace("zone.", "");
        if (name.toLowerCase() === zoneId) {
          return (state.attributes.icon as string) || "mdi:map-marker";
        }
      }
    }
    return "mdi:map-marker";
  }

  /** Get all person entities from hass.states as { entity_id: friendly_name } */
  private _getPersonEntities(): Record<string, string> {
    if (!this.hass?.states) return {};
    const result: Record<string, string> = {};
    for (const [eid, state] of Object.entries(this.hass.states)) {
      if (eid.startsWith("person.")) {
        result[eid] = (state.attributes.friendly_name as string) || eid;
      }
    }
    return result;
  }
}

// Global listener for opening editor
document.addEventListener("yahatl-open-editor", ((e: CustomEvent) => {
  let editor = document.querySelector("yahatl-item-editor") as YahtlItemEditor;
  if (!editor) {
    editor = document.createElement("yahatl-item-editor") as YahtlItemEditor;
    document.body.appendChild(editor);
  }
  editor.open(e.detail);
}) as EventListener);
