import { Command } from '../models/command.interface';
import { layoutStore, LayoutStore } from '../stores/layout.store';
import { SeatingRowProperties } from '../services/selection.service';

export class RotateObjectCommand implements Command {
  description = 'Rotate Object';

  constructor(
    private readonly targetId: string,
    private readonly oldState: { rotation: number },
    private readonly newState: { rotation: number },
    private lStore: LayoutStore = layoutStore
  ) {}

  execute(): void {
    this.lStore.updateElement(this.targetId, this.newState);
  }

  undo(): void {
    this.lStore.updateElement(this.targetId, this.oldState);
  }
} 