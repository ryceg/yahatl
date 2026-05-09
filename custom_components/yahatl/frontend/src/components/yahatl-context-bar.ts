import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { sharedStyles } from "../styles";
import { store, StoreController } from "../store";
import type { HomeAssistant } from "../types";

const CONTEXTS = [
  "focused_work",
  "calls_ok",
  "errands",
  "exercise",
  "relaxation",
] as const;
const CONTEXT_ICONS: Record<string, string> = {
  focused_work: "mdi:head-cog",
  calls_ok: "mdi:phone",
  errands: "mdi:cart",
  exercise: "mdi:run",
  relaxation: "mdi:sofa",
};

function label(s: string): string {
  return s.replace(/_/g, " ");
}

@customElement("yahatl-context-bar")
export class YahtlContextBar extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  private _store = new StoreController(this);

  setConfig(_config: Record<string, unknown>) {}

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .context-bar {
        display: flex;
        gap: var(--chip-spacing);
        padding: 8px 16px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        align-items: center;
      }

      .context-bar::-webkit-scrollbar {
        display: none;
      }

      .section-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 500;
        color: var(--yahatl-text-secondary);
        padding: 0 4px;
        white-space: nowrap;
        flex-shrink: 0;
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    store.loadContext();
  }

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

  render() {
    const ctx = this._store.state.context;
    const loc = ctx?.location || null;
    const ctxs = ctx?.contexts || [];
    const zones = this._getZones();

    return html`
      <div class="context-bar">
        <span class="section-label">Where</span>
        ${zones.map(
          (z) => html`
            <button
              class="mush-chip ${loc === z.id ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--rgb-primary-color)"
              @click=${() => this._setLocation(loc === z.id ? null : z.id)}
            >
              <span class="mush-chip__icon">
                <ha-icon icon=${z.icon}></ha-icon>
              </span>
              ${z.name}
            </button>
          `
        )}
        <span class="section-label">Doing</span>
        ${CONTEXTS.map(
          (c) => html`
            <button
              class="mush-chip ${ctxs.includes(c) ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--rgb-primary-color)"
              @click=${() => this._toggleContext(c, ctxs)}
            >
              <span class="mush-chip__icon">
                <ha-icon icon=${CONTEXT_ICONS[c]}></ha-icon>
              </span>
              ${label(c)}
            </button>
          `
        )}
      </div>
    `;
  }

  private async _setLocation(location: string | null) {
    await store.setContext({ location });
  }

  private async _toggleContext(ctx: string, current: string[]) {
    const next = current.includes(ctx)
      ? current.filter((c) => c !== ctx)
      : [...current, ctx];
    await store.setContext({ contexts: next });
  }
}
