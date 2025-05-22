import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { RoundTableProperties, ChairProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed } from 'mobx';
import { rootStore } from '../../stores/root.store';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-round-table',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  templateUrl: './round-table.component.html',
  styleUrls: []
})
export class RoundTableComponent {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() radius: number = 50;
  @Input() seats: number = 10;
  @Input() openSpaces: number = 0;
  @Input() name: string = 'Table';
  @Input() tableData!: RoundTableProperties;
  @Input() isSelected!: boolean;
  @Input() isPreview: boolean = false;
  @Input() rotation: number = 0;
  @Input() tableLabelVisible: boolean = true;
  @Input() chairLabelVisible: boolean = true;
  
  store = rootStore;
  
  @HostBinding('class') @Input() class: string = '';
  
  constructor() {
    makeAutoObservable(this, {
      tableStyles: computed,
      seatStyles: computed,
      x: observable,
      y: observable,
      radius: observable,
      seats: observable,
      openSpaces: observable,
      name: observable,
      rotation: observable,
      tableLabelVisible: observable,
      chairLabelVisible: observable
    });
  }

  get tableStyles() {
    if (this.tableData) {
      return {
        left: `${this.tableData.x}px`,
        top: `${this.tableData.y}px`,
        width: `${this.tableData.radius * 2}px`,
        height: `${this.tableData.radius * 2}px`,
        transform: `translate(-50%, -50%) rotate(${this.rotation || this.tableData.rotation || 0}deg)`
      };
    }
    
    return {
      left: `${this.x}px`,
      top: `${this.y}px`,
      width: `${this.radius * 2}px`,
      height: `${this.radius * 2}px`,
      transform: `translate(-50%, -50%) rotate(${this.rotation}deg)`
    };
  }

  get seatStyles() {
    const effectiveSeats = this.tableData ? this.tableData.seats : this.seats;
    const effectiveOpenSpaces = this.tableData ? this.tableData.openSpaces : this.openSpaces;
    const effectiveRadius = this.tableData ? this.tableData.radius : this.radius;
    const totalPositions = effectiveSeats + effectiveOpenSpaces;
    
    const seatsArray = [];
    if (totalPositions === 0) {
      return [];
    }

    const angleStep = 360 / totalPositions;
    const distanceToItemCenter = effectiveRadius + 20;
    
    for (let i = 0; i < totalPositions; i++) {
      const angleDegrees = angleStep * i;
      const angleRadians = angleDegrees * Math.PI / 180;
      
      const x = Math.cos(angleRadians) * distanceToItemCenter;
      const y = Math.sin(angleRadians) * distanceToItemCenter;
      
      const isSeat = i < effectiveSeats;
      const isOpenSpace = i >= effectiveSeats;

      if (isSeat) {
        const chairId = this.tableData?.chairs?.[i]?.id || `chair-${uuidv4()}`;
        const chairLabel = this.tableData?.chairs?.[i]?.label || (i + 1).toString();
        const chairPrice = this.tableData?.chairs?.[i]?.price || 0;

        seatsArray.push({
          id: chairId,
          transform: `translate(${x}px, ${y}px)`,
          isOpenSpace: false,
          label: chairLabel,
          price: chairPrice,
          isSelected: this.store.selectionStore.isItemSelected(chairId)
        });
      } else {
        seatsArray.push({
          id: `open-space-${i}`,
          transform: `translate(${x}px, ${y}px)`,
          isOpenSpace: true
        });
      }
    }
    return seatsArray;
  }

  onChairClick(event: MouseEvent, chair: any): void {
    event.stopPropagation();
    this.store.selectionStore.selectItem({
      id: chair.id,
      type: 'chair',
      label: chair.label,
      price: chair.price,
      tableId: this.tableData?.id
    });
  }
}