import { Component, HostListener, OnInit } from '@angular/core';
import { gridStore } from '../../../stores/grid.store';
import { MobxAngularModule } from 'mobx-angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-toolbar',
  standalone: true,
  imports: [MobxAngularModule, FormsModule, CommonModule],
  templateUrl: './top-toolbar.component.html',
  styleUrl: './top-toolbar.component.css'
})
export class TopToolbarComponent implements OnInit {
  // Reference to our MobX store
  store = gridStore;
  
  // Available grid size options
  gridSizes = [20, 30, 50, 75, 100];
  
  // Mobile menu state
  isMobileMenuOpen = false;
  
  // Screen size tracking
  isSmallScreen = false;
  
  ngOnInit() {
    this.checkScreenSize();
  }
  
  // Toggle mobile menu
  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  
  // Method to update grid size
  updateGridSize(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.store.setGridSize(Number(select.value));
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
}
