import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { APP_NAME, APP_URL } from '../app-info';
import { modeById, rankFor } from '../quiz/game';
import { GameLauncher } from '../quiz/launcher';
import { QuizStore } from '../quiz/store';
import { SourceList } from '../shared/source-list';

@Component({
  selector: 'app-result',
  imports: [RouterLink, SourceList],
  template: `
    @if (store.finished()) {
      <section class="summary">
        <p class="mode">
          {{ label() }}{{ store.mode() === 'daily' ? '（' + store.date() + '）' : '' }}
        </p>
        <p class="score">
          {{ store.score() }} <small>/ {{ total() }}</small>
        </p>
        <p class="rank">称号：{{ rank() }}</p>
        <div class="actions">
          <a class="primary share" [href]="shareUrl()" target="_blank" rel="noopener noreferrer"
            >X でシェア</a
          >
          <button type="button" (click)="copy()">
            {{ copied() ? 'コピーしました' : '結果をコピー' }}
          </button>
          @if (store.mode() !== 'daily') {
            <button
              type="button"
              [disabled]="launcher.loading() !== null"
              (click)="launcher.start(store.mode()!)"
            >
              もう一度（同じモード）
            </button>
          }
          <a routerLink="/">モード選択へ</a>
        </div>
        @if (launcher.error(); as err) {
          <p class="error" role="alert">{{ err }}</p>
        }
      </section>

      <h2>ふりかえり</h2>
      <ol class="review">
        @for (q of store.questions(); track q.id; let i = $index) {
          <li [class.ok]="store.answers()[i] === q.answerIndex">
            <p class="q">{{ q.prompt }}</p>
            <p>
              正解：<strong>{{ q.choices[q.answerIndex] }}</strong>
              @if (store.answers()[i] !== q.answerIndex) {
                <span class="yours">（あなたの回答：{{ q.choices[store.answers()[i]!] }}）</span>
              }
            </p>
            <p class="explain">{{ q.explanation }}</p>
            <app-source-list [sources]="store.sourcesOf(q)" />
          </li>
        }
      </ol>
    }
  `,
  styles: `
    .summary {
      text-align: center;
      padding: 1.5rem 1rem;
      margin-top: 1rem;
      border-radius: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
    }
    .summary p {
      margin: 0.2rem 0;
    }
    .mode {
      color: var(--muted);
    }
    .score {
      font-size: 3rem;
      font-weight: 800;
      font-family: var(--mono);
    }
    .score small {
      font-size: 1.2rem;
      color: var(--muted);
    }
    .rank {
      font-weight: 700;
      color: var(--accent);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      align-items: center;
      margin-top: 1rem;
    }
    .actions button,
    .actions a:not(.primary) {
      padding: 0.6rem 1rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text);
      font: inherit;
      cursor: pointer;
      text-decoration: none;
    }
    .error {
      color: var(--ng);
    }
    h2 {
      margin: 2rem 0 0.75rem;
      font-size: 1.2rem;
    }
    .review {
      padding-left: 1.25rem;
      display: grid;
      gap: 1rem;
    }
    .review li {
      border-left: 3px solid var(--ng);
      padding: 0.25rem 0 0.25rem 0.75rem;
    }
    .review li.ok {
      border-left-color: var(--ok);
    }
    .review p {
      margin: 0.2rem 0;
    }
    .q {
      font-weight: 600;
    }
    .yours {
      color: var(--ng);
    }
    .explain {
      color: var(--muted);
      font-size: 0.9rem;
    }
  `,
})
export class ResultPage implements OnInit {
  protected readonly store = inject(QuizStore);
  protected readonly launcher = inject(GameLauncher);
  private readonly router = inject(Router);
  protected readonly copied = signal(false);

  protected readonly total = computed(() => this.store.questions().length);
  protected readonly rank = computed(() => rankFor(this.store.score(), this.total()));
  protected readonly label = computed(() => {
    const m = this.store.mode();
    return m ? modeById(m).label : '';
  });
  protected readonly shareText = computed(() => {
    const day = this.store.mode() === 'daily' ? ` ${this.store.date()}` : '';
    return `${APP_NAME}（${this.label()}${day}）で ${this.store.score()}/${this.total()} 問正解！称号「${this.rank()}」 #京都いけず問答`;
  });
  protected readonly shareUrl = computed(() => {
    const params = new URLSearchParams({ text: this.shareText(), url: APP_URL });
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  });

  ngOnInit(): void {
    if (!this.store.finished()) void this.router.navigate(['/']);
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${this.shareText()} ${APP_URL}`);
      this.copied.set(true);
    } catch {
      // クリップボードの権限が無い環境では何もしない
    }
  }
}
