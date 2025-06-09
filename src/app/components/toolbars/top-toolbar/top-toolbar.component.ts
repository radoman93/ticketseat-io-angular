import { Component, HostListener, OnInit } from '@angular/core';
import { gridStore } from '../../../stores/grid.store';
import { toolStore } from '../../../stores/tool.store';
import { layoutStore } from '../../../stores/layout.store';
import { selectionStore } from '../../../stores/selection.store';
import { HistoryStore } from '../../../stores/history.store';
import { MobxAngularModule } from 'mobx-angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToolType } from '../../../services/tool.service';
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
  toolStore = toolStore;
  layoutStore = layoutStore;
  selectionStore = selectionStore;
  historyStore: HistoryStore;
  
  // Make the ToolType enum available in the template
  ToolType = ToolType;
  
  // Available grid size options
  gridSizes = [10, 20, 30, 40, 50, 75, 100];
  
  // Mobile menu state
  isMobileMenuOpen = false;
  
  // Screen size tracking
  isSmallScreen = false;
  
  // Dialog states
  showExportDialog = false;
  showImportDialog = false;
  
  constructor(historyStore: HistoryStore) {
    this.historyStore = historyStore;
  }
  
  ngOnInit() {
    this.checkScreenSize();
  }
  
  // Toggle mobile menu
  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  
  // Method to update grid size
  updateGridSize(event: any) {
    const newSize = parseInt(event.target.value, 10);
    this.store.setGridSize(newSize);
  }
  
  // Listen for window resize events
  @HostListener('window:resize')
  checkScreenSize() {
    const prevIsSmallScreen = this.isSmallScreen;
    this.isSmallScreen = window.innerWidth < 768; // 768px is the md breakpoint in Tailwind
    
    // Close mobile menu when resizing to desktop
    if (prevIsSmallScreen && !this.isSmallScreen) {
      this.isMobileMenuOpen = false;
    }
  }
  
  // Close menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close the menu if the click is outside the menu and hamburger button
    const clickedElement = event.target as HTMLElement;
    const isMenuClick = clickedElement.closest('.mobile-menu-container') !== null;
    const isHamburgerClick = clickedElement.closest('.hamburger-button') !== null;
    
    if (this.isMobileMenuOpen && !isMenuClick && !isHamburgerClick) {
      this.isMobileMenuOpen = false;
    }
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
