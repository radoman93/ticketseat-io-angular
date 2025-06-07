import { Command } from '../models/command.interface';
import { layoutStore, LayoutStore, TableElement } from '../stores/layout.store';
import { selectionStore, SelectionStore } from '../stores/selection.store';

export class AddObjectCommand implements Command {
  description = 'Add Object';

  constructor(
    private elementToAdd: TableElement,
    private lStore: LayoutStore = layoutStore,
    private sStore: SelectionStore = selectionStore
  ) {}

  execute(): void {
    this.lStore.addElement(this.elementToAdd);
    // Select the new element for a better user experience
    this.sStore.selectItem(this.elementToAdd);
  }

  undo(): void {
    this.lStore.deleteElement(this.elementToAdd.id);
    this.sStore.deselectItem();
  }
} 