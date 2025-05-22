import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { persistenceManager } from '../../../stores/persistence.manager';

@Component({
  selector: 'app-saved-layouts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saved-layouts">
      <h3>Saved Layouts</h3>
      <div class="layouts-list">
        <div *ngIf="savedLayouts.length === 0" class="no-layouts">
          No saved layouts
        </div>
        <div *ngFor="let layout of savedLayouts" class="layout-item">
          <span>{{ layout.name }}</span>
          <div class="actions">
            <button (click)="loadLayoutHandler(layout.id)">Load</button>
            <button (click)="deleteLayoutHandler(layout.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .saved-layouts {
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 16px;
    }

    h3 {
      margin-top: 0;
      margin-bottom: 16px;
    }

    .layouts-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .no-layouts {
      font-style: italic;
      color: #888;
    }

    .layout-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    button {
      cursor: pointer;
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      background-color: #007bff;
      color: white;
    }

    button:hover {
      background-color: #0069d9;
    }

    button:last-child {
      background-color: #dc3545;
    }

    button:last-child:hover {
      background-color: #c82333;
    }
  `]
})
export class SavedLayoutsComponent {
  @Output() loadLayout = new EventEmitter<string>();
  @Output() deleteLayout = new EventEmitter<string>();

  get savedLayouts() {
    return persistenceManager.getSavedLayouts();
  }

  loadLayoutHandler(layoutId: string): void {
    this.loadLayout.emit(layoutId);
  }

  deleteLayoutHandler(layoutId: string): void {
    this.deleteLayout.emit(layoutId);
  }
} 