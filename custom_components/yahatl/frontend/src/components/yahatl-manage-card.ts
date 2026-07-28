import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles } from "../styles";
import { store, StoreController, renderStoreError } from "../store";
import type { HomeAssistant, MetaEntry, TagInfo } from "../types";

@customElement("yahatl-manage-card")
export class YahtlManageCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};
  private _store = new StoreController(this);
  private _initialized = false;

  // Editing state for contexts
  @state() private _editingContext: string | null = null; // id being edited, or "__new__"
  @state() private _editName = "";
  @state() private _editIcon = "";

  // Editing state for locations
  @state() private _editingLocation: string | null = null;
  @state() private _editLocName = "";
  @state() private _editLocIcon = "";

  // Editing state for tags
  @state() private _renamingTag: string | null = null;
  @state() private _renameValue = "";

  // Confirm deletion
  @state() private _confirmDelete: { type: string; id: string } | null = null;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .section {
        padding: 0 0 8px;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 8px;
      }

      .section-title {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 600;
        color: var(--yahatl-text-secondary);
      }

      .section-divider {
        border: none;
        border-top: 1px solid var(--yahatl-divider);
        margin: 0;
      }

      .entry-row {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        gap: 10px;
      }

      .entry-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(var(--yahatl-rgb-primary), 0.10);
        color: rgb(var(--yahatl-rgb-primary));
        display: grid;
        place-items: center;
        flex: none;
      }

      .entry-icon ha-icon {
        --mdc-icon-size: 18px;
        color: inherit;
      }

      .entry-name {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .entry-badge {
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        background: rgba(var(--rgb-primary-text-color), 0.05);
        padding: 2px 8px;
        border-radius: 10px;
        flex-shrink: 0;
      }

      .entry-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        color: var(--yahatl-text-secondary);
        -webkit-tap-highlight-color: transparent;
        transition: background-color 120ms;
      }

      .icon-btn:hover {
        background: rgba(var(--rgb-primary-text-color), 0.06);
      }

      .icon-btn:active {
        opacity: 0.7;
      }

      .icon-btn ha-icon {
        --mdc-icon-size: 18px;
        color: inherit;
      }

      .icon-btn--danger {
        color: rgb(var(--rgb-danger));
      }

      /* Expand-in-place editor */
      .edit-panel {
        padding: 8px 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: rgba(var(--rgb-primary-text-color), 0.02);
        border-top: 1px solid var(--yahatl-divider);
        border-bottom: 1px solid var(--yahatl-divider);
      }

      .edit-row {
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }

      .edit-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }

      .edit-field label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--yahatl-text-secondary);
        font-weight: 500;
      }

      .edit-field input {
        padding: 8px 10px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        -webkit-appearance: none;
      }

      .edit-field input:focus {
        outline: none;
        border-color: rgb(var(--yahatl-rgb-primary));
      }

      .edit-buttons {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
        padding-top: 2px;
      }

      /* Tag rename inline */
      .tag-rename-input {
        padding: 4px 8px;
        border: 1px solid rgb(var(--yahatl-rgb-primary));
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        width: 120px;
        -webkit-appearance: none;
      }

      .tag-rename-input:focus {
        outline: none;
      }

      /* Confirm delete overlay */
      .confirm-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(var(--rgb-danger), 0.08);
        border-top: 1px solid var(--yahatl-divider);
      }

      .confirm-bar__msg {
        flex: 1;
        font-size: 13px;
        color: rgb(var(--rgb-danger));
      }

      .add-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        margin: 4px 16px 8px;
        border: 1px dashed var(--yahatl-divider);
        border-radius: 8px;
        background: none;
        cursor: pointer;
        font-size: 13px;
        font-family: inherit;
        color: var(--yahatl-text-secondary);
        -webkit-tap-highlight-color: transparent;
        width: calc(100% - 32px);
        box-sizing: border-box;
      }

      .add-btn:hover {
        border-color: rgb(var(--yahatl-rgb-primary));
        color: rgb(var(--yahatl-rgb-primary));
      }

      .add-btn ha-icon {
        --mdc-icon-size: 16px;
      }
    `,
  ];

  setConfig(config: Record<string, unknown>) {
    this._config = config;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("yahatl-manage-card-editor");
  }

  static getStubConfig(): Record<string, unknown> {
    return { title: "Manage" };
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      store.setHass(this.hass);
      store.loadMeta();
      store.loadTags();
    } else if (changed.has("hass") && this.hass) {
      store.setHass(this.hass);
    }
  }

  render() {
    const meta = this._store.state.meta;
    const tags = this._store.state.tags;
    const contexts = meta?.contexts || [];
    const locations = meta?.locations || [];
    const zones = this._getZones();

    return html`
      <ha-card>
        <div class="card-header">${String(this._config.title || "Manage")}</div>
        ${renderStoreError()}

        <!-- Contexts -->
        <div class="section">
          <div class="section-header">
            <span class="section-title">Contexts</span>
          </div>
          ${contexts.map((c, i) => this._renderContextRow(c, i, contexts.length))}
          ${this._editingContext === "__new__"
            ? this._renderContextEditor(null)
            : html`
                <button class="add-btn" @click=${() => this._startNewContext()}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  Add context
                </button>
              `}
        </div>

        <hr class="section-divider" />

        <!-- Tags -->
        <div class="section">
          <div class="section-header">
            <span class="section-title">Tags</span>
          </div>
          ${tags.length === 0
            ? html`<div class="empty-state" style="padding: 12px 16px">No tags in use</div>`
            : tags.map((t) => this._renderTagRow(t))}
        </div>

        <hr class="section-divider" />

        <!-- Locations -->
        <div class="section">
          <div class="section-header">
            <span class="section-title">Custom Locations</span>
          </div>
          ${zones.length > 0
            ? html`
                <div style="padding: 0 16px 6px; font-size: 12px; color: var(--yahatl-text-secondary)">
                  HA zones auto-included. Custom locations extend them.
                </div>
              `
            : nothing}
          ${locations.map((l, i) => this._renderLocationRow(l, i, locations.length))}
          ${this._editingLocation === "__new__"
            ? this._renderLocationEditor(null)
            : html`
                <button class="add-btn" @click=${() => this._startNewLocation()}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  Add location
                </button>
              `}
        </div>

        <!-- Confirm delete bar -->
        ${this._confirmDelete ? this._renderConfirmBar() : nothing}
      </ha-card>
    `;
  }

  // --- Context rendering ---

  private _renderContextRow(c: MetaEntry, index: number, total: number) {
    if (this._editingContext === c.id) {
      return this._renderContextEditor(c);
    }

    return html`
      <div class="entry-row">
        <div class="entry-icon">
          <ha-icon icon=${c.icon}></ha-icon>
        </div>
        <span class="entry-name">${c.name}</span>
        <div class="entry-actions">
          ${index > 0
            ? html`<button class="icon-btn" @click=${() => this._moveContext(index, -1)} title="Move up" aria-label="Move ${c.name} up">
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </button>`
            : nothing}
          ${index < total - 1
            ? html`<button class="icon-btn" @click=${() => this._moveContext(index, 1)} title="Move down" aria-label="Move ${c.name} down">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
              </button>`
            : nothing}
          <button class="icon-btn" @click=${() => this._startEditContext(c)} title="Edit" aria-label="Edit ${c.name}">
            <ha-icon icon="mdi:pencil"></ha-icon>
          </button>
          <button class="icon-btn icon-btn--danger" @click=${() => this._requestDelete("context", c.id)} title="Delete" aria-label="Delete ${c.name}">
            <ha-icon icon="mdi:delete"></ha-icon>
          </button>
        </div>
      </div>
    `;
  }

  private _renderContextEditor(existing: MetaEntry | null) {
    return html`
      <div class="edit-panel">
        <div class="edit-row">
          <div class="edit-field">
            <label>Name</label>
            <input
              type="text"
              .value=${this._editName}
              @input=${(e: InputEvent) => (this._editName = (e.target as HTMLInputElement).value)}
              placeholder="e.g. Deep Work"
            />
          </div>
          <div class="edit-field" style="flex: 0 0 auto; width: 200px">
            <label>Icon</label>
            <ha-icon-picker
              .hass=${this.hass}
              .value=${this._editIcon}
              @value-changed=${(e: CustomEvent) => (this._editIcon = e.detail.value)}
            ></ha-icon-picker>
          </div>
        </div>
        <div class="edit-buttons">
          <button class="btn btn--ghost" @click=${() => this._cancelEditContext()}>Cancel</button>
          <button
            class="btn btn--primary"
            @click=${() => this._saveContext(existing)}
            ?disabled=${!this._editName.trim()}
          >
            ${existing ? "Save" : "Add"}
          </button>
        </div>
      </div>
    `;
  }

  // --- Location rendering ---

  private _renderLocationRow(l: MetaEntry, index: number, total: number) {
    if (this._editingLocation === l.id) {
      return this._renderLocationEditor(l);
    }

    return html`
      <div class="entry-row">
        <div class="entry-icon">
          <ha-icon icon=${l.icon}></ha-icon>
        </div>
        <span class="entry-name">${l.name}</span>
        <div class="entry-actions">
          ${index > 0
            ? html`<button class="icon-btn" @click=${() => this._moveLocation(index, -1)} title="Move up" aria-label="Move ${l.name} up">
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </button>`
            : nothing}
          ${index < total - 1
            ? html`<button class="icon-btn" @click=${() => this._moveLocation(index, 1)} title="Move down" aria-label="Move ${l.name} down">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
              </button>`
            : nothing}
          <button class="icon-btn" @click=${() => this._startEditLocation(l)} title="Edit" aria-label="Edit ${l.name}">
            <ha-icon icon="mdi:pencil"></ha-icon>
          </button>
          <button class="icon-btn icon-btn--danger" @click=${() => this._requestDelete("location", l.id)} title="Delete" aria-label="Delete ${l.name}">
            <ha-icon icon="mdi:delete"></ha-icon>
          </button>
        </div>
      </div>
    `;
  }

  private _renderLocationEditor(existing: MetaEntry | null) {
    return html`
      <div class="edit-panel">
        <div class="edit-row">
          <div class="edit-field">
            <label>Name</label>
            <input
              type="text"
              .value=${this._editLocName}
              @input=${(e: InputEvent) => (this._editLocName = (e.target as HTMLInputElement).value)}
              placeholder="e.g. Office"
            />
          </div>
          <div class="edit-field" style="flex: 0 0 auto; width: 200px">
            <label>Icon</label>
            <ha-icon-picker
              .hass=${this.hass}
              .value=${this._editLocIcon}
              @value-changed=${(e: CustomEvent) => (this._editLocIcon = e.detail.value)}
            ></ha-icon-picker>
          </div>
        </div>
        <div class="edit-buttons">
          <button class="btn btn--ghost" @click=${() => this._cancelEditLocation()}>Cancel</button>
          <button
            class="btn btn--primary"
            @click=${() => this._saveLocation(existing)}
            ?disabled=${!this._editLocName.trim()}
          >
            ${existing ? "Save" : "Add"}
          </button>
        </div>
      </div>
    `;
  }

  // --- Tag rendering ---

  private _renderTagRow(t: TagInfo) {
    const isRenaming = this._renamingTag === t.name;

    return html`
      <div class="entry-row">
        <div class="entry-icon" style="background: rgba(var(--rgb-primary-text-color), 0.06); color: var(--yahatl-text-secondary)">
          <ha-icon icon="mdi:pound"></ha-icon>
        </div>
        ${isRenaming
          ? html`
              <input
                class="tag-rename-input"
                type="text"
                .value=${this._renameValue}
                @input=${(e: InputEvent) => (this._renameValue = (e.target as HTMLInputElement).value)}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === "Enter") this._confirmRenameTag(t.name);
                  if (e.key === "Escape") this._renamingTag = null;
                }}
              />
              <button class="btn btn--primary" style="padding: 5px 12px; font-size: 12px"
                @click=${() => this._confirmRenameTag(t.name)}
                ?disabled=${!this._renameValue.trim() || this._renameValue === t.name}
              >ok</button>
              <button class="btn btn--ghost" style="padding: 5px 10px; font-size: 12px"
                @click=${() => (this._renamingTag = null)}
              >cancel</button>
            `
          : html`
              <span class="entry-name">#${t.name}</span>
              <span class="entry-badge">${t.count} item${t.count !== 1 ? "s" : ""}</span>
              <div class="entry-actions">
                <button class="icon-btn" @click=${() => this._startRenameTag(t)} title="Rename" aria-label="Rename tag ${t.name}">
                  <ha-icon icon="mdi:pencil"></ha-icon>
                </button>
                <button class="icon-btn icon-btn--danger" @click=${() => this._requestDelete("tag", t.name)} title="Delete" aria-label="Delete tag ${t.name}">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `}
      </div>
    `;
  }

  // --- Confirm delete bar ---

  private _renderConfirmBar() {
    const d = this._confirmDelete!;
    const label =
      d.type === "context" ? "context" : d.type === "location" ? "location" : "tag";

    // Count usage for contexts
    let usageNote = "";
    if (d.type === "tag") {
      const tag = this._store.state.tags.find((t) => t.name === d.id);
      if (tag && tag.count > 0) {
        usageNote = ` Used by ${tag.count} item${tag.count !== 1 ? "s" : ""}.`;
      }
    }

    return html`
      <div class="confirm-bar">
        <span class="confirm-bar__msg">
          Delete ${label} "${d.id}"?${usageNote} This will remove it from all items.
        </span>
        <button class="btn btn--ghost" @click=${() => (this._confirmDelete = null)}>Cancel</button>
        <button class="btn btn--danger" @click=${() => this._executeDelete()}>Delete</button>
      </div>
    `;
  }

  // --- Context actions ---

  private _startNewContext() {
    this._editingContext = "__new__";
    this._editName = "";
    this._editIcon = "mdi:label";
  }

  private _startEditContext(c: MetaEntry) {
    this._editingContext = c.id;
    this._editName = c.name;
    this._editIcon = c.icon;
  }

  private _cancelEditContext() {
    this._editingContext = null;
  }

  private async _saveContext(existing: MetaEntry | null) {
    const meta = this._store.state.meta;
    if (!meta) return;

    const name = this._editName.trim();
    if (!name) return;

    const icon = this._editIcon || "mdi:label";

    // The id is the entry's identity and stays stable on rename — items
    // reference contexts by id, so only the display name (and icon) change.
    // New entries get a slug derived from the name.
    let contexts: MetaEntry[];
    if (existing) {
      contexts = meta.contexts.map((c) =>
        c.id === existing.id ? { id: existing.id, name, icon } : c
      );
    } else {
      const newId = name.toLowerCase().replace(/\s+/g, "_");
      contexts = [...meta.contexts, { id: newId, name, icon }];
    }

    const ok = await store.saveMeta({ ...meta, contexts });
    if (ok) this._editingContext = null;
  }

  private async _moveContext(index: number, direction: number) {
    const meta = this._store.state.meta;
    if (!meta) return;

    const contexts = [...meta.contexts];
    const target = index + direction;
    if (target < 0 || target >= contexts.length) return;
    [contexts[index], contexts[target]] = [contexts[target], contexts[index]];

    await store.saveMeta({ ...meta, contexts });
  }

  // --- Location actions ---

  private _startNewLocation() {
    this._editingLocation = "__new__";
    this._editLocName = "";
    this._editLocIcon = "mdi:map-marker";
  }

  private _startEditLocation(l: MetaEntry) {
    this._editingLocation = l.id;
    this._editLocName = l.name;
    this._editLocIcon = l.icon;
  }

  private _cancelEditLocation() {
    this._editingLocation = null;
  }

  private async _saveLocation(existing: MetaEntry | null) {
    const meta = this._store.state.meta;
    if (!meta) return;

    const name = this._editLocName.trim();
    if (!name) return;

    const newId = name.toLowerCase().replace(/\s+/g, "_");
    const icon = this._editLocIcon || "mdi:map-marker";

    let locations: MetaEntry[];
    if (existing) {
      locations = meta.locations.map((l) =>
        l.id === existing.id ? { id: existing.id, name, icon } : l
      );
    } else {
      locations = [...meta.locations, { id: newId, name, icon }];
    }

    const ok = await store.saveMeta({ ...meta, locations });
    if (ok) this._editingLocation = null;
  }

  private async _moveLocation(index: number, direction: number) {
    const meta = this._store.state.meta;
    if (!meta) return;

    const locations = [...meta.locations];
    const target = index + direction;
    if (target < 0 || target >= locations.length) return;
    [locations[index], locations[target]] = [locations[target], locations[index]];

    await store.saveMeta({ ...meta, locations });
  }

  // --- Tag actions ---

  private _startRenameTag(t: TagInfo) {
    this._renamingTag = t.name;
    this._renameValue = t.name;
  }

  private async _confirmRenameTag(oldName: string) {
    const newName = this._renameValue.trim();
    if (!newName || newName === oldName) return;
    const ok = await store.renameTag(oldName, newName);
    if (ok) this._renamingTag = null;
  }

  // --- Delete flow ---

  private _requestDelete(type: string, id: string) {
    this._confirmDelete = { type, id };
  }

  private async _executeDelete() {
    const d = this._confirmDelete;
    if (!d) return;

    if (d.type === "context") {
      const meta = this._store.state.meta;
      if (meta) {
        const contexts = meta.contexts.filter((c) => c.id !== d.id);
        await store.saveMeta({ ...meta, contexts });
      }
    } else if (d.type === "location") {
      const meta = this._store.state.meta;
      if (meta) {
        const locations = meta.locations.filter((l) => l.id !== d.id);
        await store.saveMeta({ ...meta, locations });
      }
    } else if (d.type === "tag") {
      await store.deleteTag(d.id);
    }

    this._confirmDelete = null;
  }

  // --- Helpers ---

  private _getZones(): { id: string; name: string; icon: string }[] {
    if (!this.hass?.states) return [];
    const zones: { id: string; name: string; icon: string }[] = [];
    for (const [eid, state] of Object.entries(this.hass.states)) {
      if (eid.startsWith("zone.")) {
        const name = (state.attributes.friendly_name as string) || eid.replace("zone.", "");
        const icon = (state.attributes.icon as string) || "mdi:map-marker";
        zones.push({ id: name.toLowerCase(), name, icon });
      }
    }
    return zones;
  }

  getCardSize() {
    return 6;
  }
}

/** Config editor: the manage card only reads `title` (contexts/tags/locations
 *  all come from the yahatl meta store, not card config). */
@customElement("yahatl-manage-card-editor")
export class YahtlManageCardEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};

  private static readonly _schema = [
    { name: "title", selector: { text: {} } },
  ];

  setConfig(config: Record<string, unknown>) {
    this._config = config;
  }

  render() {
    if (!this.hass) return nothing;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${YahtlManageCardEditor._schema}
        .computeLabel=${(s: { name: string }) =>
          s.name === "title" ? "Card title" : s.name}
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
  type: "yahatl-manage-card",
  name: "Yahatl Manage",
  description: "Manage contexts, tags, and locations for yahatl",
});
