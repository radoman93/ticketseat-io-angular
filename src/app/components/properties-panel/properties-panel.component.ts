import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MobxAngularModule } from 'mobx-angular';
import { autorun, IReactionDisposer, action, computed } from 'mobx';
import { selectionStore } from '../../stores/selection.store';
import { layoutStore } from '../../stores/layout.store';
import { HistoryStore } from '../../stores/history.store';
import { DeleteObjectCommand } from '../../commands/delete-object.command';
import { RoundTableProperties, RectangleTableProperties, SeatingRowProperties, PolygonProperties } from '../../services/selection.service';
import { UpdateObjectCommand } from '../../commands/update-object.command';
import { LineElement, TextElement } from '../../models/elements.model';
import { debouncedPropertyUpdate, batchedPropertyUpdate } from '../../utils/debounce.util';

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
  private debouncedUpdate: (property: string, value: any) => void;

  constructor(
    private historyStore: HistoryStore
  ) {
    this.debouncedUpdate = debouncedPropertyUpdate(
      (property: string, value: any) => this.updateProperty(property, value),
      300
    );
  }

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
  get lineProperties(): LineElement {
    return this.selectedItem as LineElement;
  }

  @computed
  get polygonProperties(): PolygonProperties {
    return this.selectedItem as PolygonProperties;
  }

  @computed
  get textProperties(): TextElement {
    return this.selectedItem as TextElement;
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

    // Get the old value for undo/redo
    const oldValue = (this.selectedItem as any)[property];
    
    // Only proceed if the value actually changed
    if (oldValue === value) return;

    // Create and execute update command for undo/redo support
    const updateCommand = new UpdateObjectCommand(
      this.selectedItem.id,
      { [property]: value }
    );
    this.historyStore.executeCommand(updateCommand);
  }

  updatePropertyDebounced(property: string, value: any): void {
    this.debouncedUpdate(property, value);
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

  // Line properties
  @action incrementThickness(): void {
    if (!this.lineProperties) return;
    const newValue = Math.min(10, (this.lineProperties.thickness || 2) + 1);
    this.updateProperty('thickness', newValue);
  }

  @action decrementThickness(): void {
    if (!this.lineProperties) return;
    const newValue = Math.max(1, (this.lineProperties.thickness || 2) - 1);
    this.updateProperty('thickness', newValue);
  }

  // Polygon properties
  @action incrementBorderThickness(): void {
    if (!this.polygonProperties) return;
    const newValue = Math.min(10, (this.polygonProperties.borderThickness || 2) + 1);
    this.updateProperty('borderThickness', newValue);
  }

  @action decrementBorderThickness(): void {
    if (!this.polygonProperties) return;
    const newValue = Math.max(0, (this.polygonProperties.borderThickness || 2) - 1);
    this.updateProperty('borderThickness', newValue);
  }

  @action incrementFillOpacity(): void {
    if (!this.polygonProperties) return;
    const newValue = Math.min(1, (this.polygonProperties.fillOpacity || 0.3) + 0.1);
    this.updateProperty('fillOpacity', Math.round(newValue * 10) / 10);
  }

  @action decrementFillOpacity(): void {
    if (!this.polygonProperties) return;
    const newValue = Math.max(0, (this.polygonProperties.fillOpacity || 0.3) - 0.1);
    this.updateProperty('fillOpacity', Math.round(newValue * 10) / 10);
  }

  // Text-specific methods
  @action incrementFontSize(): void {
    if (!this.textProperties) return;
    const newValue = Math.min(72, (this.textProperties.fontSize || 14) + 2);
    this.updateProperty('fontSize', newValue);
  }

  @action decrementFontSize(): void {
    if (!this.textProperties) return;
    const newValue = Math.max(8, (this.textProperties.fontSize || 14) - 2);
    this.updateProperty('fontSize', newValue);
  }
}