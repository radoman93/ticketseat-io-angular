import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoundTableProperties } from '../../services/selection.service';

@Component({
  selector: 'app-round-table',
  standalone: true,
  imports: [CommonModule],
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
  
  // Allow passing class for preview styling
  @HostBinding('class') @Input() class: string = '';
  
  constructor() { }

  get tableStyles() {
    if (!this.tableData) {
      return {};
    }
    return {
      left: `${this.tableData.x}px`,
      top: `${this.tableData.y}px`,
      width: `${this.tableData.radius * 2}px`,
      height: `${this.tableData.radius * 2}px`,
      transform: `translate(-50%, -50%) rotate(${this.rotation}deg)`
    };
  }

  get seatStyles() {
    if (!this.tableData) {
      return [];
    }
    const seatsArray = [];
    const angleStep = 360 / this.tableData.seats;
    for (let i = 0; i < this.tableData.seats; i++) {
      const angle = angleStep * i;
      // Adjust positioning to be around the circumference
      const x = Math.cos(angle * Math.PI / 180) * (this.tableData.radius * 0.75); // 0.75 to bring seats a bit inward
      const y = Math.sin(angle * Math.PI / 180) * (this.tableData.radius * 0.75);
      seatsArray.push({
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` // Center seats
      });
    }
    return seatsArray;
  }

  // Will add more logic later as needed
} 