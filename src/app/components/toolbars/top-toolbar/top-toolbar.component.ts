import { Component, HostListener } from '@angular/core';
import { gridStore } from '../../../stores/grid.store';
import { MobxAngularModule } from 'mobx-angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-top-toolbar',
  standalone: true,
  imports: [MobxAngularModule, FormsModule, CommonModule],
  templateUrl: './top-toolbar.component.html',
  styleUrl: './top-toolbar.component.css',
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateY(-10px)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      transition('void => *', [
        animate('200ms ease-out')
      ]),
      transition('* => void', [
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class TopToolbarComponent {
  // Reference to our MobX store
  store = gridStore;
  
  // Available grid size options
  gridSizes = [20, 30, 50, 75, 100];
  
  // Mobile menu state
  isMobileMenuOpen = false;
  
  // Screen size tracking
  isSmallScreen = false;
  
  constructor() {
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
    this.isSmallScreen = window.innerWidth < 768; // 768px is the md breakpoint in Tailwind
    
    // Close mobile menu when resizing to desktop
    if (!this.isSmallScreen) {
      this.isMobileMenuOpen = false;
    }
  }
}
