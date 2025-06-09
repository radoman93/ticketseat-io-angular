export interface Chair {
  id: string;              // Unique identifier (auto-generated UUID)
  tableId: string;         // Reference to parent table
  label: string;           // Display label (1, 2, 3, 4, 5...)
  price: number;           // Default 0, editable
  position: {              // Relative position around table
    angle: number;         // Angle in degrees
    distance: number;      // Distance from table center
  };
  isSelected?: boolean;    // Selection state
  reservationStatus?: 'free' | 'reserved' | 'selected-for-reservation';  // Reservation status for viewer mode
  reservedBy?: string;     // Who reserved the seat (customer name/ID)
} 