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
import { autorun, reaction, IReactionDisposer, runInAction } from 'mobx';
import { layoutStore } from '../../stores/layout.store';
import { rootStore } from '../../stores/root.store';
import { gridStore } from '../../stores/grid.store';
import { selectionStore } from '../../stores/selection.store';
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
  layoutStore = layoutStore;
  selectionStore = selectionStore;
  showLayers = true;

  @Input() design?: LayoutExportData | string | null;
  @Output() layoutUpdated = new EventEmitter<LayoutExportData>();
  @Output() designLoadError = new EventEmitter<string>();

  private disposers: IReactionDisposer[] = [];

  constructor(
    private layoutImportService: LayoutExportImportService,
    private logger: LoggerService
  ) {
    // Ensure we're in editor mode when this component is used
    this.viewerStore.setMode('editor');
  }

  private get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.loadDesignIfProvided();

    // Watch for changes in the layout and chairs
    this.disposers.push(
      autorun(() => {
        const elements = layoutStore.elements;
        const chairs = Array.from(rootStore.chairStore.chairs.values());
        const gridSize = gridStore.gridSize;
        const showGrid = gridStore.showGrid;
        const showGuides = gridStore.showGuides;

        const layoutData = this.layoutImportService.exportLayout('current-layout');
        this.layoutUpdated.emit(layoutData);
      })
    );

    // On mobile, pan to selected element when selection changes
    this.disposers.push(
      reaction(
        () => selectionStore.selectedItem,
        (item) => {
          if (item && this.isMobile) {
            this.panToElement(item);
          }
        }
      )
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
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error('Failed to load design in editor', error instanceof Error ? error : new Error(message), { component: 'EventEditorComponent', action: 'loadDesignIfProvided' });
        this.designLoadError.emit(message);
      }
    }
  }

  selectElement(el: any): void {
    this.selectionStore.selectItem(el);
  }

  closeMobileSheet(): void {
    this.selectionStore.deselectItem();
  }

  private panToElement(el: any): void {
    // Pan the canvas so the element is visible in the top 1/3 of the screen
    // (bottom 2/3 will be covered by the sheet)
    const zoom = gridStore.zoomLevel / 100;
    const viewW = window.innerWidth;
    const visibleH = window.innerHeight * 0.33; // top 1/3 visible above sheet
    const toolbarH = 80; // approx top bar + sub-toolbar height

    const elX = el.x || 0;
    const elY = el.y || 0;

    // Target: center element horizontally, place in visible top area vertically
    const targetX = viewW / 2 - elX * zoom;
    const targetY = toolbarH + (visibleH - toolbarH) / 2 - elY * zoom;

    runInAction(() => {
      gridStore.panOffset.x = targetX;
      gridStore.panOffset.y = targetY;
    });
  }

  trackById(index: number, el: any): string {
    return el.id;
  }
}
