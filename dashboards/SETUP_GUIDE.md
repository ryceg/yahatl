# YAHATL Dashboard Setup Guide

This guide will walk you through setting up the YAHATL dashboard for Home Assistant.

## Prerequisites

Before you begin, make sure you have:

1. **Home Assistant** installed and running (2023.1 or later)
2. **YAHATL integration** installed and configured
3. At least one YAHATL list created

## Required Add-ons

Install these custom cards via HACS or manually:

### 1. Mushroom Cards
Mushroom provides beautiful, minimalist card designs.

**HACS Installation:**
1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Click "+ Explore & Download Repositories"
4. Search for "Mushroom"
5. Install "Lovelace Mushroom"

**Manual Installation:**
```bash
# In your Home Assistant config directory
cd www
git clone https://github.com/piitaya/lovelace-mushroom.git
```

Then add to your Lovelace resources:
```yaml
resources:
  - url: /hacsfiles/lovelace-mushroom/mushroom.js
    type: module
```

### 2. Card Mod (Optional but Recommended)
Allows styling customization.

**HACS Installation:**
1. Open HACS
2. Go to "Frontend"
3. Search for "card-mod"
4. Install

### 3. Auto Entities (Optional)
Useful for dynamic entity lists.

**HACS Installation:**
1. Open HACS
2. Go to "Frontend"
3. Search for "auto-entities"
4. Install

## Step 1: Create Helper Entities

Add the helper entities to your `configuration.yaml`:

```yaml
# Option 1: Direct in configuration.yaml
input_text: !include dashboards/helpers.yaml

# Option 2: Using packages (recommended)
homeassistant:
  packages:
    yahatl: !include packages/yahatl.yaml
```

If using packages, create `packages/yahatl.yaml`:
```yaml
# Copy contents from dashboards/helpers.yaml
```

**Restart Home Assistant** after adding helpers.

## Step 2: Add Template Sensors

Add the template sensors to your `configuration.yaml`:

```yaml
template: !include dashboards/sensors.yaml

# OR if you already have template sensors:
template:
  - sensor:
      # Your existing sensors

  # Add YAHATL sensors from dashboards/sensors.yaml
  - sensor:
      - name: YAHATL Time Period
        # ... etc
```

**Restart Home Assistant** after adding sensors.

## Step 3: Register Custom Card

Copy the custom card to your www directory:

```bash
# From the yahatl repository root
cp custom_components/yahatl/www/yahatl-item-card.js /config/www/
```

Add to your Lovelace resources:

1. Go to **Settings** → **Dashboards** → **⋮** (menu) → **Resources**
2. Click **+ Add Resource**
3. Enter URL: `/local/yahatl-item-card.js`
4. Resource type: **JavaScript Module**
5. Click **Create**

## Step 4: Create the Dashboard

### Method 1: New Dashboard (Recommended)

1. Go to **Settings** → **Dashboards**
2. Click **+ Add Dashboard**
3. Choose **New dashboard from scratch**
4. Name it "YAHATL"
5. Icon: `mdi:clipboard-check-outline`
6. Click **Create**
7. Click **⋮** (menu) → **Edit in YAML**
8. Copy the contents of `dashboards/yahatl_dashboard.yaml`
9. **Important:** Replace all instances of `todo.yahatl_my_list` with your actual entity ID
10. Click **Save**

### Method 2: Add to Existing Dashboard

1. Open your existing dashboard
2. Click **Edit Dashboard**
3. Click **+ Add View**
4. Copy sections from `dashboards/yahatl_dashboard.yaml` for each view
5. Add the three views: Planning, Capture, Notes
6. Replace entity IDs with your actual YAHATL entities

## Step 5: Configure Entity IDs

Update all entity references in the dashboard YAML:

**Find and replace:**
- `todo.yahatl_my_list` → Your actual YAHATL list entity (e.g., `todo.yahatl_tasks`)
- `person.user` → Your person entity
- `zone.work`, `zone.gym` → Your actual zones
- `light.living_room` → Your actual lights
- `media_player.home` → Your actual media players

## Step 6: Add Automations (Optional)

Add useful automations from `dashboards/automations.yaml`:

1. Go to **Settings** → **Automations & Scenes**
2. Click **+ Create Automation**
3. Click **⋮** (menu) → **Edit in YAML**
4. Copy automation from `automations.yaml`
5. Update entity IDs as needed
6. Save

**Recommended automations:**
- Auto-refresh queue on context changes
- Clear quick capture input after adding items
- Morning briefing
- Overdue reminders

## Step 7: Customize for Your Workflow

### Update Location Options

Edit `input_select.yahatl_location` options:
```yaml
input_select:
  yahatl_location:
    options:
      - home
      - work
      - gym
      - coffee_shop  # Add your locations
      - library
```

### Update Context Options

Edit `input_select.yahatl_context` options:
```yaml
input_select:
  yahatl_context:
    options:
      - deep_work     # Add your contexts
      - meetings
      - creative
      - admin
```

### Customize Tag Filters

Update the tag filter chips in the Notes tab:
```yaml
- type: custom:mushroom-template-card
  primary: Your Tag
  icon: mdi:your-icon
  icon_color: your-color
  tap_action:
    action: call-service
    service: input_text.set_value
    service_data:
      entity_id: input_text.yahatl_search
      value: "#yourtag"
```

## Troubleshooting

### Dashboard Shows "Entity not found"

**Problem:** Entity IDs are incorrect.

**Solution:**
1. Go to **Developer Tools** → **States**
2. Find your YAHATL entities (search for `todo.yahatl_`)
3. Update dashboard YAML with correct entity IDs

### Cards Show "Custom element doesn't exist"

**Problem:** Custom cards not loaded.

**Solution:**
1. Check Lovelace resources are added correctly
2. Clear browser cache (Ctrl+Shift+R)
3. Check browser console for errors
4. Verify files exist in `www` directory

### Sensors Show "Unknown" or "Unavailable"

**Problem:** Template sensors not configured correctly.

**Solution:**
1. Check `configuration.yaml` includes sensor file correctly
2. Restart Home Assistant
3. Check **Developer Tools** → **Template** to test sensor templates
4. Verify entity IDs in templates match your setup

### Automations Not Triggering

**Problem:** Entity IDs or conditions incorrect.

**Solution:**
1. Check automation entity IDs
2. Test automation manually via **Developer Tools** → **Services**
3. Check automation traces for errors
4. Verify conditions are met

## Advanced Customization

### Adding More Stats Cards

Create custom template sensors in `sensors.yaml`:
```yaml
- sensor:
    - name: YAHATL Custom Stat
      state: >
        {% set items = state_attr('todo.yahatl_my_list', 'items') %}
        {# Your custom logic #}
```

### Creating Custom Views

Add additional views for specific workflows:
```yaml
- title: Weekly Review
  icon: mdi:calendar-week
  path: weekly-review
  cards:
    # Your custom cards
```

### Mobile Optimization

Add card_mod styles for mobile:
```yaml
card_mod:
  style: |
    @media (max-width: 768px) {
      ha-card {
        font-size: 0.9em;
        padding: 8px;
      }
    }
```

## Best Practices

1. **Start Simple:** Begin with the basic dashboard and add complexity over time
2. **Use Packages:** Organize YAHATL configuration in a package for easy management
3. **Test Changes:** Use YAML validation before saving dashboard changes
4. **Backup First:** Export dashboard YAML before making major changes
5. **Version Control:** Keep dashboard configurations in git
6. **Document Custom Changes:** Comment your customizations for future reference

## Example Workflows

### Morning Routine

1. Check Planning tab for today's queue
2. Review overdue items (red badge)
3. Start top priority item
4. Use Pomodoro timer for focused work

### Quick Capture

1. Go to Capture tab
2. Type task in quick capture field
3. Tap "Add to Inbox"
4. Input automatically clears
5. Triage inbox during dedicated time

### Weekly Review

1. Go to Notes tab
2. Review completed items
3. Check habits for broken streaks
4. Triage inbox items
5. Plan upcoming week

## Getting Help

- **Issues:** https://github.com/ryceg/yahatl/issues
- **Discussions:** https://github.com/ryceg/yahatl/discussions
- **Documentation:** See README.md and docs/

## Next Steps

After setting up the dashboard:

1. **Configure your first list** via the YAHATL integration
2. **Add some test items** to see how they display
3. **Generate your first queue** using the "Refresh Queue" button
4. **Set up automations** for automatic queue updates
5. **Customize colors and icons** to match your Home Assistant theme
6. **Add mobile notifications** for overdue/streak alerts

Enjoy using YAHATL! 🎯
