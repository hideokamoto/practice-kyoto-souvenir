import { Component, inject } from '@angular/core';
import { APP_NAME, APP_TAGLINE } from '../app-info';
import { jstDate, MODES, QUESTIONS_PER_GAME, type ModeDef } from '../quiz/game';
import { GameLauncher } from '../quiz/launcher';
import { QuizStore } from '../quiz/store';

@Component({
  selector: 'app-home',
  template: `
    <section class="hero">
      <p class="eyebrow">{{ tagline }}</p>
      <h1>{{ name }}</h1>
      <p class="lead">
        京都市・京都府・国のオープンデータから、毎回ちがう問題を自動で作ります。1 回
        {{ perGame }} 問。
      </p>
    </section>

    @if (launcher.error(); as err) {
      <p class="error" role="alert">{{ err }}。時間をおいて、もう一度お試しください。</p>
    }

    <section class="modes">
      @for (m of modes; track m.id) {
        <button
          type="button"
          class="mode"
          [class.daily]="m.id === 'daily'"
          [disabled]="launcher.loading() !== null"
          [attr.aria-busy]="launcher.loading() === m.id"
          (click)="launcher.start(m.id)"
        >
          <span class="mode-name">{{ m.label }}</span>
          <span class="mode-desc">{{ m.description }}</span>
          @if (launcher.loading() === m.id) {
            <span class="status">読み込み中…</span>
          } @else if (status(m); as s) {
            <span class="status">{{ s }}</span>
          }
        </button>
      }
    </section>
  `,
  styles: `
    .hero {
      text-align: center;
      padding: 1.5rem 0 0.5rem;
    }
    .eyebrow {
      margin: 0;
      color: var(--accent);
      font-weight: 700;
    }
    h1 {
      margin: 0.25rem 0 0.5rem;
      font-size: clamp(1.9rem, 7vw, 2.8rem);
      letter-spacing: 0.08em;
    }
    .lead {
      margin: 0 auto;
      max-width: 34rem;
      color: var(--muted);
    }
    .error {
      padding: 0.75rem 1rem;
      border-radius: 10px;
      background: var(--ng-bg);
      color: var(--ng);
    }
    .modes {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
      margin: 1.5rem 0;
    }
    .mode {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      text-align: left;
      padding: 1rem 1.1rem;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font: inherit;
      cursor: pointer;
    }
    .mode.daily {
      border-color: var(--accent);
    }
    .mode:not(:disabled):hover,
    .mode:focus-visible {
      border-color: var(--accent);
    }
    .mode:disabled {
      cursor: progress;
    }
    .mode-name {
      font-weight: 700;
      font-size: 1.1rem;
    }
    .mode-desc {
      color: var(--muted);
      font-size: 0.9rem;
    }
    .status {
      font-size: 0.8rem;
      color: var(--accent);
    }
  `,
})
export class HomePage {
  protected readonly launcher = inject(GameLauncher);
  private readonly store = inject(QuizStore);
  protected readonly modes = MODES;
  protected readonly name = APP_NAME;
  protected readonly tagline = APP_TAGLINE;
  protected readonly perGame = QUESTIONS_PER_GAME;

  protected status(m: ModeDef): string | null {
    if (m.id === 'daily') {
      const r = this.store.dailyResult(jstDate(new Date()));
      return r === null ? null : `今日は ${r} / ${this.perGame} 問正解`;
    }
    const b = this.store.best(m.id);
    return b === null ? null : `自己ベスト ${b} / ${this.perGame}`;
  }
}
