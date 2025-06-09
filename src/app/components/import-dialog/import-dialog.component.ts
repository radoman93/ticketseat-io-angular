import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutExportImportService, LayoutExportData } from '../../services/layout-export-import.service';

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-[500px] max-w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Import Layout</h3>
        
        <!-- File Upload Area -->
        <div *ngIf="!selectedFile && !preview" 
             class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4"
             (dragover)="onDragOver($event)"
             (drop)="onDrop($event)">
          <div class="text-gray-600 mb-4">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <p class="text-gray-600 mb-2">Drag and drop a .ticketseat file here, or</p>
          <input type="file" 
                 #fileInput
                 accept=".ticketseat,.json"
                 (change)="onFileSelected($event)"
                 class="hidden">
          <button type="button" 
                  (click)="fileInput.click()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Choose File
          </button>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ errorMessage }}
        </div>

        <!-- Preview -->
        <div *ngIf="preview" class="border rounded-lg p-4 mb-4">
          <h4 class="font-semibold mb-2">Layout Preview</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium">Name:</span> {{ preview.name }}
            </div>
            <div>
              <span class="font-medium">Created:</span> {{ formatDate(preview.created) }}
            </div>
            <div>
              <span class="font-medium">Elements:</span> {{ preview.elementCount }}
            </div>
            <div>
              <span class="font-medium">Tables:</span> {{ preview.tableCount }}
            </div>
            <div>
              <span class="font-medium">Seating Rows:</span> {{ preview.rowCount }}
            </div>
          </div>
          <div *ngIf="preview.description" class="mt-2">
            <span class="font-medium">Description:</span> {{ preview.description }}
          </div>
        </div>

        <!-- Import Options -->
        <div *ngIf="preview" class="mb-6">
          <label class="block text-sm font-medium mb-2">Import Mode</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="radio" 
                     [(ngModel)]="importMode" 
                     value="replace" 
                     name="importMode"
                     class="mr-2">
              <span>Replace current layout</span>
            </label>
            <label class="flex items-center">
              <input type="radio" 
                     [(ngModel)]="importMode" 
                     value="merge" 
                     name="importMode"
                     class="mr-2">
              <span>Add to current layout</span>
            </label>
          </div>
        </div>
        
        <div class="flex justify-end gap-3">
          <button 
            type="button"
            (click)="onCancel()"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button 
            *ngIf="selectedFile && !preview"
            type="button"
            (click)="loadPreview()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Preview
          </button>
          <button 
            *ngIf="preview"
            type="button"
            (click)="onImport()"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Import
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ImportDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() import = new EventEmitter<{file: File, mode: 'replace' | 'merge'}>();

  selectedFile: File | null = null;
  preview: any = null;
  importMode: 'replace' | 'merge' = 'replace';
  errorMessage = '';
  layoutData: LayoutExportData | null = null;

  constructor(private exportImportService: LayoutExportImportService) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectFile(file);
    }
  }

  private selectFile(file: File): void {
    this.selectedFile = file;
    this.preview = null;
    this.errorMessage = '';
    this.layoutData = null;
  }

  async loadPreview(): Promise<void> {
    if (!this.selectedFile) return;

    try {
      const text = await this.selectedFile.text();
      this.layoutData = JSON.parse(text) as LayoutExportData;
      this.preview = this.exportImportService.getLayoutPreview(this.layoutData);
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Invalid file format. Please select a valid .ticketseat file.';
      this.preview = null;
      this.layoutData = null;
    }
  }

  async onImport(): Promise<void> {
    if (!this.layoutData) return;

    try {
      this.exportImportService.importLayout(this.layoutData, this.importMode);
      this.close.emit();
      this.resetDialog();
    } catch (error) {
      this.errorMessage = `Import failed: ${error}`;
    }
  }

  onCancel(): void {
    this.close.emit();
    this.resetDialog();
  }

  private resetDialog(): void {
    this.selectedFile = null;
    this.preview = null;
    this.importMode = 'replace';
    this.errorMessage = '';
    this.layoutData = null;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
} 