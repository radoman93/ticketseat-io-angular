import { Command } from '../models/command.interface';
import { layoutStore, LayoutStore } from '../stores/layout.store';

// Define position types for different element types
type Position = { x: number; y: number };
type LinePosition = { x: number; y: number; startX: number; startY: number; endX: number; endY: number };
type PolygonPosition = { x: number; y: number; points: Array<{x: number, y: number}> };
type ElementPosition = Position | LinePosition | PolygonPosition;

export class MoveObjectCommand implements Command {
  description = 'Move Object';

  constructor(
    private readonly targetId: string,
    private readonly oldPosition: ElementPosition,
    private readonly newPosition: ElementPosition,
    private lStore: LayoutStore = layoutStore
  ) {}

  execute(): void {
    this.lStore.updateElement(this.targetId, this.newPosition);
  }

  undo(): void {
    this.lStore.updateElement(this.targetId, this.oldPosition);
  }

  redo(): void {
    this.execute();
  }
} 