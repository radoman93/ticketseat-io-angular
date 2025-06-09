import { Command } from '../models/command.interface';
import { layoutStore, LayoutStore } from '../stores/layout.store';
import { SeatingRowProperties, SegmentProperties } from '../services/selection.service';

export class RotateObjectCommand implements Command {
  description = 'Rotate Object';

  constructor(
    private readonly targetId: string,
    private readonly oldState: { rotation: number, segments?: SegmentProperties[] },
    private readonly newState: { rotation: number, segments?: SegmentProperties[] },
    private lStore: LayoutStore = layoutStore
  ) {}

  execute(): void {
    this.lStore.updateElement(this.targetId, this.newState);
  }

  undo(): void {
    this.lStore.updateElement(this.targetId, this.oldState);
  }
} 