import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface GridDialogData {
  rows: number;
  columns: number;
  spacing: number;
}

@Component({
  selector: 'app-create-grid-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h2 mat-dialog-title>Create Table Grid</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Rows</mat-label>
          <input matInput type="number" formControlName="rows" min="1" max="20">
          <mat-error *ngIf="form.controls['rows'].hasError('required')">
            Rows are required
          </mat-error>
          <mat-error *ngIf="form.controls['rows'].hasError('min')">
            Minimum 1 row
          </mat-error>
          <mat-error *ngIf="form.controls['rows'].hasError('max')">
            Maximum 20 rows
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Columns</mat-label>
          <input matInput type="number" formControlName="columns" min="1" max="20">
          <mat-error *ngIf="form.controls['columns'].hasError('required')">
            Columns are required
          </mat-error>
          <mat-error *ngIf="form.controls['columns'].hasError('min')">
            Minimum 1 column
          </mat-error>
          <mat-error *ngIf="form.controls['columns'].hasError('max')">
            Maximum 20 columns
          </mat-error>
        </mat-form-field>
        
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Spacing (px)</mat-label>
          <input matInput type="number" formControlName="spacing" min="50" max="500">
          <mat-error *ngIf="form.controls['spacing'].hasError('required')">
            Spacing is required
          </mat-error>
          <mat-error *ngIf="form.controls['spacing'].hasError('min')">
            Minimum spacing is 50px
          </mat-error>
          <mat-error *ngIf="form.controls['spacing'].hasError('max')">
            Maximum spacing is 500px
          </mat-error>
        </mat-form-field>
      </form>
      
      <div class="info-box">
        <mat-icon class="info-icon">info</mat-icon>
        <p>This will create a grid of {{form.value.rows}} × {{form.value.columns}} tables 
        with {{form.value.spacing}}px spacing.</p>
        <p>Total tables: {{form.value.rows * form.value.columns}}</p>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="!form.valid" 
        (click)="onSubmit()">
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .info-box {
      background-color: #e3f2fd;
      border-radius: 4px;
      padding: 16px;
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .info-icon {
      color: #2196f3;
      margin-bottom: 8px;
    }
    
    p {
      margin: 4px 0;
      text-align: center;
    }
  `]
})
export class CreateGridDialogComponent {
  dialogRef = inject(MatDialogRef<CreateGridDialogComponent>);
  data = inject<GridDialogData>(MAT_DIALOG_DATA);
  fb = inject(FormBuilder);
  
  // Form group for the dialog
  form: FormGroup = this.fb.group({
    rows: [
      this.data?.rows || 3, 
      [Validators.required, Validators.min(1), Validators.max(20)]
    ],
    columns: [
      this.data?.columns || 3, 
      [Validators.required, Validators.min(1), Validators.max(20)]
    ],
    spacing: [
      this.data?.spacing || 100, 
      [Validators.required, Validators.min(50), Validators.max(500)]
    ]
  });
  
  // Close the dialog without submitting
  onCancel(): void {
    this.dialogRef.close();
  }
  
  // Submit the form and close the dialog
  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
} 