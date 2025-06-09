import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutExportImportService } from '../../services/layout-export-import.service';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Export Layout</h3>
        
        <form (ngSubmit)="onExport()" #exportForm="ngForm">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Layout Name *</label>
            <input 
              type="text"
              [(ngModel)]="layoutName"
              name="layoutName"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter layout name">
          </div>
          
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea 
              [(ngModel)]="description"
              name="description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description..."></textarea>
          </div>
          
          <div class="flex justify-end gap-3">
            <button 
              type="button"
              (click)="onCancel()"
              class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button 
              type="submit"
              [disabled]="!exportForm.valid"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Export
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class ExportDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() export = new EventEmitter<{name: string, description?: string}>();

  layoutName = '';
  description = '';

  constructor(private exportImportService: LayoutExportImportService) {}

  onExport(): void {
    if (this.layoutName.trim()) {
      this.exportImportService.downloadLayout(
        this.layoutName.trim(),
        this.description.trim() || undefined
      );
      this.close.emit();
      this.resetForm();
    }
  }

  onCancel(): void {
    this.close.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.layoutName = '';
    this.description = '';
  }
} 