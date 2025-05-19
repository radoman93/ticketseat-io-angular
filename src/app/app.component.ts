import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridComponent } from './components/grid/grid.component';
import { TopToolbarComponent } from './components/toolbars/top-toolbar/top-toolbar.component';
import { MainToolbarComponent } from './components/toolbars/main-toolbar/main-toolbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridComponent, TopToolbarComponent, MainToolbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ticketseat-io-angular';
}
