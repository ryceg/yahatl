import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { sharedStyles } from "../styles";
import { store, StoreController } from "../store";
import type { HomeAssistant } from "../types";

function label(s: string): string {
  return s.replace(/_/g, " ");
}

@customElement("yahatl-context-bar")
export class YahtlContextBar extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  private _store = new StoreController(this);
  private _initialized = false;

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

  // Wired like the other cards: wait for hass so the store has an API before
  // loading. connectedCallback fired before hass was set, so if this element
  // rendered first the loads were silently dropped and no chips appeared.
  updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      store.setHass(this.hass);
      store.loadContext();
      store.loadMeta();
    } else if (changed.has("hass") && this.hass) {
      store.setHass(this.hass);
    }
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
    const meta = this._store.state.meta;
    const loc = ctx?.location || null;
    const ctxs = ctx?.contexts || [];
    const allLocations = this._getMergedLocations();
    const contexts = meta?.contexts || [];

    return html`
      <div class="context-bar">
        <span class="section-label">Where</span>
        ${allLocations.map(
          (z) => html`
            <button
              class="mush-chip ${loc === z.id ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--yahatl-rgb-primary)"
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
        ${contexts.map(
          (c) => html`
            <button
              class="mush-chip ${ctxs.includes(c.id) ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--yahatl-rgb-primary)"
              @click=${() => this._toggleContext(c.id, ctxs)}
            >
              <span class="mush-chip__icon">
                <ha-icon icon=${c.icon}></ha-icon>
              </span>
              ${c.name}
            </button>
          `
        )}
      </div>
    `;
  }

  private _getMergedLocations(): { id: string; name: string; icon: string }[] {
    const zones = this._getZones();
    const customLocations = this._store.state.meta?.locations || [];
    const merged = new Map<string, { id: string; name: string; icon: string }>();

    // HA zones first
    for (const z of zones) {
      merged.set(z.id, z);
    }
    // Custom locations override or extend
    for (const l of customLocations) {
      merged.set(l.id, l);
    }
    return Array.from(merged.values());
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
