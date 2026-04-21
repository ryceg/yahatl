/**
 * YAHATL Queue Card
 * Interactive prioritized task queue with context controls and quick capture.
 *
 * Config:
 *   entity: sensor.yahatl_<list>_queue  (queue sensor)
 *   todo_entity: todo.yahatl_<list>     (todo entity for service calls)
 *   title: "Up Next"                    (optional header)
 *   max_items: 10                       (optional limit)
 */
class YahtlQueueCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    if (!config.entity) throw new Error("You need to define an entity");
    this.config = config;
  }

  _render() {
    if (!this._hass) return;

    const entityId = this.config.entity;
    const todoEntity = this.config.todo_entity || '';
    const state = this._hass.states[entityId];

    if (!state) {
      this.innerHTML = `<ha-card header="Queue"><div class="card-content">Entity not found: ${entityId}</div></ha-card>`;
      return;
    }

    const queue = state.attributes.queue || [];
    const maxItems = this.config.max_items || 10;
    const shown = queue.slice(0, maxItems);
    const title = this.config.title || 'Up Next';

    this.innerHTML = `
      <ha-card>
        <style>
          .queue-header {
            padding: 16px 16px 8px;
            font-size: 1.2em;
            font-weight: 500;
          }
          .queue-controls {
            display: flex;
            gap: 8px;
            padding: 0 16px 8px;
            flex-wrap: wrap;
          }
          .queue-controls select, .queue-controls input {
            padding: 6px 8px;
            border: 1px solid var(--divider-color, #e0e0e0);
            border-radius: 4px;
            background: var(--card-background-color, var(--ha-card-background, white));
            color: var(--primary-text-color);
            font-size: 0.85em;
          }
          .queue-controls select { min-width: 100px; }
          .capture-row {
            display: flex;
            gap: 8px;
            padding: 0 16px 12px;
          }
          .capture-row input {
            flex: 1;
            padding: 8px;
            border: 1px solid var(--divider-color, #e0e0e0);
            border-radius: 4px;
            background: var(--card-background-color, var(--ha-card-background, white));
            color: var(--primary-text-color);
            font-size: 0.9em;
          }
          .capture-row button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: var(--primary-color);
            color: var(--text-primary-color, white);
            cursor: pointer;
            font-size: 0.9em;
          }
          .queue-item {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            border-bottom: 1px solid var(--divider-color, #e0e0e0);
            cursor: pointer;
          }
          .queue-item:hover {
            background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.05);
          }
          .queue-item:last-child { border-bottom: none; }
          .queue-rank {
            min-width: 28px;
            font-weight: bold;
            color: var(--primary-color);
            font-size: 1.1em;
          }
          .queue-info { flex: 1; }
          .queue-title { font-weight: 500; }
          .queue-meta {
            font-size: 0.85em;
            color: var(--secondary-text-color);
          }
          .queue-actions {
            display: flex;
            gap: 4px;
          }
          .queue-btn {
            padding: 4px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            background: var(--primary-color);
            color: var(--text-primary-color, white);
          }
          .queue-btn.secondary {
            background: var(--secondary-background-color, #f5f5f5);
            color: var(--primary-text-color);
          }
          .queue-empty {
            padding: 16px;
            color: var(--secondary-text-color);
            text-align: center;
          }
        </style>

        <div class="queue-header">${this._escapeHtml(title)}</div>

        <div class="queue-controls">
          <select id="queue-location" title="Location">
            <option value="">Location...</option>
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="gym">Gym</option>
            <option value="out">Out</option>
          </select>
          <select id="queue-context" title="Context">
            <option value="">Context...</option>
            <option value="focused_work">Focused Work</option>
            <option value="calls_ok">Calls OK</option>
            <option value="errands">Errands</option>
            <option value="exercise">Exercise</option>
            <option value="relaxation">Relaxation</option>
          </select>
        </div>

        <div class="capture-row">
          <input type="text" id="queue-capture" placeholder="Quick add a task..." />
          <button id="queue-capture-btn">Add</button>
        </div>

        ${shown.length === 0
          ? '<div class="queue-empty">Nothing in the queue!</div>'
          : shown.map((entry, i) => {
              const item = entry.item || entry;
              const uid = item.uid || '';
              const itemTitle = item.title || 'Untitled';
              const due = item.due ? new Date(item.due).toLocaleDateString() : '';
              const score = entry.score != null ? `${entry.score}pts` : '';
              return `
                <div class="queue-item" data-uid="${uid}" data-action="edit">
                  <span class="queue-rank">${i + 1}</span>
                  <div class="queue-info">
                    <div class="queue-title">${this._escapeHtml(itemTitle)}</div>
                    ${due || score ? `<div class="queue-meta">${[due ? `Due: ${due}` : '', score].filter(Boolean).join(' · ')}</div>` : ''}
                  </div>
                  <div class="queue-actions">
                    <button class="queue-btn" data-uid="${uid}" data-action="complete">Done</button>
                  </div>
                </div>
              `;
            }).join('')
        }
      </ha-card>
    `;

    this._attachListeners();
  }

  _attachListeners() {
    const todoEntity = this.config.todo_entity || '';

    // Queue item click → open editor
    this.querySelectorAll('.queue-item').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.queue-btn')) return; // Don't trigger on button clicks
        const uid = row.dataset.uid;
        if (uid && todoEntity) {
          this.dispatchEvent(new CustomEvent('yahatl-open-editor', {
            detail: { entityId: todoEntity, itemId: uid, hass: this._hass },
            bubbles: true,
            composed: true,
          }));
        }
      });
    });

    // Complete buttons
    this.querySelectorAll('.queue-btn[data-action="complete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        if (uid && todoEntity) {
          this._hass.callService('yahatl', 'complete_item', {
            entity_id: todoEntity,
            item_id: uid,
          });
        }
      });
    });

    // Context controls
    const locationSelect = this.querySelector('#queue-location');
    const contextSelect = this.querySelector('#queue-context');
    if (locationSelect) {
      locationSelect.addEventListener('change', () => this._updateContext());
    }
    if (contextSelect) {
      contextSelect.addEventListener('change', () => this._updateContext());
    }

    // Quick capture
    const captureInput = this.querySelector('#queue-capture');
    const captureBtn = this.querySelector('#queue-capture-btn');
    if (captureInput && captureBtn) {
      captureBtn.addEventListener('click', () => this._quickCapture(captureInput));
      captureInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._quickCapture(captureInput);
      });
    }
  }

  _updateContext() {
    const location = this.querySelector('#queue-location')?.value;
    const context = this.querySelector('#queue-context')?.value;
    const data = {};
    if (location) data.location = location;
    if (context) data.contexts = [context];
    if (Object.keys(data).length > 0) {
      this._hass.callService('yahatl', 'update_context', data);
    }
  }

  _quickCapture(input) {
    const title = input.value.trim();
    const todoEntity = this.config.todo_entity;
    if (!title || !todoEntity) return;
    this._hass.callService('yahatl', 'add_item', {
      entity_id: todoEntity,
      title: title,
    });
    input.value = '';
  }

  _escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("yahatl-queue-card", YahtlQueueCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-queue-card",
  name: "Yahatl Queue Card",
  description: "Interactive prioritized task queue with context controls",
});
