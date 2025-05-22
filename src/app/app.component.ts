import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
import { rootStore } from './stores/root.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    CommonModule, 
    TopToolbarComponent, 
    MainToolbarComponent, 
    GridComponent,
    PropertiesPanelComponent,
    ApplicationControlsComponent
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
    // Configure MobX with strict mode enabled
    configure({
      enforceActions: 'always',     // Don't allow state changes outside actions
      computedRequiresReaction: true, // Computed values are only evaluated when needed
      reactionRequiresObservable: true, // Reactions should depend on observable values
      disableErrorBoundaries: false, // Keep error boundaries enabled for production
      isolateGlobalState: true      // Useful when multiple MobX instances might exist
    });
    
    console.log('MobX configured with strict mode enabled');
  }
  
  ngOnInit() {
    // Make sure our root store is initialized
    console.log('Root store initialized:', rootStore);
    
    // Log any initial state if needed
    console.log('Initial layout elements:', rootStore.layoutStore.elements.length);
    
    // Set up MobX reactions for debugging
    
    // React to selection changes
    this.reactions.push(
      reaction(
        () => this.store.selectionStore.selectedItem,
        (selected) => {
          if (selected) {
            console.log('Reaction: Item selected', selected.id);
          } else {
            console.log('Reaction: Selection cleared');
          }
        }
      )
    );
    
    // React to changes in table count
    this.reactions.push(
      reaction(
        () => this.store.layoutStore.tableCount,
        (count, prevCount) => {
          if (prevCount === undefined) return; // Skip first run
          
          if (count > prevCount) {
            console.log(`Reaction: Table count increased from ${prevCount} to ${count}`);
          } else if (count < prevCount) {
            console.log(`Reaction: Table count decreased from ${prevCount} to ${count}`);
          }
        }
      )
    );
    
    // React to tool changes
    this.reactions.push(
      reaction(
        () => this.store.toolStore.activeTool,
        (tool) => {
          console.log('Reaction: Active tool changed to', tool);
        }
      )
    );
  }
  
  ngOnDestroy() {
    // Clean up all reactions
    this.reactions.forEach(dispose => dispose());
  }
}
