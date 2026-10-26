import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // games.hidetaka.dev のサブパス（/kyoto-ikezu-quiz/）で 404 にならないよう、ハッシュでルーティングする
    provideRouter(routes, withHashLocation()),
  ],
};
