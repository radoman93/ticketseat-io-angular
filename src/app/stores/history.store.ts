import { Injectable } from '@angular/core';
import { makeAutoObservable } from 'mobx';
import { Command } from '../models/command.interface';

@Injectable({ providedIn: 'root' })
export class HistoryStore {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  executeCommand(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
  }

  undo(): void {
    if (!this.canUndo) return;

    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo(): void {
    if (!this.canRedo) return;

    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }
} 