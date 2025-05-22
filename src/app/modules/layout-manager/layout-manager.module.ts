import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LayoutManagerComponent } from './layout-manager.component';
import { LayoutStatsComponent } from '../../components/layout-stats/layout-stats.component';
import { SavedLayoutsComponent } from './saved-layouts/saved-layouts.component';
import { LayoutOptionsComponent } from './layout-options/layout-options.component';
import { ExportDialogComponent } from './dialogs/export-dialog.component';
import { ImportDialogComponent } from './dialogs/import-dialog.component';
import { CreateGridDialogComponent } from './dialogs/create-grid-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutManagerComponent
  }
];

@NgModule({
  declarations: [
    LayoutManagerComponent,
    SavedLayoutsComponent,
    LayoutOptionsComponent,
    ExportDialogComponent,
    ImportDialogComponent,
    CreateGridDialogComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    LayoutStatsComponent
  ],
  exports: [
    LayoutManagerComponent
  ]
})
export class LayoutManagerModule { } 