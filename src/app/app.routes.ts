import { Routes } from '@angular/router';
import { DemoComponent } from './demo.component';
import { SeatMapStudioComponent } from './seat-map-studio/seat-map-studio.component';

export const routes: Routes = [
  { path: '', component: DemoComponent },
  { path: 'studio', component: SeatMapStudioComponent },
];
