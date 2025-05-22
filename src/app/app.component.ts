import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { reaction, IReactionDisposer, configure } from 'mobx';
import { selectionStore } from './stores/selection.store';
import { layoutStore } from './stores/layout.store';
import { toolStore } from './stores/tool.store';
import { TopToolbarComponent } from './components/toolbars/top-toolbar/top-toolbar.component';
import { MainToolbarComponent } from './components/toolbars/main-toolbar/main-toolbar.component';
import { GridComponent } from './components/grid/grid.component';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { SelectionService } from './services/selection.service';
import { ApplicationControlsComponent } from './components/application-controls/application-controls.component';
import { ChairPropertiesPanelComponent } from './components/chair-properties-panel/chair-properties-panel.component';
import { rootStore } from './stores/root.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    TopToolbarComponent, 
    MainToolbarComponent, 
    GridComponent,
    PropertiesPanelComponent,
    ApplicationControlsComponent,
    ChairPropertiesPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'TicketSeat.io';
  store = rootStore;
  
  // Reaction disposers
  private reactions: IReactionDisposer[] = [];
  
  constructor(public selectionService: SelectionService) {
    // Configure MobX with strict mode disabled
    configure({
      enforceActions: 'never',     // Allow state changes outside actions
      computedRequiresReaction: false, // Allow computed values to be evaluated anytime
      reactionRequiresObservable: false, // Allow reactions without observable dependencies
      disableErrorBoundaries: false, // Keep error boundaries enabled for production
      isolateGlobalState: true      // Useful when multiple MobX instances might exist
    });
  }
  
  ngOnInit() {
    // Set up MobX reactions for debugging
    
    // React to selection changes
    this.reactions.push(
      reaction(
        () => this.store.selectionStore.selectedItem,
        (selected) => {}
      )
    );
    
    // React to changes in table count
    this.reactions.push(
      reaction(
        () => this.store.layoutStore.tableCount,
        (count, prevCount) => {
          if (prevCount === undefined) return; // Skip first run
        }
      )
    );
    
    // React to tool changes
    this.reactions.push(
      reaction(
        () => this.store.toolStore.activeTool,
        (tool) => {}
      )
    );
  }
  
  ngOnDestroy() {
    // Clean up all reactions
    this.reactions.forEach(dispose => dispose());
  }
}
