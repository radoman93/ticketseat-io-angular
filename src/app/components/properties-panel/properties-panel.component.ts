import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MobxAngularModule } from 'mobx-angular';
import { autorun, IReactionDisposer, action, computed } from 'mobx';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { HistoryStore } from '../../stores/history.store';
import { DeleteObjectCommand } from '../../commands/delete-object.command';
import { PolygonProperties, RoundTableProperties, RectangleTableProperties, SeatingRowProperties, LineProperties } from '../../services/selection.service';
import { UpdateObjectCommand } from '../../commands/update-object.command';

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
    // Set up autorun to track changes and sync selection with layout
    this.disposer = autorun(() => {
      // If we have a selected item, make sure we're getting the latest version from layout store
      if (this.selectionStore.selectedItem) {
        const freshItem = this.layoutStore.getElementById(this.selectionStore.selectedItem.id);
        if (freshItem && freshItem !== this.selectionStore.selectedItem) {
          // Update the selection with the fresh item from layout store
          this.selectionStore.selectItem(freshItem);
          
          // Ensure visibility properties are set to true
          if (freshItem.type === 'roundTable' || freshItem.type === 'rectangleTable') {
            if (freshItem.tableLabelVisible === undefined) {
              this.updateProperty('tableLabelVisible', true);
            }
            if (freshItem.chairLabelVisible === undefined) {
              this.updateProperty('chairLabelVisible', true);
            }
          } else if (freshItem.type === 'seatingRow' || freshItem.type === 'segmentedSeatingRow') {
            if (freshItem.rowLabelVisible === undefined) {
              this.updateProperty('rowLabelVisible', true);
            }
            if (freshItem.chairLabelVisible === undefined) {
              this.updateProperty('chairLabelVisible', true);
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.disposer) {
      this.disposer();
    }
  }

  @computed
  get selectedItem() {
    if (!this.selectionStore.selectedItem) return null;
    // Always get the fresh version from layout store
    return this.layoutStore.getElementById(this.selectionStore.selectedItem.id) || this.selectionStore.selectedItem;
  }
  
  @computed
  get roundTableProperties(): RoundTableProperties {
    return this.selectedItem as RoundTableProperties;
  }
  
  @computed
  get rectangleTableProperties(): RectangleTableProperties {
    return this.selectedItem as RectangleTableProperties;
  }
  
  @computed
  get seatingRowProperties(): SeatingRowProperties {
    return this.selectedItem as SeatingRowProperties;
  }
  
  @computed
  get segmentedSeatingRowProperties(): SeatingRowProperties {
    return this.selectedItem as SeatingRowProperties;
  }
  
  @computed
  get lineProperties(): LineProperties {
    return this.selectedItem as LineProperties;
  }

  @action
  updateProperty(property: string, value: any): void {
    if (!this.selectedItem) return;
    
    // Convert string numbers to actual numbers
    if (typeof value === 'string' && !isNaN(Number(value))) {
      value = Number(value);
    }
    
    // Ensure visibility properties are set to true by default
    if ((property === 'tableLabelVisible' || property === 'chairLabelVisible' || property === 'rowLabelVisible') && value === undefined) {
      value = true;
    }
    
    // Update the element in the layout store
    const updatedElement = this.layoutStore.updateElement(this.selectedItem.id, { [property]: value });
    
    // Update the selection with the new element reference
    if (updatedElement) {
      this.selectionStore.selectItem(updatedElement);
    }
  }

  @action
  deleteElement(): void {
    if (this.selectedItem) {
      const cmd = new DeleteObjectCommand(this.selectedItem);
      this.historyStore.executeCommand(cmd);
    }
  }
  
  // Property modifiers
  
  // Round Table
  @action incrementRadius(): void {
    if (!this.roundTableProperties) return;
    const newValue = Math.min(100, (this.roundTableProperties.radius || 0) + 5);
    this.updateProperty('radius', newValue);
  }
  
  @action decrementRadius(): void {
    if (!this.roundTableProperties) return;
    const newValue = Math.max(20, (this.roundTableProperties.radius || 0) - 5);
    this.updateProperty('radius', newValue);
  }
  
  @action incrementChairs(): void {
    if (!this.roundTableProperties) return;
    const newValue = Math.min(20, (this.roundTableProperties.seats || 0) + 1);
    this.updateProperty('seats', newValue);
  }
  
  @action decrementChairs(): void {
    if (!this.roundTableProperties) return;
    const newValue = Math.max(4, (this.roundTableProperties.seats || 0) - 1);
    this.updateProperty('seats', newValue);
  }
  
  @action incrementOpenSpaces(): void {
    if (!this.roundTableProperties) return;
    const newValue = Math.min(20, (this.roundTableProperties.openSpaces || 0) + 1);
    this.updateProperty('openSpaces', newValue);
  }
  
  @action decrementOpenSpaces(): void {
    if (!this.roundTableProperties) return;
    const newValue = Math.max(0, (this.roundTableProperties.openSpaces || 0) - 1);
    this.updateProperty('openSpaces', newValue);
  }
  
  // Rectangle Table
  @action incrementWidth(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.min(300, (this.rectangleTableProperties.width || 0) + 10);
    this.updateProperty('width', newValue);
  }
  
  @action decrementWidth(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.max(60, (this.rectangleTableProperties.width || 0) - 10);
    this.updateProperty('width', newValue);
  }
  
  @action incrementHeight(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.min(200, (this.rectangleTableProperties.height || 0) + 10);
    this.updateProperty('height', newValue);
  }
  
  @action decrementHeight(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.max(40, (this.rectangleTableProperties.height || 0) - 10);
    this.updateProperty('height', newValue);
  }
  
  @action incrementUpChairs(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.min(20, (this.rectangleTableProperties.upChairs || 0) + 1);
    this.updateProperty('upChairs', newValue);
  }
  
  @action decrementUpChairs(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.max(0, (this.rectangleTableProperties.upChairs || 0) - 1);
    this.updateProperty('upChairs', newValue);
  }
  
  @action incrementDownChairs(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.min(20, (this.rectangleTableProperties.downChairs || 0) + 1);
    this.updateProperty('downChairs', newValue);
  }
  
  @action decrementDownChairs(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.max(0, (this.rectangleTableProperties.downChairs || 0) - 1);
    this.updateProperty('downChairs', newValue);
  }
  
  @action incrementLeftChairs(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.min(20, (this.rectangleTableProperties.leftChairs || 0) + 1);
    this.updateProperty('leftChairs', newValue);
  }
  
  @action decrementLeftChairs(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.max(0, (this.rectangleTableProperties.leftChairs || 0) - 1);
    this.updateProperty('leftChairs', newValue);
  }
  
  @action incrementRightChairs(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.min(20, (this.rectangleTableProperties.rightChairs || 0) + 1);
    this.updateProperty('rightChairs', newValue);
  }
  
  @action decrementRightChairs(): void {
    if (!this.rectangleTableProperties) return;
    const newValue = Math.max(0, (this.rectangleTableProperties.rightChairs || 0) - 1);
    this.updateProperty('rightChairs', newValue);
  }
  
  @computed
  get totalChairsRect(): number {
    if (!this.rectangleTableProperties) return 0;
    const props = this.rectangleTableProperties;
    return (props.upChairs || 0) + (props.downChairs || 0) + (props.leftChairs || 0) + (props.rightChairs || 0);
  }

  // Common
  @action incrementRotation(): void {
    if (!this.selectedItem) return;
    const currentRotation = (this.selectedItem as any).rotation || 0;
    this.updateProperty('rotation', currentRotation + 15);
  }
  
  @action decrementRotation(): void {
    if (!this.selectedItem) return;
    const currentRotation = (this.selectedItem as any).rotation || 0;
    this.updateProperty('rotation', currentRotation - 15);
  }
  
  // Line
  @action incrementLineThickness(): void { 
    if (!this.lineProperties || !this.lineProperties.thickness) return;
    const newValue = Math.min(10, this.lineProperties.thickness + 1);
    this.updateProperty('thickness', newValue);
  }
  
  @action decrementLineThickness(): void { 
    if (!this.lineProperties || !this.lineProperties.thickness) return;
    const newValue = Math.max(1, this.lineProperties.thickness - 1);
    this.updateProperty('thickness', newValue);
  }
}