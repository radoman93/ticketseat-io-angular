import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { rootStore } from '../../stores/root.store';
import { MobxErrorService } from '../../services/mobx-error.service';

@Component({
  selector: 'app-application-controls',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  template: `
    <div class="fixed bottom-4 left-4 z-50 flex flex-col gap-2" *mobxAutorun>
      <!-- Reset button -->
      <button 
        (click)="resetApplication()" 
        class="btn btn-sm btn-outline">
        Reset Layout
      </button>
      
      <!-- Application status badge -->
      <div class="bg-gray-100 rounded-md p-2 text-xs">
        <div class="flex flex-col gap-1">
          <div class="flex justify-between">
            <span>Elements:</span> 
            <span class="font-semibold">{{ store.layoutStore.tableCount }}</span>
          </div>
          <div class="flex justify-between">
            <span>Selected:</span>
            <span class="font-semibold">{{ store.selectionStore.hasSelection ? 'Yes' : 'No' }}</span>
          </div>
          <div class="flex justify-between">
            <span>Mode:</span>
            <span class="font-semibold">MobX</span>
          </div>
          <div class="flex justify-between">
            <span>Tool:</span>
            <span class="font-semibold">{{ store.toolStore.activeTool }}</span>
          </div>
        </div>
      </div>
      
      <!-- MobX Errors -->
      <div *ngIf="mobxErrorService.errors.length > 0" class="bg-red-100 rounded-md p-2 text-xs max-w-56">
        <div class="font-bold text-red-700 mb-1 flex justify-between">
          <span>MobX Errors</span>
          <button (click)="clearErrors()" class="text-xs text-red-700 hover:text-red-900">
            Clear
          </button>
        </div>
        <div *ngFor="let error of mobxErrorService.errors.slice(-3)" class="text-red-700 mb-1 text-xs truncate">
          {{ error.message | slice:0:30 }}...
        </div>
        <div *ngIf="mobxErrorService.errors.length > 3" class="text-xs text-red-500">
          +{{ mobxErrorService.errors.length - 3 }} more errors
        </div>
      </div>
      
      <!-- Force an error (test button) -->
      <button 
        (click)="forceError()" 
        class="btn btn-xs btn-error text-xs">
        Test MobX Error
      </button>
    </div>
  `,
  styles: []
})
export class ApplicationControlsComponent {
  store = rootStore;
  
  constructor(
    public mobxErrorService: MobxErrorService
  ) {}
  
  resetApplication() {
    this.store.resetState();
  }
  
  clearErrors() {
    this.mobxErrorService.clearErrors();
  }
  
  // Function to deliberately trigger a MobX error (useful for testing)
  forceError() {
    try {
      // This will cause an error since we're modifying state outside an action
      this.store.layoutStore.elements.push({} as any);
    } catch (error: any) {
      this.mobxErrorService.logError({
        id: Date.now().toString(),
        message: error.message,
        timestamp: new Date(),
        context: 'Manually triggered error'
      });
    }
  }
} 