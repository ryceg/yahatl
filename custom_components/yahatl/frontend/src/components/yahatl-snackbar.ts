import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

/**
 * Singleton undo snackbar, mounted on document.body (same pattern as the
 * item editor). One at a time: a new show() replaces the current one.
 *
 * Usage: showSnackbar("Completed 'Feed pigs'", { label: "UNDO", run: fn })
 */

interface SnackbarAction {
  label: string;
  // Return value ignored; awaited if it's a promise (e.g. a store mutation
  // returning Promise<boolean>).
  run: () => unknown;
}

const AUTO_HIDE_MS = 6000;

@customElement("yahatl-snackbar")
export class YahtlSnackbar extends LitElement {
  @state() private _message = "";
  @state() private _action: SnackbarAction | null = null;
  @state() private _open = false;
  private _hideTimer: number | null = null;

  static styles = css`
    :host {
      position: fixed;
      left: 0;
      right: 0;
      /* Above HA's mobile bottom tab bar and the iOS home-indicator inset. */
      bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      display: flex;
      justify-content: center;
      pointer-events: none;
      z-index: 999;
      font-family: var(
        --paper-font-body1_-_font-family,
        Roboto,
        "Helvetica Neue",
        Arial,
        sans-serif
      );
    }

    .bar {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: min(480px, calc(100vw - 32px));
      padding: 10px 8px 10px 16px;
      border-radius: 10px;
      background: var(--card-background-color, var(--ha-card-background, #fff));
      color: var(--primary-text-color, #212121);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      font-size: 14px;
      animation: rise 180ms ease-out;
    }

    @keyframes rise {
      from {
        transform: translateY(8px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .bar__msg {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bar__action {
      flex: none;
      border: none;
      background: none;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.6px;
      color: var(--primary-color, #03a9f4);
      -webkit-tap-highlight-color: transparent;
    }

    .bar__action:active {
      opacity: 0.7;
    }

    .bar__action:focus-visible {
      outline: 2px solid var(--primary-color, #03a9f4);
      outline-offset: -2px;
    }
  `;

  show(message: string, action: SnackbarAction | null) {
    this._message = message;
    this._action = action;
    this._open = true;
    if (this._hideTimer !== null) window.clearTimeout(this._hideTimer);
    this._hideTimer = window.setTimeout(() => this._dismiss(), AUTO_HIDE_MS);
  }

  private _dismiss() {
    if (this._hideTimer !== null) window.clearTimeout(this._hideTimer);
    this._hideTimer = null;
    this._open = false;
  }

  private async _runAction() {
    const action = this._action;
    this._dismiss();
    if (action) await action.run();
  }

  render() {
    // The live region stays in the DOM so screen readers announce new
    // messages; only the bar itself comes and goes.
    return html`
      <div role="status" aria-live="polite">
        ${this._open
          ? html`
              <div class="bar">
                <span class="bar__msg">${this._message}</span>
                ${this._action
                  ? html`
                      <button class="bar__action" @click=${this._runAction}>
                        ${this._action.label}
                      </button>
                    `
                  : nothing}
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

let snackbarEl: YahtlSnackbar | null = null;

/** Show the shared snackbar (bottom of screen, ~6s, one at a time). */
export function showSnackbar(
  message: string,
  action: SnackbarAction | null = null
): void {
  if (!snackbarEl || !snackbarEl.isConnected) {
    snackbarEl = document.createElement("yahatl-snackbar") as YahtlSnackbar;
    document.body.appendChild(snackbarEl);
  }
  snackbarEl.show(message, action);
}
