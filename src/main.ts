import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { canonicalRedirect } from './app/canonical';

const target = canonicalRedirect(location);
if (target) {
  // Netlify のドメインに直接来たら、正式な URL（games.hidetaka.dev）へ移す。履歴には残さない。
  location.replace(target);
} else {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
