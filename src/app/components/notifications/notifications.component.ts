import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobxAngularModule } from 'mobx-angular';
import viewerStore, { Notification } from '../../stores/viewer.store';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MobxAngularModule],
  template: `
    <div class="fixed top-20 right-4 z-50 space-y-2" *mobxAutorun>
      <div 
        *ngFor="let notification of viewerStore.notifications" 
        class="max-w-sm rounded-lg shadow-lg transition-all duration-300 transform translate-x-0 opacity-100"
        [class.bg-blue-50]="notification.type === 'info'"
        [class.border-blue-200]="notification.type === 'info'"
        [class.bg-yellow-50]="notification.type === 'warning'"
        [class.border-yellow-200]="notification.type === 'warning'"
        [class.bg-red-50]="notification.type === 'error'"
        [class.border-red-200]="notification.type === 'error'"
        [class.bg-green-50]="notification.type === 'success'"
        [class.border-green-200]="notification.type === 'success'"
        class="border p-3">
        
        <div class="flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <svg *ngIf="notification.type === 'info'" class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            <svg *ngIf="notification.type === 'warning'" class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <svg *ngIf="notification.type === 'error'" class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <svg *ngIf="notification.type === 'success'" class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          
          <!-- Message -->
          <div class="ml-3 flex-1">
            <p 
              [class.text-blue-700]="notification.type === 'info'"
              [class.text-yellow-700]="notification.type === 'warning'"
              [class.text-red-700]="notification.type === 'error'"
              [class.text-green-700]="notification.type === 'success'"
              class="text-sm font-medium">
              {{ notification.message }}
            </p>
          </div>
          
          <!-- Close button -->
          <div class="ml-4 flex-shrink-0">
            <button 
              (click)="viewerStore.removeNotification(notification.id)"
              [class.text-blue-400]="notification.type === 'info'"
              [class.hover:text-blue-500]="notification.type === 'info'"
              [class.text-yellow-400]="notification.type === 'warning'"
              [class.hover:text-yellow-500]="notification.type === 'warning'"
              [class.text-red-400]="notification.type === 'error'"
              [class.hover:text-red-500]="notification.type === 'error'"
              [class.text-green-400]="notification.type === 'success'"
              [class.hover:text-green-500]="notification.type === 'success'"
              class="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2">
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationsComponent {
  viewerStore = viewerStore;
} 