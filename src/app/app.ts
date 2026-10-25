import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { APP_NAME } from './app-info';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="site-header">
      <a routerLink="/" class="brand">{{ name }}</a>
      <nav>
        <a routerLink="/credits">クレジット</a>
        <a routerLink="/licenses">ライセンス</a>
      </nav>
    </header>
    <main>
      <router-outlet />
    </main>
    <footer class="site-footer">
      京都市・京都府・国の機関とは関係のない、非公式のクイズです。問題はオープンデータから自動で作っています。
    </footer>
  `,
})
export class App {
  protected readonly name = APP_NAME;
}
