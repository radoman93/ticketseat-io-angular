import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GridComponent } from './components/grid/grid.component';
import { MainToolbarComponent } from './components/toolbars/main-toolbar/main-toolbar.component';
import { TopToolbarComponent } from './components/toolbars/top-toolbar/top-toolbar.component';
import { MobxAngularModule } from 'mobx-angular';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { ChairPropertiesPanelComponent } from './components/chair-properties-panel/chair-properties-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    GridComponent, 
    MainToolbarComponent, 
    TopToolbarComponent, 
    MobxAngularModule, 
    PropertiesPanelComponent,
    ChairPropertiesPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ticketseat-io-angular';
}
