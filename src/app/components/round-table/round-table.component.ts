import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-round-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './round-table.component.html'
})
export class RoundTableComponent {
  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() radius: number = 50;
  @Input() seats: number = 10;
  @Input() name: string = 'Table';
  
  // Allow passing class for preview styling
  @HostBinding('class') @Input() class: string = '';
  
  // Will add more logic later as needed
} 