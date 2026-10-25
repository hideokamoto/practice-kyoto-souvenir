import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { modeById } from '../quiz/game';
import { QuizStore } from '../quiz/store';
import { AerialPhoto } from '../shared/aerial-photo';
import { CommonsPhoto } from '../shared/commons-photo';
import { SourceList } from '../shared/source-list';

@Component({
  selector: 'app-quiz',
  imports: [AerialPhoto, CommonsPhoto, SourceList],
  template: `
    @if (store.current(); as q) {
      <p class="progress">
        {{ modeLabel() }} ・ {{ store.index() + 1 }} / {{ store.questions().length }}
      </p>
      <h2>{{ q.prompt }}</h2>
      @if (q.quote) {
        <blockquote>{{ q.quote }}</blockquote>
      }
      @switch (q.media?.kind) {
        @case ('aerial') {
          @if (q.media; as m) {
            @if (m.kind === 'aerial') {
              <app-aerial-photo [lat]="m.lat" [lon]="m.lon" [zoom]="m.zoom" [alt]="m.alt" />
            }
          }
        }
        @case ('photo') {
          @if (q.media; as m) {
            @if (m.kind === 'photo') {
              <app-commons-photo [photo]="m.photo" [alt]="m.alt" />
            }
          }
        }
      }

      <div class="choices" role="group" aria-label="選択肢">
        @for (c of q.choices; track $index; let i = $index) {
          <button
            type="button"
            class="choice"
            [class.correct]="answered() && i === q.answerIndex"
            [class.wrong]="answered() && i === store.currentAnswer() && i !== q.answerIndex"
            [disabled]="answered()"
            (click)="store.answer(i)"
          >
            <span class="letter">{{ letters[i] }}</span>
            <span>{{ c }}</span>
          </button>
        }
      </div>

      @if (answered()) {
        <section class="feedback" aria-live="polite">
          <p class="verdict" [class.ok]="isCorrect()">
            {{ isCorrect() ? '正解！' : '不正解… 正解は「' + q.choices[q.answerIndex] + '」' }}
          </p>
          <p class="explanation">{{ q.explanation }}</p>
          <app-source-list [sources]="store.sourcesOf(q)" />
          <button type="button" class="primary" (click)="next()">
            {{ isLast() ? '結果を見る' : '次の問題へ' }}
          </button>
        </section>
      }
    }
  `,
  styles: `
    .progress {
      color: var(--muted);
      font-size: 0.9rem;
      margin: 1rem 0 0.25rem;
    }
    h2 {
      font-size: 1.25rem;
      margin: 0 0 1rem;
      line-height: 1.5;
    }
    blockquote {
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border-left: 4px solid var(--accent);
      background: var(--surface);
      border-radius: 0 10px 10px 0;
      white-space: pre-line;
    }
    .choices {
      display: grid;
      gap: 0.5rem;
    }
    .choice {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      text-align: left;
      padding: 0.8rem 1rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font: inherit;
      cursor: pointer;
      overflow-wrap: anywhere;
    }
    .choice:not(:disabled):hover,
    .choice:focus-visible {
      border-color: var(--accent);
    }
    .choice:disabled {
      cursor: default;
    }
    .choice.correct {
      border-color: var(--ok);
      background: var(--ok-bg);
    }
    .choice.wrong {
      border-color: var(--ng);
      background: var(--ng-bg);
    }
    .letter {
      font-family: var(--mono);
      font-weight: 700;
      color: var(--muted);
    }
    .feedback {
      margin-top: 1.25rem;
      padding: 1rem 1.1rem;
      border-radius: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      display: grid;
      gap: 0.75rem;
    }
    .feedback p {
      margin: 0;
    }
    .verdict {
      font-weight: 700;
      color: var(--ng);
    }
    .verdict.ok {
      color: var(--ok);
    }
  `,
})
export class QuizPage implements OnInit {
  protected readonly store = inject(QuizStore);
  private readonly router = inject(Router);
  protected readonly letters = ['A', 'B', 'C', 'D'];
  protected readonly modeLabel = computed(() => {
    const m = this.store.mode();
    return m ? modeById(m).label : '';
  });

  ngOnInit(): void {
    if (!this.store.current()) void this.router.navigate(['/']);
  }

  protected answered(): boolean {
    return this.store.currentAnswer() !== null;
  }

  protected isCorrect(): boolean {
    return this.store.currentAnswer() === this.store.current()?.answerIndex;
  }

  protected isLast(): boolean {
    return this.store.index() === this.store.questions().length - 1;
  }

  protected next(): void {
    if (!this.store.next()) void this.router.navigate(['/result']);
    else window.scrollTo({ top: 0 });
  }
}
