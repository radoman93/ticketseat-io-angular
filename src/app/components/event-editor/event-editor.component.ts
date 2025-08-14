import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from '../grid/grid.component';
import { MainToolbarComponent } from '../toolbars/main-toolbar/main-toolbar.component';
import { TopToolbarComponent } from '../toolbars/top-toolbar/top-toolbar.component';
import { MobxAngularModule } from 'mobx-angular';
import { PropertiesPanelComponent } from '../properties-panel/properties-panel.component';
import { ChairPropertiesPanelComponent } from '../chair-properties-panel/chair-properties-panel.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import viewerStore from '../../stores/viewer.store';
import { LayoutExportImportService, LayoutExportData } from '../../services/layout-export-import.service';
import { autorun, IReactionDisposer } from 'mobx';
import { layoutStore } from '../../stores/layout.store';
import { rootStore } from '../../stores/root.store';
import { gridStore } from '../../stores/grid.store';
import { LoggerService } from '../../services/logger.service';

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
    NotificationsComponent
  ],
  templateUrl: './event-editor.component.html',
  styleUrls: ['./event-editor.component.css']
})
export class EventEditorComponent implements OnInit, OnChanges, OnDestroy {
  title = 'ticketseat-io-angular';
  viewerStore = viewerStore;

  @Input() design?: LayoutExportData | string | null;
  @Output() layoutUpdated = new EventEmitter<LayoutExportData>();

  private disposers: IReactionDisposer[] = [];

  constructor(
    private layoutImportService: LayoutExportImportService,
    private logger: LoggerService
  ) {
    // Ensure we're in editor mode when this component is used
    this.viewerStore.setMode('editor');
  }

  ngOnInit(): void {
    this.loadDesignIfProvided();

    // Watch for changes in the layout and chairs
    this.disposers.push(
      autorun(() => {
        // Access observables to track changes
        const elements = layoutStore.elements;
        const chairs = Array.from(rootStore.chairStore.chairs.values());
        const gridSize = gridStore.gridSize;
        const showGrid = gridStore.showGrid;
        const showGuides = gridStore.showGuides;

        // Export and emit the updated layout
        const layoutData = this.layoutImportService.exportLayout('current-layout');

        this.layoutUpdated.emit(layoutData);
        console.log(layoutData)
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up all autorun disposers
    this.disposers.forEach(dispose => dispose());
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
      } catch (error) {
        this.logger.error('Failed to load design in editor', error instanceof Error ? error : new Error(String(error)), { component: 'EventEditorComponent', action: 'loadDesignIfProvided' });
      }
    }
  }
}
