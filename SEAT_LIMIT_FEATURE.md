# Seat Limit Feature for EventViewer

## Overview

The EventViewer component now supports a `seatLimit` property that restricts how many seats a user can select for reservation. This is useful for controlling ticket sales and preventing users from selecting too many seats.

## Usage

### Basic Usage

```html
<!-- Limit user to select maximum 4 seats -->
<app-event-viewer 
  [design]="layoutData" 
  [seatLimit]="4">
</app-event-viewer>
```

### With All Options

```html
<!-- Complete example with design, reserved seats, and seat limit -->
<app-event-viewer 
  [design]="layoutData" 
  [reservedIds]="['chair-1', 'chair-2']"
  [seatLimit]="6">
</app-event-viewer>
```

### Component Usage Example

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-my-event',
  template: `
    <div class="h-screen">
      <h1 class="text-2xl font-bold p-4">Concert Hall - VIP Section</h1>
      
      <!-- Event viewer with 2-seat limit for VIP tickets -->
      <app-event-viewer 
        [design]="vipSectionLayout" 
        [reservedIds]="alreadyReservedSeats"
        [seatLimit]="2">
      </app-event-viewer>
    </div>
  `
})
export class MyEventComponent {
  vipSectionLayout = {
    // Your layout data here
  };
  
  alreadyReservedSeats = ['chair-5', 'chair-12'];
}
```

## Features

### 1. **Visual Feedback**
- Shows selected count vs. limit (e.g., "2 / 4" seats selected)
- Displays remaining seats in instruction text
- Updates in real-time as user selects/deselects seats

### 2. **Limit Enforcement**
- Prevents selection of additional seats when limit is reached
- Shows warning notification when user tries to exceed limit
- Automatically truncates selection if limit is reduced dynamically

### 3. **Smart Behavior**
- No limit if `seatLimit` is not provided or is `null`
- Handles edge cases (zero or negative limits)
- Integrates with existing reservation system

## API Reference

### Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `seatLimit` | `number \| undefined` | `undefined` | Maximum number of seats that can be selected. If not provided or `null`, no limit is enforced. |

### User Experience

1. **Before Limit Reached**: User can freely select seats, sees remaining count
2. **At Limit**: Selection is disabled, clear feedback provided
3. **Deselection**: User can deselect seats to make room for new selections
4. **Reservation**: All selected seats (within limit) can be reserved as normal

### Notifications

The system shows helpful notifications:
- **Warning**: "You can only select up to X seat(s) for reservation" when limit is reached
- **Info**: "Selection reduced to X seat(s) due to seat limit" when limit is lowered dynamically

## Example Use Cases

1. **VIP Tickets**: Limit to 2 seats per customer
2. **Group Bookings**: Allow up to 8 seats for families
3. **Limited Edition Events**: Restrict to 1 seat per person
4. **Corporate Events**: Different limits for different ticket tiers

## Integration Notes

- Works seamlessly with existing `design` and `reservedIds` inputs
- Maintains backward compatibility (no breaking changes)
- Integrates with notification system
- Respects pre-reserved seats (they don't count toward limit)
