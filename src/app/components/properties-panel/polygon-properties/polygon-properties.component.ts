import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolygonProperties } from '../../../services/selection.service';
import { HistoryStore } from '../../../stores/history.store';
import { UpdateObjectCommand } from '../../../commands/update-object.command';

@Component({
  selector: 'app-polygon-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Name/Label -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Name</span>
        </label>
        <input 
          type="text" 
          class="input input-bordered w-full" 
          [ngModel]="polygon.name"
          (ngModelChange)="updateProperty('name', $event)">
      </div>


      <!-- Border Thickness -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Border Thickness</span>
        </label>
        <input 
          type="number" 
          class="input input-bordered w-full" 
          min="0" 
          max="10"
          [ngModel]="polygon.borderThickness"
          (ngModelChange)="updateProperty('borderThickness', $event)">
      </div>

      <!-- Border Color -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Border Color</span>
        </label>
        <div class="flex gap-2">
          <input 
            type="color" 
            class="w-12 h-12 rounded cursor-pointer" 
            [ngModel]="polygon.borderColor"
            (ngModelChange)="updateProperty('borderColor', $event)">
          <input 
            type="text" 
            class="input input-bordered flex-1" 
            [ngModel]="polygon.borderColor"
            (ngModelChange)="updateProperty('borderColor', $event)">
        </div>
      </div>

      <!-- Fill Color -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Fill Color</span>
        </label>
        <div class="flex gap-2">
          <input 
            type="color" 
            class="w-12 h-12 rounded cursor-pointer" 
            [ngModel]="polygon.fillColor"
            (ngModelChange)="updateProperty('fillColor', $event)">
          <input 
            type="text" 
            class="input input-bordered flex-1" 
            [ngModel]="polygon.fillColor"
            (ngModelChange)="updateProperty('fillColor', $event)">
        </div>
      </div>

      <!-- Fill Opacity -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Fill Opacity</span>
        </label>
        <input 
          type="range" 
          class="range range-primary" 
          min="0" 
          max="1" 
          step="0.1"
          [ngModel]="polygon.fillOpacity"
          (ngModelChange)="updateProperty('fillOpacity', $event)">
        <div class="text-xs text-gray-500 mt-1">{{polygon.fillOpacity}}</div>
      </div>

      <!-- Show Border -->
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Show Border</span>
          <input 
            type="checkbox" 
            class="checkbox checkbox-primary" 
            [ngModel]="polygon.showBorder"
            (ngModelChange)="updateProperty('showBorder', $event)">
        </label>
      </div>

      <!-- Points Count -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Points</span>
        </label>
        <input 
          type="text" 
          class="input input-bordered w-full" 
          [value]="polygon.points.length"
          disabled>
      </div>
    </div>
  `
})
export class PolygonPropertiesComponent {
  @Input() polygon!: PolygonProperties;

  constructor(private historyStore: HistoryStore) {}

  updateProperty(property: keyof PolygonProperties, value: any): void {
    if (!this.polygon) return;

    // Convert string numbers to actual numbers
    if (typeof value === 'string' && !isNaN(Number(value))) {
      value = Number(value);
    }

    // Get the old value for undo/redo
    const oldValue = (this.polygon as any)[property];
    
    // Only proceed if the value actually changed
    if (oldValue === value) return;

    // Create and execute update command for undo/redo support
    const updateCommand = new UpdateObjectCommand(
      this.polygon.id,
      { [property]: value }
    );
    this.historyStore.executeCommand(updateCommand);
  }
} 