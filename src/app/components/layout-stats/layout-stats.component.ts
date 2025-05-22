import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { rootStore } from '../../stores/root.store';
import { LayoutMetrics } from '../../stores/derived/layout-metrics.store';
import { autorun, IReactionDisposer } from 'mobx';

@Component({
  selector: 'app-layout-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <mat-card class="stats-card">
      <mat-card-header>
        <mat-card-title>Layout Statistics</mat-card-title>
        <mat-card-subtitle>Real-time metrics</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <mat-list>
          <mat-list-item>
            <mat-icon matListItemIcon>table_restaurant</mat-icon>
            <div matListItemTitle>Tables</div>
            <div matListItemLine>{{ metrics.totalTables }}</div>
          </mat-list-item>
          
          <mat-list-item>
            <mat-icon matListItemIcon>chair</mat-icon>
            <div matListItemTitle>Seats</div>
            <div matListItemLine>{{ metrics.totalSeats }}</div>
          </mat-list-item>
          
          <mat-list-item>
            <mat-icon matListItemIcon>person</mat-icon>
            <div matListItemTitle>Total Capacity</div>
            <div matListItemLine>{{ metrics.totalCapacity }}</div>
          </mat-list-item>
          
          <mat-divider></mat-divider>
          
          <mat-list-item>
            <mat-icon matListItemIcon>view_quilt</mat-icon>
            <div matListItemTitle>Layout Area</div>
            <div matListItemLine>{{ getFormattedArea() }} sq units</div>
          </mat-list-item>
          
          <mat-list-item>
            <mat-icon matListItemIcon>density_medium</mat-icon>
            <div matListItemTitle>Density</div>
            <div matListItemLine>{{ getFormattedDensity() }}</div>
          </mat-list-item>
          
          <mat-divider></mat-divider>
          
          <h3 matSubheader>Table Types</h3>
          <ng-container *ngFor="let type of getTableTypes()">
            <mat-list-item>
              <div matListItemTitle>{{ formatTableType(type.name) }}</div>
              <div matListItemLine>{{ type.count }}</div>
            </mat-list-item>
          </ng-container>
        </mat-list>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-button color="primary" (click)="exportStats()">
          <mat-icon>download</mat-icon> Export Stats
        </button>
        <button mat-button color="primary" (click)="saveLayout()">
          <mat-icon>save</mat-icon> Save Layout
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .stats-card {
      max-width: 300px;
      margin: 16px;
    }
    
    mat-card-content {
      max-height: 400px;
      overflow-y: auto;
    }
  `]
})
export class LayoutStatsComponent implements OnInit, OnDestroy {
  // The current metrics
  metrics: LayoutMetrics = {
    totalTables: 0,
    totalSeats: 0,
    totalCapacity: 0,
    tableTypes: {},
    averageSeatsPerTable: 0,
    density: 0,
    boundingBox: { x: 0, y: 0, width: 0, height: 0 }
  };
  
  // MobX reaction disposer
  private disposer: IReactionDisposer | null = null;
  
  constructor() {}
  
  ngOnInit(): void {
    // Use MobX autorun to update the component when metrics change
    this.disposer = autorun(() => {
      this.metrics = rootStore.layoutMetricsStore.metrics;
    });
  }
  
  ngOnDestroy(): void {
    // Clean up the reaction when component is destroyed
    if (this.disposer) {
      this.disposer();
    }
  }
  
  /**
   * Format the layout area for display
   */
  getFormattedArea(): string {
    const area = this.metrics.boundingBox.width * this.metrics.boundingBox.height;
    return area.toFixed(0);
  }
  
  /**
   * Format the density for display
   */
  getFormattedDensity(): string {
    return this.metrics.density.toFixed(3);
  }
  
  /**
   * Get table types as an array for display
   */
  getTableTypes(): { name: string, count: number }[] {
    return Object.entries(this.metrics.tableTypes).map(([name, count]) => ({
      name,
      count
    }));
  }
  
  /**
   * Format table type name for display
   */
  formatTableType(type: string): string {
    return type
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  }
  
  /**
   * Export statistics to CSV
   */
  exportStats(): void {
    // Create CSV content
    const csvContent = [
      'Statistic,Value',
      `Total Tables,${this.metrics.totalTables}`,
      `Total Seats,${this.metrics.totalSeats}`,
      `Total Capacity,${this.metrics.totalCapacity}`,
      `Average Seats per Table,${this.metrics.averageSeatsPerTable.toFixed(1)}`,
      `Layout Area,${this.getFormattedArea()}`,
      `Density,${this.getFormattedDensity()}`,
      '',
      'Table Types',
      ...this.getTableTypes().map(t => `${this.formatTableType(t.name)},${t.count}`)
    ].join('\n');
    
    // Create a blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `layout-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Save the current layout
   */
  saveLayout(): void {
    const name = prompt('Enter a name for this layout:');
    if (name) {
      rootStore.saveCurrentLayout(name);
    }
  }
} 