/**
 * YAHATL Item Editor
 * Modal dialog web component for editing all item properties.
 *
 * Singleton: one instance is attached to document.body.
 * Opens in response to 'yahatl-open-editor' custom events dispatched
 * by item cards and queue cards.
 */

class YahatLItemEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._entityId = null;
    this._itemId = null;
    this._item = null;
    this._allItems = [];
    this._activeTab = 0;
    this._tags = [];
    this._timeBlockers = [];
    this._conditionTriggers = [];
    this._visible = false;
    this._boundKeyHandler = this._handleKeydown.bind(this);
  }

  // --- Public API ---

  async open(detail) {
    this._entityId = detail.entityId;
    this._itemId = detail.itemId;
    if (detail.hass) this._hass = detail.hass;

    const hass = this._getHass();
    if (!hass) {
      console.error('yahatl-item-editor: cannot find hass object');
      return;
    }

    try {
      const [item, allItems] = await Promise.all([
        hass.callWS({ type: 'yahatl/item_details', entity_id: this._entityId, item_id: this._itemId }),
        hass.callWS({ type: 'yahatl/items_list', entity_id: this._entityId }),
      ]);
      this._item = item;
      this._allItems = allItems.filter(i => i.uid !== this._itemId);
      this._tags = (item.tags || []).slice();
      this._timeBlockers = (item.time_blockers || []).map(tb => ({ ...tb, days: tb.days ? tb.days.slice() : null }));
      this._conditionTriggers = (item.condition_triggers || []).map(ct => ({ ...ct }));
      this._activeTab = 0;
      this._visible = true;
      this._render();
      document.addEventListener('keydown', this._boundKeyHandler);
    } catch (err) {
      console.error('yahatl-item-editor: failed to load item', err);
    }
  }

  close() {
    this._visible = false;
    this._render();
    document.removeEventListener('keydown', this._boundKeyHandler);
  }

  // --- Hass resolution ---

  _getHass() {
    const ha = document.querySelector('home-assistant');
    return ha?.hass || this._hass;
  }

  // --- Event handlers ---

  _handleKeydown(e) {
    if (e.key === 'Escape') this.close();
  }

  // --- Rendering ---

  _render() {
    if (!this._visible) {
      this.shadowRoot.innerHTML = '';
      return;
    }

    const item = this._item;
    const tab = this._activeTab;
    const tabNames = ['Basics', 'Traits & Tags', 'Recurrence', 'Blockers', 'Requirements', 'Schedule'];

    this.shadowRoot.innerHTML = `
      <style>${this._getStyles()}</style>
      <div class="overlay">
        <div class="dialog">
          <div class="dialog-header">
            <h2>Edit Item</h2>
            <button class="close-btn" data-action="close">&times;</button>
          </div>
          <div class="tabs">
            ${tabNames.map((name, i) => `
              <button class="tab ${i === tab ? 'active' : ''}" data-tab="${i}">${name}</button>
            `).join('')}
          </div>
          <div class="tab-content">
            ${this._renderTab(tab, item)}
          </div>
          <div class="error-msg" style="display:none;"></div>
          <div class="dialog-footer">
            <button class="btn btn-cancel" data-action="close">Cancel</button>
            <button class="btn btn-save" data-action="save">Save</button>
          </div>
        </div>
      </div>
    `;

    this._attachListeners();
  }

  _renderTab(tab, item) {
    switch (tab) {
      case 0: return this._renderBasics(item);
      case 1: return this._renderTraitsTags(item);
      case 2: return this._renderRecurrence(item);
      case 3: return this._renderBlockers(item);
      case 4: return this._renderRequirements(item);
      case 5: return this._renderSchedule(item);
      default: return '';
    }
  }

  // --- Tab 1: Basics ---

  _renderBasics(item) {
    const due = item.due ? this._toLocalDatetime(item.due) : '';
    return `
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="ed-title" value="${this._esc(item.title || '')}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="ed-description" rows="3">${this._esc(item.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select id="ed-priority">
          <option value=""${!item.priority ? ' selected' : ''}>(none)</option>
          <option value="low"${item.priority === 'low' ? ' selected' : ''}>low</option>
          <option value="medium"${item.priority === 'medium' ? ' selected' : ''}>medium</option>
          <option value="high"${item.priority === 'high' ? ' selected' : ''}>high</option>
        </select>
      </div>
      <div class="form-group">
        <label>Due</label>
        <input type="datetime-local" id="ed-due" value="${due}">
      </div>
      <div class="form-group">
        <label>Time estimate (minutes)</label>
        <input type="number" id="ed-time-estimate" min="1" max="480" value="${item.time_estimate || ''}">
      </div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="ed-needs-detail" ${item.needs_detail ? 'checked' : ''}>
          Needs more detail
        </label>
      </div>
    `;
  }

  // --- Tab 2: Traits & Tags ---

  _renderTraitsTags(item) {
    const traits = item.traits || [];
    const allTraits = ['actionable', 'recurring', 'habit', 'chore', 'reminder', 'note'];
    return `
      <fieldset>
        <legend>Traits</legend>
        <div class="checkbox-grid">
          ${allTraits.map(t => `
            <label class="checkbox-label">
              <input type="checkbox" class="trait-cb" value="${t}" ${traits.includes(t) ? 'checked' : ''}>
              ${t}
            </label>
          `).join('')}
        </div>
      </fieldset>
      <fieldset>
        <legend>Tags</legend>
        <div class="tag-input-row">
          <input type="text" id="ed-tag-input" placeholder="Add tag...">
          <button class="btn btn-small" data-action="add-tag">Add</button>
        </div>
        <div class="chips">
          ${this._tags.map((tag, i) => `
            <span class="chip">${this._esc(tag)} <button class="chip-remove" data-tag-index="${i}">&times;</button></span>
          `).join('')}
        </div>
      </fieldset>
    `;
  }

  // --- Tab 3: Recurrence ---

  _renderRecurrence(item) {
    const rec = item.recurrence || {};
    const type = rec.type || 'none';
    return `
      <div class="form-group">
        <label>Recurrence type</label>
        <select id="ed-rec-type">
          <option value="none"${type === 'none' || !rec.type ? ' selected' : ''}>none</option>
          <option value="calendar"${type === 'calendar' ? ' selected' : ''}>calendar</option>
          <option value="elapsed"${type === 'elapsed' ? ' selected' : ''}>elapsed</option>
          <option value="frequency"${type === 'frequency' ? ' selected' : ''}>frequency</option>
        </select>
      </div>
      <div id="rec-calendar" class="rec-section" style="display:${type === 'calendar' ? 'block' : 'none'}">
        <div class="form-group">
          <label>Pattern (e.g. "daily", "weekly")</label>
          <input type="text" id="ed-rec-pattern" value="${this._esc(rec.calendar_pattern || '')}">
        </div>
      </div>
      <div id="rec-elapsed" class="rec-section" style="display:${type === 'elapsed' ? 'block' : 'none'}">
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label>Interval</label>
            <input type="number" id="ed-rec-interval" min="1" value="${rec.elapsed_interval || ''}">
          </div>
          <div class="form-group" style="flex:1">
            <label>Unit</label>
            <select id="ed-rec-elapsed-unit">
              <option value="days"${rec.elapsed_unit === 'days' ? ' selected' : ''}>days</option>
              <option value="weeks"${rec.elapsed_unit === 'weeks' ? ' selected' : ''}>weeks</option>
              <option value="months"${rec.elapsed_unit === 'months' ? ' selected' : ''}>months</option>
              <option value="years"${rec.elapsed_unit === 'years' ? ' selected' : ''}>years</option>
            </select>
          </div>
        </div>
      </div>
      <div id="rec-frequency" class="rec-section" style="display:${type === 'frequency' ? 'block' : 'none'}">
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label>Count</label>
            <input type="number" id="ed-rec-count" min="1" value="${rec.frequency_count || ''}">
          </div>
          <div class="form-group" style="flex:1">
            <label>Period</label>
            <input type="number" id="ed-rec-period" min="1" value="${rec.frequency_period || ''}">
          </div>
          <div class="form-group" style="flex:1">
            <label>Unit</label>
            <select id="ed-rec-freq-unit">
              <option value="days"${rec.frequency_unit === 'days' ? ' selected' : ''}>days</option>
              <option value="weeks"${rec.frequency_unit === 'weeks' ? ' selected' : ''}>weeks</option>
              <option value="months"${rec.frequency_unit === 'months' ? ' selected' : ''}>months</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  // --- Tab 4: Blockers ---

  _renderBlockers(item) {
    const b = item.blockers || {};
    const mode = b.mode || 'ALL';
    const itemMode = b.item_mode || 'ANY';
    const sensorMode = b.sensor_mode || 'ANY';
    const selectedItems = b.items || [];
    const sensors = (b.sensors || []).join(', ');

    return `
      <div class="form-group">
        <label>Overall mode</label>
        <select id="ed-blocker-mode">
          <option value="ANY"${mode === 'ANY' ? ' selected' : ''}>ANY</option>
          <option value="ALL"${mode === 'ALL' ? ' selected' : ''}>ALL</option>
        </select>
      </div>
      <fieldset>
        <legend>Item Blockers</legend>
        <div class="form-group">
          <label>Item mode</label>
          <select id="ed-blocker-item-mode">
            <option value="ANY"${itemMode === 'ANY' ? ' selected' : ''}>ANY</option>
            <option value="ALL"${itemMode === 'ALL' ? ' selected' : ''}>ALL</option>
          </select>
        </div>
        <div class="checkbox-list">
          ${this._allItems.map(i => `
            <label class="checkbox-label">
              <input type="checkbox" class="blocker-item-cb" value="${this._esc(i.uid)}" ${selectedItems.includes(i.uid) ? 'checked' : ''}>
              ${this._esc(i.title)} <span class="status-hint">(${i.status})</span>
            </label>
          `).join('') || '<p class="muted">No other items in this list.</p>'}
        </div>
      </fieldset>
      <fieldset>
        <legend>Sensor Blockers</legend>
        <div class="form-group">
          <label>Sensor mode</label>
          <select id="ed-blocker-sensor-mode">
            <option value="ANY"${sensorMode === 'ANY' ? ' selected' : ''}>ANY</option>
            <option value="ALL"${sensorMode === 'ALL' ? ' selected' : ''}>ALL</option>
          </select>
        </div>
        <div class="form-group">
          <label>Entity IDs (comma-separated)</label>
          <input type="text" id="ed-blocker-sensors" value="${this._esc(sensors)}">
        </div>
      </fieldset>
    `;
  }

  // --- Tab 5: Requirements ---

  _renderRequirements(item) {
    const r = item.requirements || {};
    const mode = r.mode || 'ANY';
    const timeOptions = ['business_hours', 'weekend', 'evening', 'morning', 'night'];
    const tc = r.time_constraints || [];

    return `
      <div class="form-group">
        <label>Mode</label>
        <select id="ed-req-mode">
          <option value="ANY"${mode === 'ANY' ? ' selected' : ''}>ANY</option>
          <option value="ALL"${mode === 'ALL' ? ' selected' : ''}>ALL</option>
        </select>
      </div>
      <div class="form-group">
        <label>Location (comma-separated)</label>
        <input type="text" id="ed-req-location" value="${this._esc((r.location || []).join(', '))}">
      </div>
      <div class="form-group">
        <label>People (comma-separated)</label>
        <input type="text" id="ed-req-people" value="${this._esc((r.people || []).join(', '))}">
      </div>
      <fieldset>
        <legend>Time constraints</legend>
        <div class="checkbox-grid">
          ${timeOptions.map(t => `
            <label class="checkbox-label">
              <input type="checkbox" class="req-time-cb" value="${t}" ${tc.includes(t) ? 'checked' : ''}>
              ${t.replace('_', ' ')}
            </label>
          `).join('')}
        </div>
      </fieldset>
      <div class="form-group">
        <label>Context (comma-separated)</label>
        <input type="text" id="ed-req-context" value="${this._esc((r.context || []).join(', '))}">
      </div>
      <div class="form-group">
        <label>Sensors (comma-separated entity IDs)</label>
        <input type="text" id="ed-req-sensors" value="${this._esc((r.sensors || []).join(', '))}">
      </div>
    `;
  }

  // --- Tab 6: Schedule ---

  _renderSchedule(item) {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const deferred = item.deferred_until ? this._toLocalDatetime(item.deferred_until) : '';

    return `
      <fieldset>
        <legend>Time Blockers</legend>
        <div id="time-blockers-list">
          ${this._timeBlockers.map((tb, i) => `
            <div class="dynamic-row" data-tb-index="${i}">
              <div class="form-row">
                <div class="form-group" style="flex:1">
                  <label>Start</label>
                  <input type="time" class="tb-start" value="${tb.start_time || ''}">
                </div>
                <div class="form-group" style="flex:1">
                  <label>End</label>
                  <input type="time" class="tb-end" value="${tb.end_time || ''}">
                </div>
                <div class="form-group" style="flex:1">
                  <label>Mode</label>
                  <select class="tb-mode">
                    <option value="suppress"${tb.mode === 'suppress' ? ' selected' : ''}>suppress</option>
                    <option value="allow"${tb.mode === 'allow' ? ' selected' : ''}>allow</option>
                  </select>
                </div>
              </div>
              <div class="day-checkboxes">
                ${dayLabels.map((d, di) => `
                  <label class="checkbox-label-sm">
                    <input type="checkbox" class="tb-day" data-day="${di}" ${(!tb.days || tb.days.includes(di)) ? 'checked' : ''}>
                    ${d}
                  </label>
                `).join('')}
              </div>
              <button class="btn btn-small btn-danger" data-action="remove-tb" data-index="${i}">Remove</button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-small" data-action="add-tb">+ Add Time Blocker</button>
      </fieldset>
      <fieldset>
        <legend>Condition Triggers</legend>
        <div id="condition-triggers-list">
          ${this._conditionTriggers.map((ct, i) => `
            <div class="dynamic-row" data-ct-index="${i}">
              <div class="form-row">
                <div class="form-group" style="flex:2">
                  <label>Entity ID</label>
                  <input type="text" class="ct-entity" value="${this._esc(ct.entity_id || '')}">
                </div>
                <div class="form-group" style="flex:1">
                  <label>Operator</label>
                  <select class="ct-operator">
                    ${['eq','neq','gt','lt','gte','lte','bool'].map(op =>
                      `<option value="${op}"${ct.operator === op ? ' selected' : ''}>${op}</option>`
                    ).join('')}
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="flex:1">
                  <label>Value</label>
                  <input type="text" class="ct-value" value="${this._esc(ct.value || '')}">
                </div>
                <div class="form-group" style="flex:1">
                  <label>Attribute (optional)</label>
                  <input type="text" class="ct-attribute" value="${this._esc(ct.attribute || '')}">
                </div>
                <div class="form-group" style="flex:1">
                  <label>On match</label>
                  <select class="ct-on-match">
                    <option value="boost"${ct.on_match === 'boost' ? ' selected' : ''}>boost</option>
                    <option value="set_due"${ct.on_match === 'set_due' ? ' selected' : ''}>set_due</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-small btn-danger" data-action="remove-ct" data-index="${i}">Remove</button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-small" data-action="add-ct">+ Add Condition Trigger</button>
      </fieldset>
      <fieldset>
        <legend>Defer Until</legend>
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <input type="datetime-local" id="ed-deferred" value="${deferred}">
          </div>
          <button class="btn btn-small" data-action="clear-deferred">Clear</button>
        </div>
      </fieldset>
    `;
  }

  // --- Listeners ---

  _attachListeners() {
    const root = this.shadowRoot;

    // Overlay click to close
    root.querySelector('.overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('overlay')) this.close();
    });

    // Tab switching
    root.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._syncCurrentTab();
        this._activeTab = parseInt(btn.dataset.tab, 10);
        this._render();
      });
    });

    // Close / Save buttons
    root.querySelectorAll('[data-action="close"]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
    const saveBtn = root.querySelector('[data-action="save"]');
    if (saveBtn) saveBtn.addEventListener('click', () => this._save());

    // Tag add
    const addTagBtn = root.querySelector('[data-action="add-tag"]');
    if (addTagBtn) {
      addTagBtn.addEventListener('click', () => {
        const input = root.querySelector('#ed-tag-input');
        const val = input.value.trim();
        if (val && !this._tags.includes(val)) {
          this._tags.push(val);
          this._item.tags = this._tags.slice();
          this._syncCurrentTab();
          this._render();
        }
      });
    }

    // Tag remove
    root.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.tagIndex, 10);
        this._tags.splice(idx, 1);
        this._item.tags = this._tags.slice();
        this._syncCurrentTab();
        this._render();
      });
    });

    // Recurrence type toggle
    const recType = root.querySelector('#ed-rec-type');
    if (recType) {
      recType.addEventListener('change', () => {
        const val = recType.value;
        root.querySelectorAll('.rec-section').forEach(s => s.style.display = 'none');
        if (val !== 'none') {
          const section = root.querySelector(`#rec-${val}`);
          if (section) section.style.display = 'block';
        }
      });
    }

    // Time blocker add/remove
    const addTbBtn = root.querySelector('[data-action="add-tb"]');
    if (addTbBtn) {
      addTbBtn.addEventListener('click', () => {
        this._syncCurrentTab();
        this._timeBlockers.push({ start_time: '09:00', end_time: '17:00', mode: 'suppress', days: null });
        this._render();
      });
    }
    root.querySelectorAll('[data-action="remove-tb"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._syncCurrentTab();
        this._timeBlockers.splice(parseInt(btn.dataset.index, 10), 1);
        this._render();
      });
    });

    // Condition trigger add/remove
    const addCtBtn = root.querySelector('[data-action="add-ct"]');
    if (addCtBtn) {
      addCtBtn.addEventListener('click', () => {
        this._syncCurrentTab();
        this._conditionTriggers.push({ entity_id: '', operator: 'eq', value: '', attribute: null, on_match: 'boost' });
        this._render();
      });
    }
    root.querySelectorAll('[data-action="remove-ct"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._syncCurrentTab();
        this._conditionTriggers.splice(parseInt(btn.dataset.index, 10), 1);
        this._render();
      });
    });

    // Clear deferred
    const clearDefBtn = root.querySelector('[data-action="clear-deferred"]');
    if (clearDefBtn) {
      clearDefBtn.addEventListener('click', () => {
        const input = root.querySelector('#ed-deferred');
        if (input) input.value = '';
      });
    }
  }

  /**
   * Sync form values from the currently displayed tab back into this._item
   * so they survive tab switches.
   */
  _syncCurrentTab() {
    const root = this.shadowRoot;
    const tab = this._activeTab;

    switch (tab) {
      case 0: {
        const title = root.querySelector('#ed-title');
        if (title) this._item.title = title.value;
        const desc = root.querySelector('#ed-description');
        if (desc) this._item.description = desc.value;
        const pri = root.querySelector('#ed-priority');
        if (pri) this._item.priority = pri.value || null;
        const due = root.querySelector('#ed-due');
        if (due) this._item.due = due.value ? new Date(due.value).toISOString() : null;
        const te = root.querySelector('#ed-time-estimate');
        if (te) this._item.time_estimate = te.value ? parseInt(te.value, 10) : null;
        const nd = root.querySelector('#ed-needs-detail');
        if (nd) this._item.needs_detail = nd.checked;
        break;
      }
      case 1: {
        const cbs = root.querySelectorAll('.trait-cb');
        if (cbs.length) {
          this._item.traits = Array.from(cbs).filter(c => c.checked).map(c => c.value);
        }
        // tags are managed via _tags array already
        break;
      }
      case 2: {
        const recType = root.querySelector('#ed-rec-type');
        if (!recType) break;
        const type = recType.value;
        if (type === 'none') {
          this._item.recurrence = null;
        } else {
          const rec = this._item.recurrence || {};
          rec.type = type;
          if (type === 'calendar') {
            const p = root.querySelector('#ed-rec-pattern');
            if (p) rec.calendar_pattern = p.value || null;
          } else if (type === 'elapsed') {
            const iv = root.querySelector('#ed-rec-interval');
            if (iv) rec.elapsed_interval = iv.value ? parseInt(iv.value, 10) : null;
            const iu = root.querySelector('#ed-rec-elapsed-unit');
            if (iu) rec.elapsed_unit = iu.value;
          } else if (type === 'frequency') {
            const fc = root.querySelector('#ed-rec-count');
            if (fc) rec.frequency_count = fc.value ? parseInt(fc.value, 10) : null;
            const fp = root.querySelector('#ed-rec-period');
            if (fp) rec.frequency_period = fp.value ? parseInt(fp.value, 10) : null;
            const fu = root.querySelector('#ed-rec-freq-unit');
            if (fu) rec.frequency_unit = fu.value;
          }
          this._item.recurrence = rec;
        }
        break;
      }
      case 3: {
        const mode = root.querySelector('#ed-blocker-mode');
        const itemMode = root.querySelector('#ed-blocker-item-mode');
        const sensorMode = root.querySelector('#ed-blocker-sensor-mode');
        const sensors = root.querySelector('#ed-blocker-sensors');
        const itemCbs = root.querySelectorAll('.blocker-item-cb');
        const items = Array.from(itemCbs).filter(c => c.checked).map(c => c.value);
        const sensorList = sensors ? this._splitComma(sensors.value) : [];

        if (items.length === 0 && sensorList.length === 0) {
          this._item.blockers = null;
        } else {
          this._item.blockers = {
            mode: mode ? mode.value : 'ALL',
            items: items,
            item_mode: itemMode ? itemMode.value : 'ANY',
            sensors: sensorList,
            sensor_mode: sensorMode ? sensorMode.value : 'ANY',
          };
        }
        break;
      }
      case 4: {
        const reqMode = root.querySelector('#ed-req-mode');
        const location = root.querySelector('#ed-req-location');
        const people = root.querySelector('#ed-req-people');
        const context = root.querySelector('#ed-req-context');
        const reqSensors = root.querySelector('#ed-req-sensors');
        const timeCbs = root.querySelectorAll('.req-time-cb');
        const tc = Array.from(timeCbs).filter(c => c.checked).map(c => c.value);
        const loc = location ? this._splitComma(location.value) : [];
        const ppl = people ? this._splitComma(people.value) : [];
        const ctx = context ? this._splitComma(context.value) : [];
        const sens = reqSensors ? this._splitComma(reqSensors.value) : [];

        if (loc.length === 0 && ppl.length === 0 && tc.length === 0 && ctx.length === 0 && sens.length === 0) {
          this._item.requirements = null;
        } else {
          this._item.requirements = {
            mode: reqMode ? reqMode.value : 'ANY',
            location: loc,
            people: ppl,
            time_constraints: tc,
            context: ctx,
            sensors: sens,
          };
        }
        break;
      }
      case 5: {
        // Sync time blockers from DOM
        const tbRows = root.querySelectorAll('[data-tb-index]');
        tbRows.forEach((row, i) => {
          if (i < this._timeBlockers.length) {
            const start = row.querySelector('.tb-start');
            const end = row.querySelector('.tb-end');
            const mode = row.querySelector('.tb-mode');
            if (start) this._timeBlockers[i].start_time = start.value;
            if (end) this._timeBlockers[i].end_time = end.value;
            if (mode) this._timeBlockers[i].mode = mode.value;
            const daysCbs = row.querySelectorAll('.tb-day');
            const checkedDays = Array.from(daysCbs).filter(c => c.checked).map(c => parseInt(c.dataset.day, 10));
            this._timeBlockers[i].days = checkedDays.length === 7 ? null : checkedDays;
          }
        });

        // Sync condition triggers from DOM
        const ctRows = root.querySelectorAll('[data-ct-index]');
        ctRows.forEach((row, i) => {
          if (i < this._conditionTriggers.length) {
            const entity = row.querySelector('.ct-entity');
            const op = row.querySelector('.ct-operator');
            const val = row.querySelector('.ct-value');
            const attr = row.querySelector('.ct-attribute');
            const onMatch = row.querySelector('.ct-on-match');
            if (entity) this._conditionTriggers[i].entity_id = entity.value;
            if (op) this._conditionTriggers[i].operator = op.value;
            if (val) this._conditionTriggers[i].value = val.value;
            if (attr) this._conditionTriggers[i].attribute = attr.value || null;
            if (onMatch) this._conditionTriggers[i].on_match = onMatch.value;
          }
        });

        // Sync deferred
        const deferred = root.querySelector('#ed-deferred');
        if (deferred) {
          this._item.deferred_until = deferred.value ? new Date(deferred.value).toISOString() : null;
        }
        break;
      }
    }
  }

  // --- Save ---

  async _save() {
    // Sync current tab before collecting
    this._syncCurrentTab();

    const item = this._item;
    const msg = {
      type: 'yahatl/item_save',
      entity_id: this._entityId,
      item_id: this._itemId,
      title: item.title || '',
      description: item.description || '',
      priority: item.priority || null,
      due: item.due || null,
      time_estimate: item.time_estimate || null,
      needs_detail: !!item.needs_detail,
      traits: item.traits || [],
      tags: this._tags,
      recurrence: item.recurrence || null,
      blockers: item.blockers || null,
      requirements: item.requirements || null,
      time_blockers: this._timeBlockers.length > 0 ? this._timeBlockers : null,
      condition_triggers: this._conditionTriggers.length > 0 ? this._conditionTriggers : null,
      deferred_until: item.deferred_until || null,
    };

    const hass = this._getHass();
    if (!hass) {
      this._showError('Cannot find Home Assistant connection.');
      return;
    }

    try {
      await hass.callWS(msg);
      this.close();
    } catch (err) {
      this._showError(err.message || 'Failed to save item.');
    }
  }

  _showError(message) {
    const el = this.shadowRoot.querySelector('.error-msg');
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
    }
  }

  // --- Utilities ---

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  _splitComma(str) {
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }

  _toLocalDatetime(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }

  // --- Styles ---

  _getStyles() {
    return `
      :host {
        --editor-primary: var(--primary-color, #03a9f4);
        --editor-text: var(--primary-text-color, #212121);
        --editor-text-secondary: var(--secondary-text-color, #727272);
        --editor-bg: var(--card-background-color, var(--ha-card-background, white));
        --editor-divider: var(--divider-color, #e0e0e0);
        --editor-accent: var(--accent-color, #ff9800);
      }

      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .dialog {
        background: var(--editor-bg);
        color: var(--editor-text);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px 12px;
        border-bottom: 1px solid var(--editor-divider);
      }

      .dialog-header h2 {
        margin: 0;
        font-size: 1.2em;
        font-weight: 500;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        color: var(--editor-text-secondary);
        padding: 0 4px;
        line-height: 1;
      }
      .close-btn:hover {
        color: var(--editor-text);
      }

      .tabs {
        display: flex;
        overflow-x: auto;
        border-bottom: 1px solid var(--editor-divider);
        padding: 0 8px;
        -webkit-overflow-scrolling: touch;
      }

      .tab {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        padding: 10px 12px;
        font-size: 0.85em;
        cursor: pointer;
        color: var(--editor-text-secondary);
        white-space: nowrap;
        transition: color 0.2s, border-color 0.2s;
      }
      .tab:hover {
        color: var(--editor-text);
      }
      .tab.active {
        color: var(--editor-accent);
        border-bottom-color: var(--editor-accent);
        font-weight: 500;
      }

      .tab-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
        max-height: 60vh;
      }

      .error-msg {
        padding: 8px 20px;
        color: #f44336;
        font-size: 0.9em;
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 20px;
        border-top: 1px solid var(--editor-divider);
      }

      /* Forms */
      .form-group {
        margin-bottom: 12px;
      }

      .form-group label {
        display: block;
        font-size: 0.85em;
        color: var(--editor-text-secondary);
        margin-bottom: 4px;
      }

      .form-row {
        display: flex;
        gap: 12px;
        align-items: flex-end;
      }

      input[type="text"],
      input[type="number"],
      input[type="datetime-local"],
      input[type="time"],
      textarea,
      select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--editor-divider);
        border-radius: 6px;
        background: var(--editor-bg);
        color: var(--editor-text);
        font-size: 0.95em;
        box-sizing: border-box;
        font-family: inherit;
      }

      input:focus,
      textarea:focus,
      select:focus {
        outline: none;
        border-color: var(--editor-primary);
      }

      textarea {
        resize: vertical;
      }

      fieldset {
        border: 1px solid var(--editor-divider);
        border-radius: 8px;
        padding: 12px;
        margin: 0 0 12px 0;
      }

      legend {
        font-size: 0.9em;
        font-weight: 500;
        padding: 0 6px;
        color: var(--editor-text-secondary);
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9em;
        cursor: pointer;
        padding: 2px 0;
      }

      .checkbox-label-sm {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 0.8em;
        cursor: pointer;
      }

      .checkbox-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
      }

      .checkbox-list {
        max-height: 200px;
        overflow-y: auto;
        padding: 4px 0;
      }

      .status-hint {
        font-size: 0.8em;
        color: var(--editor-text-secondary);
      }

      .muted {
        color: var(--editor-text-secondary);
        font-size: 0.9em;
        font-style: italic;
      }

      /* Tags / Chips */
      .tag-input-row {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }

      .tag-input-row input {
        flex: 1;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 0.85em;
        background: rgba(0, 0, 0, 0.08);
        color: var(--editor-text);
      }

      .chip-remove {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1em;
        line-height: 1;
        padding: 0 2px;
        color: var(--editor-text-secondary);
      }
      .chip-remove:hover {
        color: #f44336;
      }

      /* Buttons */
      .btn {
        padding: 8px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .btn:hover {
        opacity: 0.85;
      }

      .btn-save {
        background: var(--editor-primary);
        color: white;
      }

      .btn-cancel {
        background: transparent;
        color: var(--editor-text-secondary);
        border: 1px solid var(--editor-divider);
      }

      .btn-small {
        padding: 6px 12px;
        font-size: 0.82em;
        border-radius: 4px;
        background: var(--editor-bg);
        border: 1px solid var(--editor-divider);
        color: var(--editor-text);
        cursor: pointer;
      }
      .btn-small:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .btn-danger {
        color: #f44336;
        border-color: #f44336;
      }

      /* Dynamic rows */
      .dynamic-row {
        border: 1px solid var(--editor-divider);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 8px;
      }

      .day-checkboxes {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 6px 0;
      }
    `;
  }
}

// Register the custom element
if (!customElements.get('yahatl-item-editor')) {
  customElements.define('yahatl-item-editor', YahatLItemEditor);
}

// Listen for open events at document level
document.addEventListener('yahatl-open-editor', (e) => {
  let editor = document.querySelector('yahatl-item-editor');
  if (!editor) {
    editor = document.createElement('yahatl-item-editor');
    document.body.appendChild(editor);
  }
  editor.open(e.detail);
});
