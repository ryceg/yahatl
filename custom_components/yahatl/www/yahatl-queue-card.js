class YahtlQueueCard extends HTMLElement {
  set hass(hass) {
    const entityId = this.config.entity;
    const state = hass.states[entityId];
    if (!state) {
      this.innerHTML = `<ha-card header="Queue"><div class="card-content">Entity not found: ${entityId}</div></ha-card>`;
      return;
    }

    const queue = state.attributes.queue || [];
    const maxItems = this.config.max_items || 10;
    const shown = queue.slice(0, maxItems);

    this.innerHTML = `
      <ha-card header="${this.config.title || 'Next Tasks'}">
        <div class="card-content">
          ${shown.length === 0 ? '<p style="color:var(--secondary-text-color);">Nothing to do!</p>' : ''}
          ${shown.map((item, i) => `
            <div style="display:flex;align-items:center;padding:8px 0;${i < shown.length - 1 ? 'border-bottom:1px solid var(--divider-color,#e0e0e0);' : ''}">
              <span style="min-width:28px;font-weight:bold;color:var(--primary-color);font-size:1.1em;">${i + 1}</span>
              <div style="flex:1;">
                <div style="font-weight:${i === 0 ? 'bold' : 'normal'};">${item.item ? item.item.title : item.title || 'Untitled'}</div>
                ${item.item && item.item.due ? `<div style="font-size:0.85em;color:var(--secondary-text-color);">Due: ${new Date(item.item.due).toLocaleDateString()}</div>` : ''}
              </div>
              ${item.score != null ? `<span style="font-size:0.8em;color:var(--secondary-text-color);margin-left:8px;">${item.score}pts</span>` : ''}
            </div>
          `).join('')}
        </div>
      </ha-card>
    `;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("You need to define an entity");
    this.config = config;
  }

  getCardSize() {
    return 3;
  }
}

customElements.define("yahatl-queue-card", YahtlQueueCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-queue-card",
  name: "Yahatl Queue Card",
  description: "Shows prioritized task queue from yahatl",
});
