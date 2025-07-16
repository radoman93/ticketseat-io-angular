import { Command } from '../models/command.interface';
import { layoutStore, LayoutStore } from '../stores/layout.store';
import { selectionStore, SelectionStore } from '../stores/selection.store';
import { Selectable } from '../services/selection.service';
import { TableElement } from '../stores/layout.store';

export class DeleteObjectCommand implements Command {
  description = 'Delete Object';
  private readonly deletedObject: TableElement | undefined;

  constructor(
    private objectToDelete: Selectable,
    private lStore: LayoutStore = layoutStore,
    private sStore: SelectionStore = selectionStore
  ) {
    // Find the full object in the layout store to ensure we can restore it completely
    this.deletedObject = this.lStore.getElementById(objectToDelete.id);
  }

  execute(): void {
    if (!this.deletedObject) return;
    this.lStore.deleteElement(this.deletedObject.id);
    this.sStore.deselectItem();
  }

  undo(): void {
    if (!this.deletedObject) return;
    this.lStore.addElement(this.deletedObject);
    // Restore selection for a better user experience
    this.sStore.selectItem(this.deletedObject);
  }

  redo(): void {
    this.execute();
  }
} 