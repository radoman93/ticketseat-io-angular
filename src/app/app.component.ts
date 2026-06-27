import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// AppComponent — thin router shell. The original demo lives at '' (DemoComponent);
// the Seat Map Studio lives at '/studio' (SeatMapStudioComponent).
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {}
