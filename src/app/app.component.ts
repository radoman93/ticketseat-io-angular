import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from './components/grid/grid.component';
import { MainToolbarComponent } from './components/toolbars/main-toolbar/main-toolbar.component';
import { TopToolbarComponent } from './components/toolbars/top-toolbar/top-toolbar.component';
import { MobxAngularModule } from 'mobx-angular';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { ChairPropertiesPanelComponent } from './components/chair-properties-panel/chair-properties-panel.component';
import { ReservationPanelComponent } from './components/reservation-panel/reservation-panel.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import viewerStore from './stores/viewer.store';

@Component({
  selector: 'app-root',
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
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ticketseat-io-angular';
  viewerStore = viewerStore;
}
