# Component Separation Guide

## Overview

The TicketSeat.io Angular library now provides two distinct components for different user roles:

- **`EventEditorComponent`**: For admin dashboards and layout management
- **`EventViewerComponent`**: For end users to view layouts and make reservations

## Component Comparison

| Feature | EventEditorComponent | EventViewerComponent |
|---------|---------------------|----------------------|
| **Purpose** | Layout creation & editing | Seat selection & reservation |
| **Target Users** | Admins, Event Managers | End customers, Event attendees |
| **Drag & Drop** | ✅ Full editing capabilities | ❌ Read-only layout |
| **Add/Remove Elements** | ✅ Complete element management | ❌ View only |
| **Properties Panel** | ✅ Element configuration | ❌ Not applicable |
| **Reservation Panel** | ❌ Not applicable | ✅ Customer form & booking |
| **Grid Controls** | ✅ Grid size, visibility | ❌ Not applicable |
| **Export/Import** | ✅ Layout management | ❌ Not applicable |
| **Seat Selection** | ✅ For editing purposes | ✅ For reservation purposes |
| **Design Input** | ✅ Load existing layouts | ✅ Load existing layouts |

## Implementation Details

### EventEditorComponent (Admin)

**File**: `src/app/components/event-editor/event-editor.component.ts`

**Features**:
- Forces `viewerStore.setMode('editor')` on initialization
- Includes main toolbar with element tools
- Includes properties panel for configuration
- Includes top toolbar with grid controls and export/import
- Includes chair properties panel for seat customization
- Clean, professional admin interface

**Template Structure**:
```html
<div class="flex flex-col h-screen editor-mode">
  <app-top-toolbar></app-top-toolbar>
  <div class="flex flex-row h-full overflow-hidden">
    <div class="h-full"><app-main-toolbar></app-main-toolbar></div>
    <div class="flex-1 h-full overflow-hidden"><app-grid></app-grid></div>
    <div class="h-full"><app-properties-panel></app-properties-panel></div>
  </div>
  <app-chair-properties-panel></app-chair-properties-panel>
  <app-notifications></app-notifications>
</div>
```

### EventViewerComponent (End User)

**File**: `src/app/components/event-viewer/event-viewer.component.ts`

**Features**:
- Forces `viewerStore.setMode('viewer')` on initialization
- Custom viewer-specific header with seat selection summary
- Includes reservation panel for customer information
- Clean, user-friendly interface with green theme
- No editing capabilities - purely for viewing and booking

**Template Structure**:
```html
<div class="flex flex-col h-screen viewer-mode">
  <!-- Custom Viewer Header -->
  <div class="viewer-header">...</div>
  
  <div class="flex flex-row h-full overflow-hidden">
    <div class="flex-1 h-full overflow-hidden"><app-grid></app-grid></div>
    <div class="h-full"><app-reservation-panel></app-reservation-panel></div>
  </div>
  
  <app-notifications></app-notifications>
</div>
```

## Usage Examples

### Admin Dashboard

```typescript
import { EventEditorComponent } from 'ticketseat-io-angular';

@Component({
  template: '<app-event-editor [design]="layoutData"></app-event-editor>'
})
export class AdminDashboardComponent {
  layoutData = { /* layout JSON */ };
}
```

### User Booking Page

```typescript
import { EventViewerComponent } from 'ticketseat-io-angular';

@Component({
  template: '<app-event-viewer [design]="eventLayout"></app-event-viewer>'
})
export class BookingPageComponent {
  eventLayout = { /* same layout JSON, but for viewing */ };
}
```

### Role-Based Dynamic Selection

```typescript
@Component({
  template: `
    <app-event-editor [design]="layout" *ngIf="isAdmin"></app-event-editor>
    <app-event-viewer [design]="layout" *ngIf="!isAdmin"></app-event-viewer>
  `
})
export class EventPageComponent {
  isAdmin = false; // Based on user authentication
  layout = { /* layout data */ };
}
```

## Key Benefits

### 🎯 **Focused User Experience**
- Admins get powerful editing tools without reservation clutter
- End users get clean booking interface without confusing admin controls

### 🔒 **Clear Separation of Concerns**
- Edit mode is completely isolated from view mode
- No accidental editing in user-facing applications
- Clear component boundaries

### 📱 **Better Performance**
- Each component only loads necessary features
- Smaller bundle sizes when using only one component
- Optimized for specific use cases

### 🎨 **Distinct Visual Design**
- Editor has professional blue/gray theme for admin work
- Viewer has friendly green theme for customer interactions
- Clear visual distinction between modes

## Migration from Combined Component

If you were previously using the combined component with mode switching:

### Before (Old Way)
```typescript
// This approach is no longer recommended
<app-event-editor></app-event-editor>
// Then switching modes via viewerStore.setMode()
```

### After (New Way)
```typescript
// Use specific components for each use case
<app-event-editor [design]="layout"></app-event-editor>  <!-- Admin -->
<app-event-viewer [design]="layout"></app-event-viewer>  <!-- Users -->
```

## Component State Management

Both components use the same underlying MobX stores but initialize them differently:

- **EventEditorComponent**: Sets mode to 'editor' and enables all editing features
- **EventViewerComponent**: Sets mode to 'viewer' and enables reservation features

The `viewerStore.isEditorMode` and `viewerStore.isViewerMode` computed properties are used throughout the child components to show/hide appropriate features.

## Testing the Components

The demo application (`app.component.html`) includes a toggle button to switch between components for testing purposes:

```html
<div class="toggle-header">
  <button (click)="toggleComponent()">
    {{ showEditor ? '🔧 Admin Editor' : '👥 User Viewer' }}
  </button>
</div>

<app-event-editor [design]="design" *ngIf="showEditor"></app-event-editor>
<app-event-viewer [design]="design" *ngIf="!showEditor"></app-event-viewer>
```

This allows you to easily test both components with the same layout data and see the differences in functionality and user experience. 