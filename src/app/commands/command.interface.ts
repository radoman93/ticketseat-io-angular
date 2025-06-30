/**
 * Interface for the Command pattern.
 * All commands must implement execute, undo, and redo methods.
 */
export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
} 