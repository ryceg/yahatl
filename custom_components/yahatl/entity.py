"""Base entity for YAHATL integration."""

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import YahatlCoordinator


class YahatlEntity(CoordinatorEntity[YahatlCoordinator]):
    """Base entity for YAHATL."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: YahatlCoordinator, entity_key: str) -> None:
        """Initialize the entity."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_{entity_key}"

    @property
    def device_info(self) -> DeviceInfo:
        """Return device info."""
        return DeviceInfo(
            identifiers={(DOMAIN, self.coordinator.entry.entry_id)},
            name="YAHATL",
            manufacturer="YAHATL",
            model="Task Manager",
            entry_type=DeviceEntryType.SERVICE,
        )
