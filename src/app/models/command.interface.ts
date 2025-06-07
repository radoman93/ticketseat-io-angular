export interface Command {
  /**
   * A description of the command, useful for debugging or history logs.
   */
  description?: string;

  /**
   * Executes the command, changing the application state.
   */
  execute(): void;

  /**
   * Reverts the changes made by the execute() method.
   */
  undo(): void;
} 