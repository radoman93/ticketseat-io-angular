import { Component, OnInit } from '@angular/core';
import { gridStore } from '../../../stores/grid.store';
import { layoutStore } from '../../../stores/layout.store';
import { selectionStore } from '../../../stores/selection.store';
import { snappingStore } from '../../../stores/snapping.store';
import { HistoryStore } from '../../../stores/history.store';
import { MobxAngularModule } from 'mobx-angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ExportDialogComponent } from '../../export-dialog/export-dialog.component';
import { ImportDialogComponent } from '../../import-dialog/import-dialog.component';

@Component({
  selector: 'app-top-toolbar',
  standalone: true,
  imports: [MobxAngularModule, FormsModule, CommonModule, ExportDialogComponent, ImportDialogComponent],
  templateUrl: './top-toolbar.component.html',
  styleUrl: './top-toolbar.component.css'
})
export class TopToolbarComponent implements OnInit {
  // Reference to our MobX stores
  store = gridStore;
  layoutStore = layoutStore;
  selectionStore = selectionStore;
  snappingStore = snappingStore;
  historyStore: HistoryStore;
  
  gridSizes = [25, 50, 75, 100];
  
  // Mobile menu state
  isMobileMenuOpen = false;
  
  // Dialog states
  showExportDialog = false;
  showImportDialog = false;

  constructor(historyStore: HistoryStore) {
    this.historyStore = historyStore;
  }

  ngOnInit(): void {
    // Component initialization
  }

  updateGridSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.store.setGridSize(Number(target.value));
  }

  toggleMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  openExportDialog(): void {
    this.showExportDialog = true;
    this.isMobileMenuOpen = false; // Close mobile menu if open
  }

  openImportDialog(): void {
    this.showImportDialog = true;
    this.isMobileMenuOpen = false; // Close mobile menu if open
  }
}
