import { css } from "lit";

// Trait → MDI icon mapping (used by components)
export const TRAIT_ICONS: Record<string, string> = {
  actionable: "mdi:play",
  recurring: "mdi:refresh",
  habit: "mdi:star-four-points",
  chore: "mdi:home",
  reminder: "mdi:bell",
  note: "mdi:note-text",
  someday: "mdi:clock-outline",
  shopping: "mdi:cart",
  gift: "mdi:gift",
};

// Trait → RGB token name mapping
export const TRAIT_RGB: Record<string, string> = {
  actionable: "var(--rgb-blue, 33, 150, 243)",
  recurring: "var(--rgb-deep-purple, 110, 65, 171)",
  habit: "var(--rgb-green, 76, 175, 80)",
  chore: "var(--rgb-orange, 255, 152, 0)",
  reminder: "var(--rgb-pink, 233, 30, 99)",
  note: "var(--rgb-purple, 146, 107, 199)",
  someday: "var(--rgb-blue-grey, 96, 125, 139)",
  shopping: "var(--rgb-teal, 0, 150, 136)",
  gift: "var(--rgb-amber, 255, 179, 0)",
};

// Priority → RGB token
export const PRIORITY_RGB: Record<string, string> = {
  high: "var(--rgb-red, 244, 67, 54)",
  medium: "var(--rgb-orange, 255, 152, 0)",
  low: "var(--rgb-green, 76, 175, 80)",
};

/** Return the first recognized trait from an item's trait list */
export function primaryTrait(traits: string[]): string | null {
  for (const t of traits) {
    if (t in TRAIT_ICONS) return t;
  }
  return null;
}

export const sharedStyles = css`
  :host {
    /* Mushroom RGB palette fallbacks — HA themes provide these;
       we define fallbacks so cards render correctly outside a theme. */
    --rgb-blue: 33, 150, 243;
    --rgb-green: 76, 175, 80;
    --rgb-orange: 255, 152, 0;
    --rgb-red: 244, 67, 54;
    --rgb-pink: 233, 30, 99;
    --rgb-purple: 146, 107, 199;
    --rgb-deep-purple: 110, 65, 171;
    --rgb-grey: 158, 158, 158;
    --rgb-blue-grey: 96, 125, 139;
    --rgb-disabled: 189, 189, 189;

    /* HA host theme tokens — these are inherited from HA's :root.
       We only define yahatl-scoped fallbacks to avoid circular self-refs.
       Components use the HA vars directly with inline fallbacks. */
    --rgb-primary-text-color: 33, 33, 33;
    --yahatl-card-bg: var(--ha-card-background, var(--card-background-color, white));
    --yahatl-border-radius: var(--ha-card-border-radius, 12px);
    --yahatl-border-width: var(--ha-card-border-width, 1px);
    --yahatl-border-color: var(--ha-card-border-color, rgba(0, 0, 0, 0.06));
    --yahatl-divider: var(--divider-color, rgba(0, 0, 0, 0.08));
    --yahatl-text: var(--primary-text-color, rgb(33, 33, 33));
    --yahatl-text-secondary: var(--secondary-text-color, rgb(114, 114, 114));
    --rgb-primary-color: var(--rgb-primary-color, 3, 169, 244);
    --rgb-accent-color: var(--rgb-accent-color, 255, 152, 0);
    color: var(--yahatl-text);

    /* Semantic action colors */
    --rgb-info: var(--rgb-blue);
    --rgb-success: var(--rgb-green);
    --rgb-warning: var(--rgb-orange);
    --rgb-danger: var(--rgb-red);

    /* Yahatl trait colors */
    --rgb-trait-actionable: var(--rgb-blue);
    --rgb-trait-recurring: var(--rgb-deep-purple);
    --rgb-trait-habit: var(--rgb-green);
    --rgb-trait-chore: var(--rgb-orange);
    --rgb-trait-reminder: var(--rgb-pink);
    --rgb-trait-note: var(--rgb-purple);

    /* Yahatl state colors */
    --rgb-state-overdue: var(--rgb-danger);
    --rgb-state-due-today: var(--rgb-warning);
    --rgb-state-blocked: var(--rgb-grey);
    --rgb-state-deferred: var(--rgb-blue-grey);
    --rgb-state-streak: var(--rgb-orange);
    --rgb-state-at-risk: var(--rgb-danger);
    --rgb-state-completed: var(--rgb-success);

    /* Priority-rail colors */
    --rgb-priority-high: var(--rgb-danger);
    --rgb-priority-medium: var(--rgb-warning);
    --rgb-priority-low: var(--rgb-success);

    /* Mushroom spacing / sizing tokens */
    --spacing: var(--mush-spacing, 10px);
    --icon-size: var(--mush-icon-size, 36px);
    --icon-border-radius: var(--mush-icon-border-radius, 50%);
    --badge-size: var(--mush-badge-size, 16px);
    --chip-spacing: var(--mush-chip-spacing, 8px);
    --chip-height: var(--mush-chip-height, 36px);
    --chip-border-radius: var(--mush-chip-border-radius, 19px);
    --control-border-radius: var(--mush-control-border-radius, 12px);
    --control-height: var(--mush-control-height, 42px);

    font-family: var(--paper-font-body1_-_font-family, Roboto, "Helvetica Neue", Arial, sans-serif);
    color: var(--yahatl-text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Card surface ── */
  ha-card {
    background: var(--yahatl-card-bg);
    border-radius: var(--yahatl-border-radius);
    overflow: hidden;
  }

  .card-header {
    padding: 16px 16px 6px;
    font-size: 20px;
    font-weight: 500;
    letter-spacing: 0.15px;
    color: var(--yahatl-text);
  }

  /* ── Shape icon (Mushroom circle badge) ── */
  .mush-shape-icon {
    width: var(--icon-size);
    height: var(--icon-size);
    border-radius: var(--icon-border-radius);
    background: rgba(var(--rgb-state, var(--rgb-primary-color)), 0.20);
    color: rgb(var(--rgb-state, var(--rgb-primary-color)));
    display: grid;
    place-items: center;
    font-size: 18px;
    line-height: 1;
    flex: none;
    transition: background-color 280ms ease-out;
  }

  .mush-shape-icon ha-icon {
    --mdc-icon-size: 20px;
    color: inherit;
  }

  .mush-shape-icon--sm {
    width: 24px;
    height: 24px;
    font-size: 13px;
  }

  .mush-shape-icon--sm ha-icon {
    --mdc-icon-size: 14px;
  }

  .mush-shape-icon .badge {
    position: absolute;
    top: -3px;
    right: -3px;
    width: var(--badge-size);
    height: var(--badge-size);
    border-radius: 50%;
    background: rgb(var(--rgb-warning));
    border: 2px solid var(--yahatl-card-bg);
  }

  /* ── State info (primary + secondary text) ── */
  .mush-state-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .mush-state-info__primary {
    font-size: 16px;
    font-weight: 500;
    line-height: 22px;
    letter-spacing: 0.1px;
    color: var(--yahatl-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mush-state-info__secondary {
    font-size: 13px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: 0.4px;
    color: var(--yahatl-text);
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── State item row (icon + info) ── */
  .mush-state-item {
    display: flex;
    align-items: center;
    padding: var(--spacing);
    gap: var(--spacing);
  }

  /* ── Mushroom chips ── */
  .mush-chip {
    box-sizing: border-box;
    height: var(--chip-height);
    border-radius: var(--chip-border-radius);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--yahatl-card-bg);
    border: var(--yahatl-border-width) solid var(--yahatl-border-color);
    color: var(--yahatl-text);
    padding: 0 14px;
    cursor: pointer;
    font-weight: 500;
    font-size: 15px;
    letter-spacing: 0.1px;
    line-height: 1;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
  }

  .mush-chip:active {
    opacity: 0.8;
  }

  .mush-chip__icon {
    font-size: 18px;
    line-height: 0;
    color: var(--yahatl-text);
  }

  .mush-chip__icon ha-icon {
    --mdc-icon-size: 18px;
    color: inherit;
  }

  .mush-chip--state .mush-chip__icon {
    color: rgb(var(--rgb-state));
  }

  .mush-chip--filled {
    background: rgba(var(--rgb-state), 0.20);
    border-color: transparent;
    color: rgb(var(--rgb-state));
  }

  .mush-chip--filled .mush-chip__icon {
    color: rgb(var(--rgb-state));
  }

  .mush-chip__count {
    font-size: 11px;
    font-weight: 700;
    background: rgba(var(--rgb-state), 0.20);
    color: rgb(var(--rgb-state));
    padding: 2px 7px;
    border-radius: 10px;
  }

  .chips-strip {
    display: flex;
    gap: var(--chip-spacing);
    flex-wrap: wrap;
    padding: 0 16px 12px;
  }

  /* ── Priority rail ── */
  .priority-rail {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
  }

  .priority-rail--high { background: rgb(var(--rgb-priority-high)); }
  .priority-rail--medium { background: rgb(var(--rgb-priority-medium)); }
  .priority-rail--low { background: rgb(var(--rgb-priority-low)); }

  /* ── Queue score badge ── */
  .queue-score {
    font-size: 11px;
    font-weight: 700;
    background: rgba(var(--rgb-primary-color), 0.10);
    color: rgb(var(--rgb-primary-color));
    padding: 3px 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  /* ── Queue / action button ── */
  .queue-btn {
    border: 0;
    border-radius: 8px;
    padding: 8px 14px;
    background: rgba(var(--rgb-primary-color), 0.20);
    color: rgb(var(--rgb-primary-color));
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    letter-spacing: 0.1px;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 120ms;
  }

  .queue-btn:active {
    opacity: 0.7;
  }

  /* ── Meta text (secondary info line in queue rows) ── */
  .queue-meta {
    font-size: 13px;
    line-height: 18px;
    letter-spacing: 0.4px;
    color: var(--yahatl-text-secondary);
  }

  .queue-meta .sep {
    opacity: 0.4;
    margin: 0 4px;
  }

  .queue-meta .overdue {
    color: rgb(var(--rgb-state-overdue));
    font-weight: 500;
  }

  .queue-meta .due-today {
    color: rgb(var(--rgb-state-due-today));
    font-weight: 500;
  }

  /* ── Check circle (list items) ── */
  .item-check {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--yahatl-divider);
    flex: none;
    cursor: pointer;
    display: grid;
    place-items: center;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 200ms ease, border-color 200ms ease;
  }

  .item-check--done {
    background: rgb(var(--rgb-success));
    border-color: rgb(var(--rgb-success));
  }

  .item-check--done::after {
    content: "\\2713";
    color: white;
    font-size: 11px;
    font-weight: bold;
  }

  /* ── Forms (editor / capture) ── */
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field__label {
    font-size: 13px;
    color: var(--yahatl-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 500;
  }

  .input,
  .textarea,
  .select {
    padding: 11px 13px;
    border: 1px solid var(--yahatl-divider);
    border-radius: 10px;
    font-family: inherit;
    font-size: 16px;
    background: var(--yahatl-card-bg);
    color: var(--yahatl-text);
    width: 100%;
    box-sizing: border-box;
    -webkit-appearance: none;
  }

  .input:focus,
  .textarea:focus,
  .select:focus {
    outline: none;
    border-color: rgb(var(--rgb-primary-color));
  }

  .textarea {
    resize: vertical;
    min-height: 64px;
  }

  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* ── Trait toggle pills (editor) ── */
  .trait-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid var(--yahatl-divider);
    background: var(--yahatl-card-bg);
    font-size: 15px;
    cursor: pointer;
    color: var(--yahatl-text-secondary);
    letter-spacing: 0.1px;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
  }

  .trait-toggle.is-on {
    background: rgba(var(--rgb-state), 0.20);
    color: rgb(var(--rgb-state));
    border-color: transparent;
  }

  .trait-toggle ha-icon {
    --mdc-icon-size: 18px;
    color: inherit;
  }

  /* ── Tag chips ── */
  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(var(--rgb-primary-text-color), 0.05);
    color: var(--yahatl-text);
    font-size: 13px;
    border-radius: 4px;
    letter-spacing: 0.4px;
  }

  .tag-chip__remove {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: 1em;
    color: var(--yahatl-text-secondary);
    opacity: 0.5;
    line-height: 1;
  }

  /* ── Buttons (modal footer etc) ── */
  .btn {
    padding: 10px 20px;
    border: 0;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.1px;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .btn--primary {
    background: rgb(var(--rgb-primary-color));
    color: white;
  }

  .btn--ghost {
    background: rgba(var(--rgb-primary-text-color), 0.05);
    color: var(--yahatl-text);
  }

  .btn--danger {
    background: transparent;
    color: rgb(var(--rgb-danger));
  }

  .btn:active {
    opacity: 0.8;
  }

  /* ── Empty state ── */
  .empty-state {
    padding: 24px 16px;
    text-align: center;
    color: var(--yahatl-text-secondary);
    font-size: 15px;
  }

  /* ── Screen-reader only ── */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
`;
