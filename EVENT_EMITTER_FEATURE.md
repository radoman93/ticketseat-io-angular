# EventViewer Selected Seats EventEmitter

## Overview

The `EventViewer` component now includes an `EventEmitter` output that emits the selected chair objects back to the parent component whenever the selection changes.

## Implementation Details

### EventEmitter Output
- **Output name**: `selectedSeatsChange`
- **Type**: `EventEmitter<Chair[]>`
- **Emits**: Full `Chair` objects (not just IDs)

### Usage Example

```typescript
// In your parent component template
<app-event-viewer 
  [design]="layoutDesign"
  [seatLimit]="maxSeats"
  [reservedIds]="preReservedSeats"
  (selectedSeatsChange)="onSelectedSeatsChange($event)">
</app-event-viewer>

// In your parent component class
import { Chair } from '@radoman93/ticketseat-io-angular';

export class ParentComponent {
  onSelectedSeatsChange(selectedChairs: Chair[]): void {
    console.log('Selected seats:', selectedChairs);
    
    // Access full chair information
    selectedChairs.forEach(chair => {
      console.log('Chair ID:', chair.id);
      console.log('Chair Label:', chair.label);
      console.log('Table ID:', chair.tableId);
      console.log('Price:', chair.price);
      console.log('Position:', chair.position);
      console.log('Reservation Status:', chair.reservationStatus);
    });
  }
}
```

## Chair Object Structure

Each emitted chair object contains:

```typescript
interface Chair {
  id: string;              // Unique identifier (e.g., "table-1-chair-2")
  tableId: string;         // Reference to parent table
  label: string;           // Display label (e.g., "1", "2", "3")
  price: number;           // Chair price
  position: {              // Position relative to table
    angle: number;         // Angle in degrees
    distance: number;      // Distance from table center
  };
  isSelected?: boolean;    // Selection state
  reservationStatus?: 'free' | 'reserved' | 'selected-for-reservation';
  reservedBy?: string;     // Customer name/ID if reserved
}
```

## When Events Are Emitted

The `selectedSeatsChange` event is emitted when:
1. A user selects a seat (adds to selection)
2. A user deselects a seat (removes from selection)
3. Selection is cleared programmatically
4. Selection is modified due to seat limit constraints

## Key Features

1. **Real-time Updates**: Events are emitted immediately when selection changes
2. **Full Object Data**: Emits complete chair objects with all properties
3. **Reactive**: Uses MobX reactions to automatically detect selection changes
4. **Memory Safe**: Properly disposes of reactions when component is destroyed
5. **Type Safe**: Fully typed with TypeScript interfaces

## Testing

The demo application includes a test handler in `app.component.ts` that:
- Logs selected seats to the browser console
- Shows selected seat count and IDs
- Displays detailed seat information

To test:
1. Switch to "User Viewer" mode
2. Open browser developer tools console
3. Click on available seats to select them
4. Watch the console for emitted events
5. See how the EventEmitter provides full chair objects

## Public API Export

The `Chair` interface is exported from the public API:

```typescript
import { Chair } from '@radoman93/ticketseat-io-angular';
```

This allows parent components to properly type the emitted events.

## Integration Notes

- The EventEmitter integrates seamlessly with the existing seat limit functionality
- Pre-reserved seats are filtered out and cannot be selected
- The emitted chairs include current reservation status
- Event emission is optimized to only fire when selection actually changes
