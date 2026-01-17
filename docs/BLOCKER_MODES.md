# Blocker Modes Documentation

## Overview

The yahatl blocker system uses a three-level mode configuration to provide maximum flexibility in defining when tasks are blocked:

1. **item_mode**: How individual item blockers relate to each other
2. **sensor_mode**: How individual sensor blockers relate to each other
3. **mode**: How the item and sensor categories combine

This allows you to create complex blocking scenarios like "blocked if ANY item is incomplete AND ALL sensors are on" or "blocked if ALL items are incomplete OR ANY sensor is on".

## Mode Options

All three modes accept two values:
- **ANY**: At least one must be blocking
- **ALL**: All must be blocking

## Configuration Structure

```yaml
blockers:
  mode: "ALL"  # How to combine items and sensors

  items: ["task-uid-1", "task-uid-2"]  # List of item UIDs
  item_mode: "ANY"  # How items relate to each other

  sensors: ["binary_sensor.sensor1", "binary_sensor.sensor2"]  # List of sensor entity IDs
  sensor_mode: "ALL"  # How sensors relate to each other
```

## Examples

### Example 1: Block if ANY item incomplete OR ANY sensor on

**Use case**: "I can't clean the oven if it's hot OR if I haven't bought oven cleaner"

```yaml
blockers:
  mode: "ANY"  # Either category can block
  items: ["buy-oven-cleaner"]
  item_mode: "ANY"  # Any item incomplete blocks
  sensors: ["binary_sensor.oven_hot"]
  sensor_mode: "ANY"  # Any sensor on blocks
```

**Result**: Blocked if:
- "buy-oven-cleaner" is incomplete, OR
- "oven_hot" sensor is on

### Example 2: Block if ALL items incomplete AND ALL sensors on

**Use case**: "I can only do this task if ALL prerequisites are done AND ALL conditions are met"

```yaml
blockers:
  mode: "ALL"  # Both categories must block
  items: ["task1", "task2", "task3"]
  item_mode: "ALL"  # All items must be incomplete
  sensors: ["binary_sensor.condition1", "binary_sensor.condition2"]
  sensor_mode: "ALL"  # All sensors must be on
```

**Result**: Blocked ONLY if:
- ALL of task1, task2, task3 are incomplete, AND
- ALL of condition1, condition2 sensors are on

### Example 3: Block if ANY of several items incomplete AND ALL sensors on

**Use case**: "I can mow the lawn if I have ANY of several blockers incomplete, but ONLY when weather conditions are ALL good"

```yaml
blockers:
  mode: "ALL"  # Both categories must block
  items: ["buy-gas", "repair-mower", "sharpen-blades"]
  item_mode: "ANY"  # Any one incomplete blocks
  sensors: ["binary_sensor.good_weather", "binary_sensor.daylight"]
  sensor_mode: "ALL"  # All sensors must be on to block
```

**Result**: Blocked if:
- (ANY of buy-gas, repair-mower, sharpen-blades is incomplete) AND
- (ALL of good_weather, daylight are on)

**Wait, that's backwards!** For this use case, you'd use REQUIREMENTS instead:

```yaml
requirements:
  mode: "ALL"
  sensors: ["binary_sensor.good_weather", "binary_sensor.daylight"]
```

And blockers for the items:

```yaml
blockers:
  mode: "ANY"
  items: ["buy-gas", "repair-mower", "sharpen-blades"]
  item_mode: "ANY"
```

### Example 4: Complex dependency chain

**Use case**: "Block this task if we're waiting on BOTH the morning meeting AND afternoon meeting to complete, OR if ANY critical system is down"

```yaml
blockers:
  mode: "ANY"  # Either category can block
  items: ["morning-meeting", "afternoon-meeting"]
  item_mode: "ALL"  # Both meetings must be incomplete to block
  sensors: ["binary_sensor.database_down", "binary_sensor.api_down"]
  sensor_mode: "ANY"  # Any system down blocks
```

**Result**: Blocked if:
- (BOTH morning-meeting AND afternoon-meeting are incomplete) OR
- (ANY of database_down, api_down is on)

### Example 5: Safety interlock

**Use case**: "Can't run the CNC machine unless ALL safety checks pass AND operator is present"

```yaml
blockers:
  mode: "ALL"  # Both categories must clear
  items: ["safety-inspection", "material-loaded"]
  item_mode: "ALL"  # All items must be complete to unblock
  sensors: ["binary_sensor.emergency_stop", "binary_sensor.door_open", "binary_sensor.operator_present"]
  sensor_mode: "ALL"  # All sensors must be in blocking state
```

Wait, this is tricky because sensors are "blocking when on". For safety, you'd want:
- emergency_stop = off (not blocking)
- door_open = off (not blocking)
- operator_present = on (not blocking if inverted)

This might be better modeled as requirements with proper sensor logic.

### Example 6: Simple blocking (backward compatible)

**Use case**: "Block if dependent task isn't done"

```yaml
blockers:
  mode: "ANY"  # Default
  items: ["prerequisite-task"]
  item_mode: "ANY"  # Default
  # No sensors
```

**Result**: Blocked if "prerequisite-task" is incomplete.

This is backward compatible with the old system.

## Home Assistant Service Call

To set blockers via the `yahatl.set_blockers` service:

```yaml
service: yahatl.set_blockers
data:
  entity_id: todo.my_list
  item_id: "task-uid"
  mode: "ALL"
  items: ["blocker-uid-1", "blocker-uid-2"]
  item_mode: "ALL"
  sensors: ["binary_sensor.test1", "binary_sensor.test2"]
  sensor_mode: "ANY"
```

## Truth Tables

### mode="ANY" (Categories OR)

| Items Block | Sensors Block | Result  |
|-------------|---------------|---------|
| No          | No            | Not blocked |
| No          | Yes           | **Blocked** |
| Yes         | No            | **Blocked** |
| Yes         | Yes           | **Blocked** |

### mode="ALL" (Categories AND)

| Items Block | Sensors Block | Result  |
|-------------|---------------|---------|
| No          | No            | Not blocked |
| No          | Yes           | Not blocked |
| Yes         | No            | Not blocked |
| Yes         | Yes           | **Blocked** |

### item_mode="ANY" (Items OR)

Blocked if **any** item is incomplete.

| Item 1 | Item 2 | Result |
|--------|--------|--------|
| Complete | Complete | Not blocked |
| Complete | Incomplete | **Blocked** |
| Incomplete | Complete | **Blocked** |
| Incomplete | Incomplete | **Blocked** |

### item_mode="ALL" (Items AND)

Blocked if **all** items are incomplete.

| Item 1 | Item 2 | Result |
|--------|--------|--------|
| Complete | Complete | Not blocked |
| Complete | Incomplete | Not blocked |
| Incomplete | Complete | Not blocked |
| Incomplete | Incomplete | **Blocked** |

### sensor_mode="ANY" (Sensors OR)

Blocked if **any** sensor is on.

| Sensor 1 | Sensor 2 | Result |
|----------|----------|--------|
| Off | Off | Not blocked |
| Off | On | **Blocked** |
| On | Off | **Blocked** |
| On | On | **Blocked** |

### sensor_mode="ALL" (Sensors AND)

Blocked if **all** sensors are on.

| Sensor 1 | Sensor 2 | Result |
|----------|----------|--------|
| Off | Off | Not blocked |
| Off | On | Not blocked |
| On | Off | Not blocked |
| On | On | **Blocked** |

## Default Values

If not specified:
- `mode`: defaults to "ALL"
- `item_mode`: defaults to "ANY"
- `sensor_mode`: defaults to "ANY"

This maintains backward compatibility with the original system where items and sensors each used ANY logic internally, combined with ALL logic between them.

## Tips

1. **Start simple**: Use `mode="ANY"` and `item_mode="ANY"` for most cases
2. **Safety-critical**: Use `mode="ALL"` and `sensor_mode="ALL"` when ALL conditions must be met
3. **Dependencies**: Use `item_mode="ALL"` when a task requires multiple prerequisites to ALL be complete
4. **Conditions**: Use `sensor_mode="ANY"` when ANY unfavorable condition should block
5. **Test thoroughly**: The nested modes can create complex logic - test edge cases

## When to Use Blockers vs Requirements

- **Blockers**: Things that must be COMPLETE or OFF before this task can be done
- **Requirements**: Things that must be PRESENT or ON for this task to be done

Example:
- Blocker: "Can't paint the fence if it's raining" → sensor_blocker on rain sensor
- Requirement: "Can only paint the fence during daylight" → requirement on daylight sensor

Both can use sensors, but the semantic meaning is different!
