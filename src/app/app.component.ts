import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridComponent } from './components/grid/grid.component';
import { TopToolbarComponent } from './components/toolbars/top-toolbar/top-toolbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GridComponent, TopToolbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ticketseat-io-angular';
}
