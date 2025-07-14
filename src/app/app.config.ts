import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

// Use a simple object for environment instead of importing
const environment = {
  production: false
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(HttpClientModule)
  ]
};

// Check if we're in development mode
if (!environment.production) {
  // Enable MobX development tools in non-production
}
