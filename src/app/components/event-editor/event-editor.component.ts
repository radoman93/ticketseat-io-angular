import { Component } from '@angular/core';
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
export class EventEditorComponent {
  title = 'ticketseat-io-angular';
  viewerStore = viewerStore;
}
