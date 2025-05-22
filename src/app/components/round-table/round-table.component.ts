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
  @Input() name: string = 'Table';
  @Input() tableData!: RoundTableProperties;
  @Input() isSelected!: boolean;
  @Input() isPreview: boolean = false;
  @Input() rotation: number = 0;
  
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
      name: observable,
      rotation: observable
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
    const effectiveRadius = this.tableData ? this.tableData.radius : this.radius;
    
    const seatsArray = [];
    const angleStep = 360 / effectiveSeats;
    for (let i = 0; i < effectiveSeats; i++) {
      const angle = angleStep * i;
      // Adjust positioning to be around the circumference
      const x = Math.cos(angle * Math.PI / 180) * (effectiveRadius * 0.75); // 0.75 to bring seats a bit inward
      const y = Math.sin(angle * Math.PI / 180) * (effectiveRadius * 0.75);
      seatsArray.push({
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` // Center seats
      });
    }
    return seatsArray;
  }

  // Will add more logic later as needed
} 