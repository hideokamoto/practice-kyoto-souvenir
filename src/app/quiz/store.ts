import { computed, Injectable, signal } from '@angular/core';
import type { SourceMeta } from '../data/types';
import type { ModeId } from './game';
import type { Question } from './question';

const KEY = 'kyoto-ikezu-quiz';
const bestKey = (mode: ModeId) => `${KEY}:best:${mode}`;
const dailyKey = (date: string) => `${KEY}:daily:${date}`;

function read(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function write(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // プライベートモードなどで保存できなくても、遊ぶのには困らない
  }
}

@Injectable({ providedIn: 'root' })
export class QuizStore {
  readonly mode = signal<ModeId | null>(null);
  readonly date = signal<string>('');
  readonly questions = signal<Question[]>([]);
  readonly answers = signal<(number | null)[]>([]);
  readonly index = signal(0);
  /** 出題に使ったデータの出典。解説の下に出す。 */
  readonly sources = signal<SourceMeta[]>([]);

  readonly current = computed(() => this.questions()[this.index()] ?? null);
  readonly currentAnswer = computed(() => this.answers()[this.index()] ?? null);
  readonly score = computed(
    () => this.questions().filter((q, i) => this.answers()[i] === q.answerIndex).length,
  );
  readonly finished = computed(
    () => this.questions().length > 0 && this.answers().every((a) => a !== null),
  );

  load(mode: ModeId, questions: Question[], date: string, sources: SourceMeta[] = []): void {
    this.mode.set(mode);
    this.sources.set(sources);
    this.date.set(date);
    this.questions.set(questions);
    this.answers.set(questions.map(() => null));
    this.index.set(0);
  }

  answer(choice: number): void {
    if (this.currentAnswer() !== null) return;
    const i = this.index();
    this.answers.update((xs) => xs.map((a, k) => (k === i ? choice : a)));
    if (this.finished()) this.save();
  }

  next(): boolean {
    if (this.index() >= this.questions().length - 1) return false;
    this.index.update((i) => i + 1);
    return true;
  }

  sourcesOf(q: Question): SourceMeta[] {
    return q.sources.map((id) => this.sources().find((m) => m.id === id)).filter((m) => !!m);
  }

  best(mode: ModeId): number | null {
    return read(bestKey(mode));
  }

  dailyResult(date: string): number | null {
    return read(dailyKey(date));
  }

  private save(): void {
    const mode = this.mode();
    if (!mode) return;
    const prev = read(bestKey(mode));
    if (prev === null || this.score() > prev) write(bestKey(mode), this.score());
    if (mode === 'daily' && read(dailyKey(this.date())) === null) {
      write(dailyKey(this.date()), this.score());
    }
  }
}
