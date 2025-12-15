# Connecting YAHATL to Home Assistant via MQTT

This guide explains how to connect YAHATL to your Home Assistant instance using MQTT for real-time integration.

## Prerequisites

- Home Assistant with MQTT integration configured
- An MQTT broker (e.g., Mosquitto) accessible by both YAHATL and Home Assistant
- YAHATL API running

## Step 1: Set Up an MQTT Broker

If you don't already have an MQTT broker, you can install Mosquitto as a Home Assistant add-on:

1. In Home Assistant, go to **Settings → Add-ons → Add-on Store**
2. Search for **Mosquitto broker** and install it
3. Start the add-on
4. Create an MQTT user in **Settings → People → Users** (or use an existing user)

## Step 2: Configure Home Assistant MQTT Integration

1. Go to **Settings → Devices & Services → Add Integration**
2. Search for **MQTT** and add it
3. If using the Mosquitto add-on, it should auto-configure; otherwise, enter your broker details

## Step 3: Configure YAHATL

Edit your `appsettings.json` (or use environment variables) with your MQTT broker details:

```json
{
  "Mqtt": {
    "Host": "homeassistant.local",
    "Port": 1883,
    "Username": "your-mqtt-username",
    "Password": "your-mqtt-password",
    "ClientId": "yahatl-api"
  }
}
```

### Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `Host` | MQTT broker hostname or IP address | `localhost` |
| `Port` | MQTT broker port | `1883` |
| `Username` | MQTT authentication username | (empty) |
| `Password` | MQTT authentication password | (empty) |
| `ClientId` | Unique identifier for this YAHATL instance | `yahatl-api` |

## Step 4: Restart YAHATL

After updating the configuration, restart the YAHATL API. Check the logs for successful MQTT connection:

```
[MQTT] Connecting to MQTT broker at homeassistant.local:1883
[MQTT] Connected to MQTT broker
```

## Home Assistant Auto-Discovery

YAHATL uses [MQTT Discovery](https://www.home-assistant.io/integrations/mqtt/#mqtt-discovery) to automatically create entities in Home Assistant. Once connected, the following entities will appear under a **YAHATL** device:

### Sensors

| Entity | Description |
|--------|-------------|
| `sensor.yahatl_overdue_count` | Number of overdue tasks |
| `sensor.yahatl_tasks_due_today` | Number of tasks due today |
| `sensor.yahatl_next_task` | Title of the next pending task |

### Binary Sensors

| Entity | Description |
|--------|-------------|
| `binary_sensor.yahatl_chores_overdue` | `ON` if any chores are overdue |

### Per-Chore Entities

When you create a chore in YAHATL, it automatically publishes discovery for:
- `binary_sensor.yahatl_chore_<id>_overdue` - Whether that specific chore is overdue
- `sensor.yahatl_chore_<id>_next_due` - When the chore is next due

## Using MQTT Conditions (Triggers & Blockers)

YAHATL can subscribe to any Home Assistant MQTT topic to create intelligent task conditions:

### Condition Triggers

Make tasks appear only when certain conditions are met. For example, show "Water the plants" only when:
- Soil moisture sensor reports low moisture
- It's during daylight hours

### Condition Blockers

Block tasks from showing when certain conditions are met. For example, block outdoor chores when:
- Weather sensor shows rain
- Temperature is below freezing

### Exposing Home Assistant States to MQTT

By default, Home Assistant doesn't publish entity states to MQTT. You can use automations to bridge this:

```yaml
# configuration.yaml or automations.yaml
automation:
  - alias: "Publish Weather State to MQTT"
    trigger:
      - platform: state
        entity_id: weather.home
    action:
      - service: mqtt.publish
        data:
          topic: "homeassistant/weather/home/state"
          payload: "{{ states('weather.home') }}"
          retain: true
```

Then in YAHATL, you can create a blocker with:
- **Topic**: `homeassistant/weather/home/state`
- **Operator**: `equals`
- **Value**: `rainy`

## MQTT Topic Reference

### State Topics (YAHATL → Home Assistant)

| Topic | Description |
|-------|-------------|
| `yahatl/sensor/overdue_count/state` | Number of overdue tasks |
| `yahatl/sensor/tasks_due_today/state` | Tasks due today count |
| `yahatl/sensor/next_task/state` | Next task title |
| `yahatl/binary_sensor/chores_overdue/state` | `ON`/`OFF` for overdue chores |
| `yahatl/binary_sensor/chore_<id>/state` | Individual chore overdue status |
| `yahatl/sensor/chore_<id>_next_due/state` | Individual chore next due date |

### Discovery Topics

YAHATL publishes discovery configs to `homeassistant/<component>/yahatl/<object_id>/config`.

## Troubleshooting

### YAHATL won't connect to MQTT

1. Verify the broker is running: `mosquitto_sub -h <host> -t '#' -u <user> -P <pass>`
2. Check firewall rules for port 1883
3. Ensure username/password are correct
4. Check YAHATL logs for connection errors

### Entities not appearing in Home Assistant

1. Verify MQTT discovery is enabled in Home Assistant (it is by default)
2. Check that the discovery prefix is `homeassistant` (default)
3. Use MQTT Explorer to verify discovery messages are being published
4. Restart Home Assistant after YAHATL connects

### States not updating

1. Check YAHATL is connected (health endpoint shows MQTT status)
2. Verify state topics are being published using MQTT Explorer
3. Background services update states periodically; wait up to 60 seconds

## Example Automations

### Notify when tasks are overdue

```yaml
automation:
  - alias: "Notify Overdue Tasks"
    trigger:
      - platform: numeric_state
        entity_id: sensor.yahatl_overdue_count
        above: 0
    action:
      - service: notify.mobile_app
        data:
          message: "You have {{ states('sensor.yahatl_overdue_count') }} overdue tasks!"
```

### Flash lights when chores are overdue

```yaml
automation:
  - alias: "Chores Overdue Alert"
    trigger:
      - platform: state
        entity_id: binary_sensor.yahatl_chores_overdue
        to: "on"
    action:
      - service: light.turn_on
        target:
          entity_id: light.living_room
        data:
          flash: short
```
