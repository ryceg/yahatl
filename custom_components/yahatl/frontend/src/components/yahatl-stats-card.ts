import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { sharedStyles } from "../styles";
import { store, StoreController } from "../store";
import type { HomeAssistant } from "../types";

interface StatTile {
  icon: string;
  value: number;
  label: string;
  rgb: string;
}

@customElement("yahatl-stats-card")
export class YahtlStatsCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  private _store = new StoreController(this);
  private _initialized = false;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      /* On narrow screens (mobile HA), stack 2x2 */
      @media (max-width: 400px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .stat-card {
        background: var(--yahatl-card-bg);
        border-radius: var(--yahatl-border-radius);
        border: var(--yahatl-border-width) solid var(--yahatl-border-color);
        overflow: hidden;
      }
    `,
  ];

  updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && this.hass && !this._initialized) {
      this._initialized = true;
      store.setHass(this.hass);
      store.loadQueue();
    } else if (changed.has("hass") && this.hass) {
      store.setHass(this.hass);
    }
  }

  setConfig(_config: Record<string, unknown>) {}

  render() {
    const q = this._store.state.queue;
    if (!q) {
      return html`<div class="stats-grid">
        ${[0, 1, 2, 3].map(
          () => html`
            <div class="stat-card">
              <div class="mush-state-item">
                <div class="mush-shape-icon"></div>
                <div class="mush-state-info">
                  <div class="mush-state-info__primary">–</div>
                  <div class="mush-state-info__secondary">loading</div>
                </div>
              </div>
            </div>
          `
        )}
      </div>`;
    }

    const tiles: StatTile[] = [
      {
        icon: "mdi:alert",
        value: q.overdue_count,
        label: "overdue",
        rgb: "var(--rgb-state-overdue)",
      },
      {
        icon: "mdi:calendar-today",
        value: q.due_today_count,
        label: "due today",
        rgb: "var(--rgb-state-due-today)",
      },
      {
        icon: "mdi:tray-full",
        value: q.blocked_count,
        label: "blocked",
        rgb: "var(--rgb-state-blocked)",
      },
      {
        icon: "mdi:check-circle-outline",
        value: q.total_actionable,
        label: "ready",
        rgb: "var(--rgb-primary-color)",
      },
    ];

    return html`
      <div class="stats-grid">
        ${tiles.map(
          (t) => html`
            <div class="stat-card" style="--rgb-state: ${t.rgb}">
              <div class="mush-state-item">
                <div class="mush-shape-icon">
                  <ha-icon icon=${t.icon}></ha-icon>
                </div>
                <div class="mush-state-info">
                  <div class="mush-state-info__primary">${t.value}</div>
                  <div class="mush-state-info__secondary">${t.label}</div>
                </div>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  getCardSize() {
    return 2;
  }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "yahatl-stats-card",
  name: "Yahatl Stats",
  description: "Mushroom-style stat tiles: overdue, today, blocked, ready",
});
