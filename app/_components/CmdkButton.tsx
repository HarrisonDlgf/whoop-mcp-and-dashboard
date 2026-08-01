"use client";

export function CmdkButton() {
  return (
    <button
      className="kbd-hint"
      onClick={() => window.dispatchEvent(new Event("open-cmdk"))}
      aria-label="Open command palette"
    >
      <kbd>⌘K</kbd> Menu
    </button>
  );
}
