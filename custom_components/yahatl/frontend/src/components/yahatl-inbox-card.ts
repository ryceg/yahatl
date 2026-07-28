import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles, primaryTrait, TRAIT_ICONS, TRAIT_RGB } from "../styles";
import { store, StoreController, renderStoreError } from "../store";
import { openItemEditor } from "../dialog";
import type { HomeAssistant, YahtlItemSummary } from "../types";

@customElement("yahatl-inbox-card")
export class YahtlInboxCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};
  @state() private _currentIdx = 0;
  private _store = new StoreController(this);
  private _initialized = false;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .inbox-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 16px 8px;
      }

      .inbox-header__title {
        font-size: 18px;
        font-weight: 500;
        letter-spacing: 0.15px;
        color: var(--yahatl-text);
      }

      .inbox-count {
        font-size: 12px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
      }

      .inbox-item {
        padding: 8px 16px 16px;
      }

      .inbox-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .inbox-title {
        font-size: 16px;
        font-weight: 500;
        letter-spacing: 0.1px;
        flex: 1;
      }

      .inbox-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
      }

      .inbox-actions {
        display: flex;
        gap: 10px;
      }

      .nav-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 16px;
        border-top: 1px solid var(--yahatl-divider);
      }
    `,
  ];

  setConfig(config: Record<string, unknown>) {
    this._config = config;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("yahatl-inbox-card-editor");
  }

  static getStubConfig(): Record<string, unknown> {
    return { title: "Inbox" };
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      store.setHass(this.hass);
      this._loadInbox();
    } else if (changed.has("hass") && this.hass) {
      store.setHass(this.hass);
    }
  }

  private async _loadInbox() {
    const lists = this._store.state.lists;
    if (lists.length === 0) await store.loadLists();
    for (const list of this._store.state.lists) {
      await store.loadItems(list.entity_id, { needs_detail: true });
    }
  }

  private _getInboxItems(): { entityId: string; item: YahtlItemSummary }[] {
    const result: { entityId: string; item: YahtlItemSummary }[] = [];
    // Filtered fetches live in the store's separate filtered cache (keyed by
    // entity + filter signature), so read them back with the same filters.
    for (const list of this._store.state.lists) {
      const items = store.getCachedItems(list.entity_id, { needs_detail: true });
      for (const item of items) {
        if (item.needs_detail) {
          result.push({ entityId: list.entity_id, item });
        }
      }
    }
    return result;
  }

  render() {
    const title = String(this._config.title || "Inbox");
    const inbox = this._getInboxItems();
    const count = inbox.length;

    if (count === 0) {
      return html`
        <ha-card>
          <div class="card-header">${title}</div>
          ${renderStoreError()}
          <div class="empty-state">All caught up — nothing needs detail</div>
        </ha-card>
      `;
    }

    const idx = Math.min(this._currentIdx, count - 1);
    const current = inbox[idx];
    const trait = primaryTrait(current.item.traits);
    const traitRgb = trait ? TRAIT_RGB[trait] : "var(--yahatl-rgb-primary)";
    const traitIcon = trait ? TRAIT_ICONS[trait] : "mdi:tray-full";

    return html`
      <ha-card>
        <div class="inbox-header">
          <span class="inbox-header__title">${title}</span>
          <span class="inbox-count">${idx + 1} of ${count}</span>
        </div>
        ${renderStoreError()}

        <div class="inbox-item">
          <div class="inbox-title-row">
            <div class="mush-shape-icon" style="--rgb-state: ${traitRgb}">
              <ha-icon icon=${traitIcon}></ha-icon>
            </div>
            <div class="inbox-title">${current.item.title}</div>
          </div>
          ${current.item.tags.length > 0
            ? html`
                <div class="inbox-tags">
                  ${current.item.tags.map(
                    (t) => html`<span class="tag-chip">#${t}</span>`
                  )}
                </div>
              `
            : nothing}
          <div class="inbox-actions">
            <button
              class="btn btn--primary"
              @click=${() => this._openEditor(current.entityId, current.item.uid)}
            >
              Add details
            </button>
            <button
              class="btn btn--ghost"
              @click=${() => this._markDone(current.entityId, current.item.uid)}
            >
              Good enough
            </button>
          </div>
        </div>

        ${count > 1
          ? html`
              <div class="nav-row">
                <button
                  class="btn btn--ghost"
                  ?disabled=${idx === 0}
                  @click=${() => (this._currentIdx = idx - 1)}
                >
                  Previous
                </button>
                <button
                  class="btn btn--ghost"
                  ?disabled=${idx >= count - 1}
                  @click=${() => (this._currentIdx = idx + 1)}
                >
                  Next
                </button>
              </div>
            `
          : nothing}
      </ha-card>
    `;
  }

  private _openEditor(entityId: string, itemId: string) {
    openItemEditor(this, { entityId, itemId, hass: this.hass });
  }

  private async _markDone(entityId: string, itemId: string) {
    const ok = await store.saveItem(entityId, itemId, { needs_detail: false });
    if (ok) await this._loadInbox();
  }

  getCardSize() {
    return 3;
  }
}

/** Config editor: the inbox card only reads `title` (it scans every yahatl
 *  list for needs-detail items on its own). */
@customElement("yahatl-inbox-card-editor")
export class YahtlInboxCardEditor extends LitElement {
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
        .schema=${YahtlInboxCardEditor._schema}
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
  type: "yahatl-inbox-card",
  name: "Yahatl Inbox",
  description: "Triage items that need more detail",
});
