import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from '../grid/grid.component';
import { MainToolbarComponent } from '../toolbars/main-toolbar/main-toolbar.component';
import { TopToolbarComponent } from '../toolbars/top-toolbar/top-toolbar.component';
import { MobxAngularModule } from 'mobx-angular';
import { PropertiesPanelComponent } from '../properties-panel/properties-panel.component';
import { ChairPropertiesPanelComponent } from '../chair-properties-panel/chair-properties-panel.component';
import { ReservationPanelComponent } from '../reservation-panel/reservation-panel.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import viewerStore from '../../stores/viewer.store';
import { LayoutExportImportService, LayoutExportData } from '../../services/layout-export-import.service';

@Component({
  selector: 'app-event-editor',
  standalone: true,
  imports: [
    CommonModule, 
    GridComponent, 
    MainToolbarComponent, 
    TopToolbarComponent, 
    MobxAngularModule, 
    PropertiesPanelComponent,
    ChairPropertiesPanelComponent,
    ReservationPanelComponent,
    NotificationsComponent
  ],
  templateUrl: './event-editor.component.html',
  styleUrls: ['./event-editor.component.css']
})
export class EventEditorComponent implements OnInit, OnChanges {
  title = 'ticketseat-io-angular';
  viewerStore = viewerStore;

  @Input() design?: LayoutExportData | string | null;

  constructor(private layoutImportService: LayoutExportImportService) {}

  ngOnInit(): void {
    this.loadDesignIfProvided();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['design'] && !changes['design'].firstChange) {
      this.loadDesignIfProvided();
    }
  }

  private loadDesignIfProvided(): void {
    if (this.design) {
      try {
        let designData: LayoutExportData;
        
        // Handle both string and object inputs
        if (typeof this.design === 'string') {
          designData = JSON.parse(this.design);
        } else {
          designData = this.design;
        }

        // Import the design using the layout import service
        this.layoutImportService.importLayout(designData, 'replace');
        console.log('Design loaded successfully:', designData.meta.name);
      } catch (error) {
        console.error('Failed to load design:', error);
      }
    }
  }
}
