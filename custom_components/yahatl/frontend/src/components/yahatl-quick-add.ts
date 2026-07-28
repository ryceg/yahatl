import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles } from "../styles";
import { store } from "../store";
import type { HomeAssistant } from "../types";

@customElement("yahatl-quick-add")
export class YahtlQuickAdd extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entityId = "";

  setConfig(config: Record<string, unknown>) {
    if (config.entity_id) this.entityId = config.entity_id as string;
  }
  @state() private _value = "";
  @state() private _busy = false;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .capture-row {
        display: flex;
        gap: 8px;
        padding: 8px 16px 12px;
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

  render() {
    return html`
      <div class="capture-row">
        <input
          type="text"
          placeholder="Quick add a task…"
          .value=${this._value}
          @input=${(e: InputEvent) =>
            (this._value = (e.target as HTMLInputElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter") this._add();
          }}
          ?disabled=${this._busy}
        />
        <button
          @click=${this._add}
          ?disabled=${this._busy || !this._value.trim()}
        >
          add
        </button>
      </div>
    `;
  }

  private async _add() {
    const title = this._value.trim();
    if (!title || !this.entityId) return;
    this._busy = true;
    try {
      // Keep the draft in the input if the create failed (flaky wifi etc).
      const ok = await store.createItem(this.entityId, { title });
      if (ok) this._value = "";
    } finally {
      this._busy = false;
    }
  }
}
