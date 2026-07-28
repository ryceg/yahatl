/**
 * Keyboard activation for div-based "buttons".
 *
 * Rows/chips rendered as divs get `role="button" tabindex="0"` plus this
 * keydown handler so Enter/Space activate them like a real button:
 *
 *   <div role="button" tabindex="0" @click=${fn} @keydown=${keyActivate(fn)}>
 *
 * Space's default (page scroll) is prevented on activation.
 */
export function keyActivate(
  handler: (e: Event) => void
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    handler(e);
  };
}
