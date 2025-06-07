import { Command } from '../models/command.interface';
import { layoutStore, LayoutStore } from '../stores/layout.store';

export class MoveObjectCommand implements Command {
  description = 'Move Object';

  constructor(
    private readonly targetId: string,
    private readonly oldPosition: { x: number; y: number },
    private readonly newPosition: { x: number; y: number },
    private lStore: LayoutStore = layoutStore
  ) {}

  execute(): void {
    this.lStore.updateElement(this.targetId, this.newPosition);
  }

  undo(): void {
    this.lStore.updateElement(this.targetId, this.oldPosition);
  }
} 