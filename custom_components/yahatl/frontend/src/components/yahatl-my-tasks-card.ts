import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles, TRAIT_ICONS, TRAIT_RGB, primaryTrait } from "../styles";
import { store, StoreController, renderStoreError } from "../store";
import { formatDue } from "../format";
import { keyActivate } from "../a11y";
import { showSnackbar } from "./yahatl-snackbar";
import { openItemEditor } from "../dialog";
import type { HomeAssistant, YahtlItemSummary } from "../types";

// A merged item carries the list it came from so we can act on it and label it.
interface MyTask extends YahtlItemSummary {
  _entityId: string;
  _listName: string;
}

@customElement("yahatl-my-tasks-card")
export class YahtlMyTasksCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};
  @state() private _showNotYet = false;
  @state() private _showDeferred = false;
  @state() private _showCompleted = false;
  @state() private _draft = "";
  @state() private _busy = false;
  private _store = new StoreController(this);
  private _initialized = false;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 14px 16px 10px;
      }

      .header__title {
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 0.1px;
      }

      .header__count {
        font-size: 13px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
      }

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

      .item-badges .list-tag {
        color: rgb(var(--yahatl-rgb-primary));
        font-weight: 500;
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

      /* Quick add */
      .capture-row {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid var(--yahatl-divider);
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
        min-width: 56px;
      }

      .capture-row button:active {
        opacity: 0.7;
      }
    `,
  ];

  setConfig(config: Record<string, unknown>) {
    if (!config.assigned_to) {
      throw new Error("yahatl-my-tasks-card: 'assigned_to' (a Home Assistant user id) is required");
    }
    this._config = config;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("yahatl-my-tasks-card-editor");
  }

  static getStubConfig(hass?: HomeAssistant): Record<string, unknown> {
    // Seed with the first person that maps to an HA user so the preview
    // renders instead of throwing on the required assigned_to.
    const firstUserId = personOptions(hass)[0]?.value ?? "";
    return { assigned_to: firstUserId, title: "My Tasks" };
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      store.setHass(this.hass);
      void this._loadAll();
    } else if (changed.has("hass") && this.hass) {
      store.setHass(this.hass);
    }
  }

  private async _loadAll() {
    await store.loadLists();
    // Load every list's items (unfiltered — we filter client-side and keep the
    // shared store cache reusable across cards).
    await Promise.all(
      this._store.state.lists.map((l) => store.loadItems(l.entity_id))
    );
  }

  private get _userId(): string {
    return String(this._config.assigned_to || "");
  }

  // List new quick-added tasks land in — the Inbox by default.
  private get _addEntity(): string {
    return String(this._config.add_entity || "todo.yahatl");
  }

  private _collectTasks(): MyTask[] {
    const userId = this._userId;
    const names = new Map<string, string>();
    for (const l of this._store.state.lists) names.set(l.entity_id, l.name);

    const tasks: MyTask[] = [];
    for (const [entityId, items] of this._store.state.items.entries()) {
      for (const item of items) {
        if (!item.assigned_to || !item.assigned_to.includes(userId)) continue;
        tasks.push({
          ...item,
          _entityId: entityId,
          _listName: names.get(entityId) || "",
        });
      }
    }
    return tasks;
  }

  private _sortActive(a: MyTask, b: MyTask): number {
    // Overdue/soonest due first, then items without a due date.
    const da = a.due ? new Date(a.due).getTime() : Infinity;
    const db = b.due ? new Date(b.due).getTime() : Infinity;
    if (da !== db) return da - db;
    return a.title.localeCompare(b.title);
  }

  render() {
    const title = String(this._config.title || "My Tasks");
    const tasks = this._collectTasks();

    // "Not Yet" = items an automatic blocker (lead-time, time window, or a
    // dependency) is holding back. Manual deferral is checked first so those
    // keep their own "Deferred" group; a block_reason on a non-deferred item
    // means it's automatically held.
    const active: MyTask[] = [];
    const notYet: MyTask[] = [];
    const deferred: MyTask[] = [];
    const completed: MyTask[] = [];
    for (const item of tasks) {
      if (item.status === "completed") completed.push(item);
      else if (this._isDeferred(item)) deferred.push(item);
      else if (item.block_reason) notYet.push(item);
      else active.push(item);
    }
    active.sort((a, b) => this._sortActive(a, b));
    notYet.sort((a, b) => this._sortActive(a, b));

    return html`
      <ha-card>
        <div class="header">
          <span class="header__title">${title}</span>
          <span class="header__count">${active.length} items</span>
        </div>
        ${renderStoreError()}

        ${tasks.length === 0
          ? html`<div class="empty-state">Nothing assigned to you — nice.</div>`
          : nothing}
        ${active.map((item) => this._renderItem(item))}
        ${notYet.length > 0
          ? this._renderGroup(
              "Not Yet",
              "mdi:timer-sand",
              notYet,
              this._showNotYet,
              () => (this._showNotYet = !this._showNotYet)
            )
          : nothing}
        ${deferred.length > 0
          ? this._renderGroup(
              "Deferred",
              "mdi:clock-outline",
              deferred,
              this._showDeferred,
              () => (this._showDeferred = !this._showDeferred)
            )
          : nothing}
        ${completed.length > 0
          ? this._renderGroup(
              "Completed",
              "mdi:check-circle-outline",
              completed,
              this._showCompleted,
              () => (this._showCompleted = !this._showCompleted)
            )
          : nothing}

        <div class="capture-row">
          <input
            type="text"
            placeholder="Add a task for ${title}…"
            .value=${this._draft}
            @input=${(e: InputEvent) =>
              (this._draft = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") this._add();
            }}
            ?disabled=${this._busy}
          />
          <button
            @click=${this._add}
            ?disabled=${this._busy || !this._draft.trim()}
          >
            add
          </button>
        </div>
      </ha-card>
    `;
  }

  private async _add() {
    const title = this._draft.trim();
    const userId = this._userId;
    if (!title || !userId || this._busy) return;
    this._busy = true;
    try {
      // Keep the draft in the input if the create failed (flaky wifi etc);
      // the store surfaces the error via the banner.
      const ok = await store.createItem(this._addEntity, {
        title,
        assigned_to: [userId],
      });
      if (ok) this._draft = "";
    } finally {
      this._busy = false;
    }
  }

  private _renderGroup(
    label: string,
    icon: string,
    items: MyTask[],
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
      ${expanded ? items.map((item) => this._renderItem(item)) : nothing}
    `;
  }

  private _isDeferred(item: YahtlItemSummary): boolean {
    return !!item.deferred_until && new Date(item.deferred_until) > new Date();
  }

  private _renderItem(item: MyTask) {
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
        @click=${() => this._openEditor(item)}
        @keydown=${keyActivate(() => this._openEditor(item))}
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
            if (!isCompleted) this._complete(item);
          }}
          @keydown=${keyActivate((e: Event) => {
            e.stopPropagation();
            if (!isCompleted) this._complete(item);
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
            ${item._listName
              ? html`<span class="list-tag">${item._listName}</span>`
              : nothing}
            ${due ? html`<span class=${due.className}>${due.label}</span>` : nothing}
            ${item.time_estimate ? html`<span>${item.time_estimate}m</span>` : nothing}
            ${item.has_recurrence ? html`<span>repeats</span>` : nothing}
            ${item.current_streak > 0
              ? html`<span class="streak">${item.current_streak}d streak</span>`
              : nothing}
            ${item.needs_detail
              ? html`<span class="needs-detail">needs detail</span>`
              : nothing}
            ${isDeferred ? html`<span class="deferred">deferred</span>` : nothing}
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

  private async _complete(item: MyTask) {
    // Capture the pre-completion state for UNDO before it changes.
    const prior = {
      status: item.status,
      due: item.due ?? null,
      deferred_until: item.deferred_until ?? null,
    };
    const ok = await store.completeItem(item._entityId, item.uid);
    if (ok) {
      showSnackbar(`Completed "${item.title}"`, {
        label: "UNDO",
        // Failures surface via the store's lastError banner.
        run: () => store.uncompleteItem(item._entityId, item.uid, prior),
      });
    }
  }

  private _openEditor(item: MyTask) {
    openItemEditor(this, {
      entityId: item._entityId,
      itemId: item.uid,
      hass: this.hass,
    });
  }

  getCardSize() {
    return 6;
  }
}

/** Person entities that map to an HA user: dropdown label is the friendly
 *  name, stored value is attributes.user_id (what items are assigned to).
 *  Persons without a user_id can't own tasks, so they're skipped. */
function personOptions(
  hass?: HomeAssistant | null
): { value: string; label: string }[] {
  if (!hass?.states) return [];
  const options: { value: string; label: string }[] = [];
  for (const [eid, state] of Object.entries(hass.states)) {
    if (!eid.startsWith("person.")) continue;
    const userId = state.attributes.user_id as string | undefined;
    if (!userId) continue;
    const label =
      (state.attributes.friendly_name as string) || eid.replace("person.", "");
    options.push({ value: userId, label });
  }
  return options;
}

/** Visual config editor for the my-tasks card (ha-form based, same pattern
 *  as the queue card editor). */
@customElement("yahatl-my-tasks-card-editor")
export class YahtlMyTasksCardEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};

  // Only fields the card reads: assigned_to (required HA user id, picked via
  // person entities), optional title and add_entity (quick-add target list).
  private _schema() {
    return [
      {
        name: "assigned_to",
        required: true,
        selector: {
          select: { options: personOptions(this.hass), mode: "dropdown" },
        },
      },
      { name: "title", selector: { text: {} } },
      { name: "add_entity", selector: { entity: { domain: "todo" } } },
    ];
  }

  private static readonly _labels: Record<string, string> = {
    assigned_to: "Person (whose tasks to show)",
    title: "Card title",
    add_entity: "List quick-added tasks go to",
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
        .schema=${this._schema()}
        .computeLabel=${(s: { name: string }) =>
          YahtlMyTasksCardEditor._labels[s.name] ?? s.name}
        .computeHelper=${(s: { name: string }) => {
          // Surface the raw stored user id so it can be cross-checked.
          if (s.name === "assigned_to" && this._config.assigned_to) {
            return `HA user id: ${this._config.assigned_to}`;
          }
          if (s.name === "add_entity") return "Defaults to the Inbox (todo.yahatl)";
          return undefined;
        }}
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
  type: "yahatl-my-tasks-card",
  name: "Yahatl My Tasks",
  description: "Combined list of tasks assigned to one person across every yahatl list",
});
