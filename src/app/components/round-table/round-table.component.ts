import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import { RoundTableProperties } from '../../services/selection.service';
import { makeAutoObservable, observable, computed } from 'mobx';
import { rootStore } from '../../stores/root.store';

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
  
  // For accessing the MobX stores
  store = rootStore;
  
  // Allow passing class for preview styling
  @HostBinding('class') @Input() class: string = '';
  
  constructor() {
    // Make this component's properties observable for MobX
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
      tableLabelVisible: observable
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
      return []; // Avoid division by zero if no seats or open spaces
    }

    const angleStep = 360 / totalPositions;
    
    // Calculate the distance from the table's center to the center of each seat/open space.
    // Assuming seats/open spaces are 20px in diameter (10px radius).
    // A 20px offset from the table's radius to the seat's center will create a 10px gap
    // between the table's edge and the seat's inner edge.
    const distanceToItemCenter = effectiveRadius + 20; 
    
    for (let i = 0; i < totalPositions; i++) {
      const angleDegrees = angleStep * i;
      const angleRadians = angleDegrees * Math.PI / 180;
      
      // Calculate the x and y coordinates for the center of the seat/open space
      const x = Math.cos(angleRadians) * distanceToItemCenter;
      const y = Math.sin(angleRadians) * distanceToItemCenter;
      
      const isOpenSpace = i >= effectiveSeats;
      
      seatsArray.push({
        // The transform should move the center of the seat item to (x,y)
        // The HTML structure already centers the item before this transform.
        transform: `translate(${x}px, ${y}px)`, 
        isOpenSpace: isOpenSpace
      });
    }
    return seatsArray;
  }

  // Will add more logic later as needed
} 