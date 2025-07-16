import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { configure } from 'mobx';

// Disable MobX strict mode
configure({
  enforceActions: "never",
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
  disableErrorBoundaries: true
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    // Critical bootstrap errors should always be logged to console
    console.error('Application bootstrap failed:', err);
  });
