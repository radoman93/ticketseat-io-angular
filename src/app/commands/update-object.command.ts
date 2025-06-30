import { Command } from './command.interface';
import { layoutStore } from '../stores/layout.store';

export class UpdateObjectCommand implements Command {
  private previousState: any;

  constructor(
    private objectId: string,
    private updates: Partial<any>
  ) {
    // Store the current state before update
    const currentObject = layoutStore.getElementById(objectId);
    if (currentObject) {
      this.previousState = { ...currentObject };
    }
  }

  execute(): void {
    layoutStore.updateElement(this.objectId, this.updates);
  }

  undo(): void {
    if (this.previousState) {
      layoutStore.updateElement(this.objectId, this.previousState);
    }
  }

  redo(): void {
    this.execute();
  }
} 