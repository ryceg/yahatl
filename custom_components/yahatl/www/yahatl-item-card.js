/**
 * YAHATL Item Card
 * Custom Lovelace card for displaying and interacting with YAHATL items
 *
 * Features:
 * - Display item with all traits, tags, and metadata
 * - Quick actions (complete, snooze, edit, delete)
 * - Visual indicators for priority, due date, streaks
 * - Blocker and requirement status
 * - Recurrence information
 */

class YahatLItemCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;

    if (!this.content) {
      this.createCard();
    }

    this.updateCard();
  }

  createCard() {
    const card = document.createElement('ha-card');
    this.content = document.createElement('div');
    this.content.className = 'card-content';

    const style = document.createElement('style');
    style.textContent = `
      ha-card {
        padding: 16px;
        cursor: pointer;
      }

      .card-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .item-title {
        font-size: 1.1em;
        font-weight: 500;
        flex: 1;
      }

      .item-checkbox {
        width: 24px;
        height: 24px;
        cursor: pointer;
      }

      .item-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 0.9em;
        color: var(--secondary-text-color);
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .traits {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .trait-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 500;
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .trait-badge.habit {
        background: #4CAF50;
      }

      .trait-badge.chore {
        background: #FF9800;
      }

      .trait-badge.reminder {
        background: #2196F3;
      }

      .trait-badge.note {
        background: #9C27B0;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .tag {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
      }

      .action-button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .action-button:hover {
        opacity: 0.8;
      }

      .action-button.secondary {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }

      .priority-indicator {
        width: 4px;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        border-radius: 4px 0 0 4px;
      }

      .priority-high {
        background: #f44336;
      }

      .priority-medium {
        background: #ff9800;
      }

      .priority-low {
        background: #4caf50;
      }

      .overdue {
        color: #f44336;
        font-weight: 600;
      }

      .due-today {
        color: #ff9800;
        font-weight: 600;
      }

      .streak-info {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 4px;
        background: rgba(255, 152, 0, 0.1);
      }

      .streak-at-risk {
        background: rgba(244, 67, 54, 0.1);
        color: #f44336;
      }

      .blocked-indicator {
        padding: 4px 8px;
        border-radius: 4px;
        background: rgba(158, 158, 158, 0.2);
        color: var(--secondary-text-color);
        font-size: 0.85em;
      }
    `;

    card.appendChild(style);
    card.appendChild(this.content);
    this.shadowRoot.appendChild(card);
  }

  updateCard() {
    const entity = this._hass.states[this.config.entity];
    if (!entity) {
      this.content.innerHTML = '<div>Entity not found</div>';
      return;
    }

    const item = this.config.item || {};
    const {
      title = entity.attributes.friendly_name,
      status = 'needs_action',
      priority = null,
      due = null,
      time_estimate = null,
      traits = [],
      tags = [],
      streak = null,
      is_blocked = false,
      blocker_reasons = [],
      recurrence = null,
    } = item;

    // Build HTML
    let html = '';

    // Priority indicator
    if (priority) {
      html += `<div class="priority-indicator priority-${priority}"></div>`;
    }

    // Header with checkbox and title
    html += `
      <div class="item-header">
        <input type="checkbox"
               class="item-checkbox"
               ${status === 'completed' ? 'checked' : ''}>
        <div class="item-title">${this.escapeHtml(title)}</div>
      </div>
    `;

    // Meta information
    html += '<div class="item-meta">';

    if (due) {
      const dueDate = new Date(due);
      const now = new Date();
      const isOverdue = dueDate < now;
      const isToday = dueDate.toDateString() === now.toDateString();
      const dueDateStr = dueDate.toLocaleDateString();

      html += `
        <div class="meta-item ${isOverdue ? 'overdue' : isToday ? 'due-today' : ''}">
          <ha-icon icon="mdi:calendar"></ha-icon>
          ${isOverdue ? 'Overdue' : isToday ? 'Today' : dueDateStr}
        </div>
      `;
    }

    if (time_estimate) {
      html += `
        <div class="meta-item">
          <ha-icon icon="mdi:clock-outline"></ha-icon>
          ${time_estimate}m
        </div>
      `;
    }

    if (recurrence) {
      html += `
        <div class="meta-item">
          <ha-icon icon="mdi:refresh"></ha-icon>
          ${this.getRecurrenceLabel(recurrence)}
        </div>
      `;
    }

    html += '</div>';

    // Traits
    if (traits && traits.length > 0) {
      html += '<div class="traits">';
      traits.forEach(trait => {
        html += `<span class="trait-badge ${trait}">${trait}</span>`;
      });
      html += '</div>';
    }

    // Tags
    if (tags && tags.length > 0) {
      html += '<div class="tags">';
      tags.forEach(tag => {
        html += `<span class="tag">#${tag}</span>`;
      });
      html += '</div>';
    }

    // Streak info (for habits)
    if (traits.includes('habit') && streak) {
      const atRisk = streak.at_risk || false;
      html += `
        <div class="streak-info ${atRisk ? 'streak-at-risk' : ''}">
          <ha-icon icon="mdi:fire"></ha-icon>
          ${streak.current || 0} day streak
          ${atRisk ? '(at risk!)' : ''}
        </div>
      `;
    }

    // Blocked indicator
    if (is_blocked && blocker_reasons.length > 0) {
      html += `
        <div class="blocked-indicator">
          <ha-icon icon="mdi:lock"></ha-icon>
          Blocked: ${blocker_reasons.join(', ')}
        </div>
      `;
    }

    // Actions
    if (this.config.show_actions !== false) {
      html += `
        <div class="actions">
          <button class="action-button secondary" data-action="edit">Edit</button>
          <button class="action-button secondary" data-action="snooze">Snooze</button>
          <button class="action-button" data-action="complete">Complete</button>
        </div>
      `;
    }

    this.content.innerHTML = html;

    // Add event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Checkbox click
    const checkbox = this.content.querySelector('.item-checkbox');
    if (checkbox) {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleComplete();
      });
    }

    // Action buttons
    this.content.querySelectorAll('.action-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        this.handleAction(action);
      });
    });

    // Card click (for more details)
    this.shadowRoot.querySelector('ha-card').addEventListener('click', () => {
      this.showMoreInfo();
    });
  }

  toggleComplete() {
    const entity = this.config.entity;
    const item = this.config.item || {};

    this._hass.callService('yahatl', 'complete_item', {
      entity_id: entity,
      item_id: item.uid,
    });
  }

  handleAction(action) {
    const entity = this.config.entity;
    const item = this.config.item || {};

    switch (action) {
      case 'complete':
        this._hass.callService('yahatl', 'complete_item', {
          entity_id: entity,
          item_id: item.uid,
        });
        break;

      case 'edit':
        this.showEditDialog();
        break;

      case 'snooze':
        // Snooze for 1 day
        const newDue = new Date();
        newDue.setDate(newDue.getDate() + 1);
        this._hass.callService('yahatl', 'update_item', {
          entity_id: entity,
          item_id: item.uid,
          due: newDue.toISOString(),
        });
        break;
    }
  }

  showMoreInfo() {
    const entity = this.config.entity;
    const event = new Event('hass-more-info', {
      bubbles: true,
      composed: true,
    });
    event.detail = { entityId: entity };
    this.dispatchEvent(event);
  }

  showEditDialog() {
    // This would open a custom dialog for editing
    // For now, show more info
    this.showMoreInfo();
  }

  getRecurrenceLabel(recurrence) {
    if (!recurrence) return '';

    switch (recurrence.type) {
      case 'calendar':
        return recurrence.pattern || 'Recurring';
      case 'elapsed':
        return `Every ${recurrence.interval_value} ${recurrence.interval_unit}`;
      case 'frequency':
        return `${recurrence.target_count}x per ${recurrence.period}`;
      default:
        return 'Recurring';
    }
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  getCardSize() {
    return 3;
  }
}

customElements.define('yahatl-item-card', YahatLItemCard);

// Register the card with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'yahatl-item-card',
  name: 'YAHATL Item Card',
  description: 'Display and interact with YAHATL todo items',
  preview: true,
});
