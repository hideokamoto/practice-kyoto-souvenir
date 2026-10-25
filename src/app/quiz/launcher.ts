import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data/data.service';
import { GSI_META } from '../data/static-sources';
import type { SourceMeta } from '../data/types';
import { jstDate, modeById, startGame, type ModeId } from './game';
import { mulberry32 } from './rng';
import { QuizStore } from './store';

/** モードを始める（データを読み、問題を作り、出題画面へ移る）。ホームと結果画面から使う。 */
@Injectable({ providedIn: 'root' })
export class GameLauncher {
  private readonly data = inject(DataService);
  private readonly store = inject(QuizStore);
  private readonly router = inject(Router);

  readonly loading = signal<ModeId | null>(null);
  readonly error = signal<string | null>(null);

  async start(mode: ModeId): Promise<void> {
    this.loading.set(mode);
    this.error.set(null);
    try {
      const m = modeById(mode);
      const d = await this.data.load(m.needs);
      const now = new Date();
      const questions = startGame(mode, d, now, mulberry32(Math.floor(Math.random() * 2 ** 32)));
      if (questions.length === 0) throw new Error('問題を作れませんでした');
      const sources: SourceMeta[] = [
        ...(Object.values(d) as { meta: SourceMeta[] }[]).flatMap((x) => x.meta),
        GSI_META,
      ];
      this.store.load(mode, questions, jstDate(now), sources);
      await this.router.navigate(['/quiz']);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading.set(null);
    }
  }
}
