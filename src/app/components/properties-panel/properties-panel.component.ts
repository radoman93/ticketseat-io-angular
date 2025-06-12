import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MobxAngularModule } from 'mobx-angular';
import { autorun, IReactionDisposer } from 'mobx';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { HistoryStore } from '../../stores/history.store';
import { DeleteObjectCommand } from '../../commands/delete-object.command';
import { PolygonPropertiesComponent } from './polygon-properties/polygon-properties.component';
import { PolygonProperties } from '../../services/selection.service';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MobxAngularModule,
    PolygonPropertiesComponent
  ],
  template: `
    <div class="bg-white border-l border-gray-200 w-80 overflow-y-auto">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold">Properties</h2>
      </div>

      <ng-container *ngIf="selectedItem">
        <app-polygon-properties
          *ngIf="selectedItem.type === 'polygon'"
          [polygon]="$any(selectedItem)">
        </app-polygon-properties>
        
        <!-- Basic properties for other types -->
        <div *ngIf="selectedItem.type !== 'polygon'" class="p-4 space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Type</span>
            </label>
            <input type="text" class="input input-bordered w-full" [value]="selectedItem.type" disabled>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Name</span>
            </label>
            <input 
              type="text" 
              class="input input-bordered w-full" 
              [ngModel]="selectedItem['name']"
              (ngModelChange)="updateProperty('name', $event)">
          </div>

          <div class="form-control">
            <button class="btn btn-error w-full" (click)="deleteElement()">
              Delete Element
            </button>
          </div>
        </div>
      </ng-container>

      <div *ngIf="!selectedItem" class="p-4 text-center text-gray-500">
        No element selected
      </div>
    </div>
  `
})
export class PropertiesPanelComponent implements OnInit, OnDestroy {
  selectionStore = selectionStore;
  layoutStore = layoutStore;
  
  private disposer: IReactionDisposer | null = null;

  constructor(
    private historyStore: HistoryStore
  ) {}

  ngOnInit(): void {
    // No need for complex autorun since we're using the getter
  }

  ngOnDestroy(): void {
    if (this.disposer) {
      this.disposer();
    }
  }

  get selectedItem() {
    return this.selectionStore.selectedItem;
  }

  updateProperty(property: string, value: any): void {
    if (!this.selectedItem) return;
    
    const updates: any = {};
    updates[property] = value;
    this.layoutStore.updateElement(this.selectedItem.id, updates);
  }

  deleteElement(): void {
    if (this.selectedItem) {
      const cmd = new DeleteObjectCommand(this.selectedItem);
      this.historyStore.executeCommand(cmd);
    }
  }
} 