import { Component } from '@angular/core';
import { TopToolbarComponent } from './components/toolbars/top-toolbar/top-toolbar.component';
import { MainToolbarComponent } from './components/toolbars/main-toolbar/main-toolbar.component';
import { GridComponent } from './components/grid/grid.component';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { SelectionService } from './services/selection.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TopToolbarComponent, 
    MainToolbarComponent, 
    GridComponent,
    PropertiesPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ticketseat-io-angular';
  
  constructor(public selectionService: SelectionService) {}
}
