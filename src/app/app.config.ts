import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // GitHub Pages・games.hidetaka.dev のサブパスで 404 にならないよう、ハッシュでルーティングする
    provideRouter(routes, withHashLocation()),
  ],
};
