import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Output } from '@angular/core';
import { persistenceManager } from '../../stores/persistence.manager';
import { SavedLayoutsComponent } from './saved-layouts/saved-layouts.component';
import { LayoutOptionsComponent } from './layout-options/layout-options.component';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-layout-manager',
  standalone: true,
  imports: [
    CommonModule,
    SavedLayoutsComponent,
    LayoutOptionsComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="layout-manager">
      <div class="layout-manager-content">
        <app-saved-layouts
          (loadLayout)="onLoadLayout($event)"
          (deleteLayout)="onDeleteLayout($event)"
        ></app-saved-layouts>
        <app-layout-options
          (saveLayout)="onSaveLayout($event)"
          (exportLayout)="onExportLayout()"
          (importLayout)="onImportLayout($event)"
        ></app-layout-options>
      </div>
    </div>
  `,
  styles: [`
    .layout-manager {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      padding: 16px;
    }
    
    .layout-manager-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `]
})
export class LayoutManagerComponent {
  @Output() closeModal = new EventEmitter<void>();

  private logger = new LoggerService();

  constructor() { }

  onLoadLayout(layoutId: string): void {
    try {
      persistenceManager.loadLayout(layoutId);
      this.closeModal.emit();
    } catch (error) {
      this.logger.error('Failed to load layout', error instanceof Error ? error : new Error(String(error)), { component: 'LayoutManagerComponent', action: 'onLoadLayout', layoutId });
    }
  }

  onDeleteLayout(layoutId: string): void {
    try {
      persistenceManager.deleteLayout(layoutId);
    } catch (error) {
      this.logger.error('Failed to delete layout', error instanceof Error ? error : new Error(String(error)), { component: 'LayoutManagerComponent', action: 'onDeleteLayout', layoutId });
    }
  }

  onSaveLayout(name: string): void {
    try {
      persistenceManager.saveLayout(name);
      this.closeModal.emit();
    } catch (error) {
      this.logger.error('Failed to save layout', error instanceof Error ? error : new Error(String(error)), { component: 'LayoutManagerComponent', action: 'onSaveLayout', layoutName });
    }
  }

  onExportLayout(): void {
    try {
      persistenceManager.exportToFile();
      this.closeModal.emit();
    } catch (error) {
      this.logger.error('Failed to export layout', error instanceof Error ? error : new Error(String(error)), { component: 'LayoutManagerComponent', action: 'onExportLayout' });
    }
  }

  onImportLayout(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (e.target?.result) {
          persistenceManager.importFromFile(e.target.result as string);
          this.closeModal.emit();
        }
      } catch (error) {
        this.logger.error('Failed to import layout', error instanceof Error ? error : new Error(String(error)), { component: 'LayoutManagerComponent', action: 'onImportLayout' });
      }
    };
    reader.readAsText(file);
  }
} 