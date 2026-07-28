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

/**
 * Open the yahatl item editor by hand-mounting it on document.body.
 *
 * We deliberately do NOT route through HA's show-dialog dialog manager: that
 * path silently failed to surface the editor (the element was never asked to
 * open). Creating the editor directly and calling open() is self-contained and
 * matches the behaviour that worked before the dialog-manager refactor. The
 * editor is a fixed-position overlay designed for body mounting; we reuse a
 * single instance across opens.
 */
type EditorElement = HTMLElement & {
  open: (p: ItemEditorParams) => void | Promise<void>;
};
let editorEl: EditorElement | null = null;

export function openItemEditor(_source: HTMLElement, params: ItemEditorParams): void {
  if (!editorEl || !editorEl.isConnected) {
    editorEl = document.createElement("yahatl-item-editor") as EditorElement;
    document.body.appendChild(editorEl);
  }
  void editorEl.open(params);
}
