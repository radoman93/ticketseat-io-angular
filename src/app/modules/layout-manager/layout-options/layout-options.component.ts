import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout-options',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="layout-options">
      <h3>Layout Options</h3>
      
      <div class="save-section">
        <h4>Save Current Layout</h4>
        <div class="save-input">
          <input 
            type="text" 
            [(ngModel)]="layoutName" 
            placeholder="Layout name"
            (keyup.enter)="saveLayoutHandler()"
          />
          <button [disabled]="!layoutName" (click)="saveLayoutHandler()">Save</button>
        </div>
      </div>
      
      <div class="import-export">
        <h4>Import/Export</h4>
        <div class="actions">
          <button (click)="exportLayoutHandler()">Export Layout</button>
          <label class="import-button">
            Import Layout
            <input 
              type="file" 
              accept=".json" 
              (change)="importLayoutHandler($event)"
              style="display: none;"
            />
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout-options {
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 16px;
    }

    h3, h4 {
      margin-top: 0;
      margin-bottom: 16px;
    }

    h4 {
      margin-top: 16px;
      font-size: 16px;
    }

    .save-input {
      display: flex;
      gap: 8px;
    }

    input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    button, .import-button {
      cursor: pointer;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background-color: #007bff;
      color: white;
      text-align: center;
      font-size: 14px;
    }

    button:hover, .import-button:hover {
      background-color: #0069d9;
    }

    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  `]
})
export class LayoutOptionsComponent {
  @Output() saveLayout = new EventEmitter<string>();
  @Output() exportLayout = new EventEmitter<void>();
  @Output() importLayout = new EventEmitter<File>();

  layoutName = '';

  saveLayoutHandler(): void {
    if (this.layoutName) {
      this.saveLayout.emit(this.layoutName);
      this.layoutName = '';
    }
  }

  exportLayoutHandler(): void {
    this.exportLayout.emit();
  }

  importLayoutHandler(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importLayout.emit(input.files[0]);
    }
  }
} 