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
import { PolygonProperties, RoundTableProperties, RectangleTableProperties, SeatingRowProperties, LineProperties } from '../../services/selection.service';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MobxAngularModule
  ],
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.css']
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
  
  get roundTableProperties(): RoundTableProperties {
    return this.selectedItem as RoundTableProperties;
  }
  
  get rectangleTableProperties(): RectangleTableProperties {
    return this.selectedItem as RectangleTableProperties;
  }
  
  get seatingRowProperties(): SeatingRowProperties {
    return this.selectedItem as SeatingRowProperties;
  }
  
  get segmentedSeatingRowProperties(): SeatingRowProperties {
    return this.selectedItem as SeatingRowProperties;
  }
  
  get lineProperties(): LineProperties {
    return this.selectedItem as LineProperties;
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
  
  // Property modifiers
  
  // Round Table
  incrementRadius() { this.updateProperty('radius', this.roundTableProperties.radius + 5); }
  decrementRadius() { this.updateProperty('radius', this.roundTableProperties.radius - 5); }
  incrementChairs() { this.updateProperty('seats', this.roundTableProperties.seats + 1); }
  decrementChairs() { this.updateProperty('seats', this.roundTableProperties.seats - 1); }
  incrementOpenSpaces() { this.updateProperty('openSpaces', this.roundTableProperties.openSpaces + 1); }
  decrementOpenSpaces() { this.updateProperty('openSpaces', this.roundTableProperties.openSpaces - 1); }
  
  // Rectangle Table
  incrementWidth() { this.updateProperty('width', this.rectangleTableProperties.width + 10); }
  decrementWidth() { this.updateProperty('width', this.rectangleTableProperties.width - 10); }
  incrementHeight() { this.updateProperty('height', this.rectangleTableProperties.height + 10); }
  decrementHeight() { this.updateProperty('height', this.rectangleTableProperties.height - 10); }
  incrementUpChairs() { this.updateProperty('upChairs', this.rectangleTableProperties.upChairs + 1); }
  decrementUpChairs() { this.updateProperty('upChairs', this.rectangleTableProperties.upChairs - 1); }
  incrementDownChairs() { this.updateProperty('downChairs', this.rectangleTableProperties.downChairs + 1); }
  decrementDownChairs() { this.updateProperty('downChairs', this.rectangleTableProperties.downChairs - 1); }
  incrementLeftChairs() { this.updateProperty('leftChairs', this.rectangleTableProperties.leftChairs + 1); }
  decrementLeftChairs() { this.updateProperty('leftChairs', this.rectangleTableProperties.leftChairs - 1); }
  incrementRightChairs() { this.updateProperty('rightChairs', this.rectangleTableProperties.rightChairs + 1); }
  decrementRightChairs() { this.updateProperty('rightChairs', this.rectangleTableProperties.rightChairs - 1); }
  
  get totalChairsRect() {
    const props = this.rectangleTableProperties;
    return (props.upChairs || 0) + (props.downChairs || 0) + (props.leftChairs || 0) + (props.rightChairs || 0);
  }

  // Common
  incrementRotation() {
    const currentRotation = (this.selectedItem as any).rotation || 0;
    this.updateProperty('rotation', currentRotation + 15);
  }
  decrementRotation() {
    const currentRotation = (this.selectedItem as any).rotation || 0;
    this.updateProperty('rotation', currentRotation - 15);
  }
  
  // Line
  incrementLineThickness() { 
    if (this.lineProperties && this.lineProperties.thickness) {
      this.updateProperty('thickness', this.lineProperties.thickness + 1); 
    }
  }
  decrementLineThickness() { 
    if (this.lineProperties && this.lineProperties.thickness) {
      this.updateProperty('thickness', this.lineProperties.thickness - 1); 
    }
  }
}