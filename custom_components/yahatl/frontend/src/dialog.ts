/**
 * Launch the item editor the Home Assistant way.
 *
 * Instead of hand-mounting a dialog on document.body, we fire HA's
 * `show-dialog` event: the frontend's dialog manager creates the editor,
 * mounts it inside <home-assistant>, and wires up history / back-button
 * handling. The editor is already registered in this bundle, so
 * `dialogImport` just resolves.
 */
import type { HomeAssistant } from "./types";

export interface ItemEditorParams {
  entityId: string;
  itemId?: string;
  hass?: HomeAssistant;
}

/** HA's fireEvent, inlined so we don't depend on internal frontend modules. */
export function fireEvent(
  node: HTMLElement | Window,
  type: string,
  detail?: unknown
): void {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: false,
    })
  );
}

/** Open the yahatl item editor from any card (source must be in the HA DOM). */
export function openItemEditor(source: HTMLElement, params: ItemEditorParams): void {
  fireEvent(source, "show-dialog", {
    dialogTag: "yahatl-item-editor",
    dialogImport: () => Promise.resolve(),
    dialogParams: params,
    addHistory: true,
  });
}
