import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MobxAngularModule } from 'mobx-angular';
import { rootStore } from '../../stores/root.store';

@Component({
  selector: 'app-chair-properties-panel',
  standalone: true,
  imports: [CommonModule, MobxAngularModule, FormsModule],
  template: `
    <div *mobxAutorun>
      <div *ngIf="store.chairStore.selectedChair"
           class="chair-properties-panel bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-64"
           [style.left]="(store.chairStore.panelPosition?.x || 20) + 'px'"
           [style.top]="(store.chairStore.panelPosition?.y || 20) + 'px'">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Chair Properties</h3>
          <button (click)="closePanel()" 
                  class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <!-- Chair ID (read-only) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Chair ID</label>
            <input 
              type="text" 
              [value]="store.chairStore.selectedChair.id" 
              readonly
              class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600 cursor-not-allowed">
          </div>

          <!-- Chair Label (editable) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Chair Label</label>
            <input 
              type="text" 
              [value]="store.chairStore.selectedChair.label"
              (input)="onLabelChange($event)"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter chair label">
          </div>

          <!-- Chair Price (editable with currency formatting) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Chair Price</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 text-sm">$</span>
              <input 
                type="number" 
                [value]="store.chairStore.selectedChair.price"
                (input)="onPriceChange($event)"
                min="0"
                step="0.01"
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00">
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chair-properties-panel {
      position: fixed;
      z-index: 1000;
      max-width: 256px;
      animation: fadeIn 0.2s ease-in-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class ChairPropertiesPanelComponent {
  store = rootStore;

  onLabelChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedChair = this.store.chairStore.selectedChair;
    if (selectedChair) {
      this.store.chairStore.updateChair(selectedChair.id, { 
        label: input.value 
      });
    }
  }

  onPriceChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedChair = this.store.chairStore.selectedChair;
    if (selectedChair) {
      const price = parseFloat(input.value) || 0;
      this.store.chairStore.updateChair(selectedChair.id, { 
        price: price 
      });
    }
  }

  closePanel(): void {
    this.store.chairStore.deselectChair();
  }
} 