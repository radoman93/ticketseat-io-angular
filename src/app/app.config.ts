import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { configure } from 'mobx';

import { routes } from './app.routes';

// Configure MobX
configure({
  enforceActions: 'never',  // Allows state modifications outside actions
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false
});

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};
