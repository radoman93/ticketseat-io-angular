import { Command } from './command.interface';
import { layoutStore } from '../stores/layout.store';
import { selectionStore } from '../stores/selection.store';
import { LoggerService } from '../services/logger.service';

export class ReorderElementCommand implements Command {
  private logger = new LoggerService();
  
  constructor(
    private elementId: string,
    private fromIndex: number,
    private toIndex: number
  ) {}

  execute(): void {
    // The actual reordering is done by swapElements in the store
    layoutStore.swapElements(this.fromIndex, this.toIndex);
    
    // Find the element to reselect it
    const element = layoutStore.getElementById(this.elementId);
    if (element) {
      selectionStore.selectItem(element);
    }
    
    this.logger.debug('Element reordered', {
      component: 'ReorderElementCommand',
      action: 'execute',
      elementId: this.elementId,
      fromIndex: this.fromIndex,
      toIndex: this.toIndex
    });
  }

  undo(): void {
    // Swap back to original position
    layoutStore.swapElements(this.toIndex, this.fromIndex);
    
    // Find the element to reselect it
    const element = layoutStore.getElementById(this.elementId);
    if (element) {
      selectionStore.selectItem(element);
    }
    
    this.logger.debug('Element reorder undone', {
      component: 'ReorderElementCommand',
      action: 'undo',
      elementId: this.elementId,
      fromIndex: this.fromIndex,
      toIndex: this.toIndex
    });
  }

  redo(): void {
    // Redo is the same as execute
    this.execute();
  }

  getDescription(): string {
    const element = layoutStore.getElementById(this.elementId);
    const elementName = element ? (element as any).name || element.type : 'element';
    const direction = this.toIndex > this.fromIndex ? 'forward' : 'backward';
    return `Send ${elementName} ${direction}`;
  }
}