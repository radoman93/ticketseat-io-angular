import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolygonProperties } from '../../../services/selection.service';
import { layoutStore } from '../../../stores/layout.store';

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

      <div class="form-control">
        <label class="label">
          <span class="label-text">Label</span>
        </label>
        <input 
          type="text" 
          class="input input-bordered w-full" 
          [ngModel]="polygon.label"
          (ngModelChange)="updateProperty('label', $event)">
      </div>

      <!-- Line Thickness -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Line Thickness</span>
        </label>
        <input 
          type="number" 
          class="input input-bordered w-full" 
          min="1" 
          max="20"
          [ngModel]="polygon.thickness"
          (ngModelChange)="updateProperty('thickness', $event)">
      </div>

      <!-- Line Color -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Line Color</span>
        </label>
        <div class="flex gap-2">
          <input 
            type="color" 
            class="w-12 h-12 rounded cursor-pointer" 
            [ngModel]="polygon.strokeColor"
            (ngModelChange)="updateProperty('strokeColor', $event)">
          <input 
            type="text" 
            class="input input-bordered flex-1" 
            [ngModel]="polygon.strokeColor"
            (ngModelChange)="updateProperty('strokeColor', $event)">
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

  updateProperty(property: keyof PolygonProperties, value: any): void {
    const update = { [property]: value };
    layoutStore.updateElement(this.polygon.id, update);
  }
} 