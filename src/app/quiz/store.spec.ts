import { TestBed } from '@angular/core/testing';
import { QuizStore } from './store';
import type { Question } from './question';

const q = (id: string, answerIndex = 0): Question => ({
  id,
  template: 't',
  prompt: 'p',
  choices: ['a', 'b', 'c', 'd'],
  answerIndex,
  explanation: 'e',
  sources: ['s'],
});

describe('QuizStore', () => {
  let store: QuizStore;
  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(QuizStore);
  });

  it('開始すると 1 問目から、未回答の状態になる', () => {
    store.load('meisho', [q('1'), q('2')], '2026-10-25');
    expect(store.mode()).toBe('meisho');
    expect(store.index()).toBe(0);
    expect(store.current()?.id).toBe('1');
    expect(store.currentAnswer()).toBeNull();
    expect(store.finished()).toBe(false);
  });

  it('回答は 1 問につき 1 回だけ受け付ける', () => {
    store.load('meisho', [q('1', 2)], '2026-10-25');
    store.answer(1);
    store.answer(2);
    expect(store.currentAnswer()).toBe(1);
    expect(store.score()).toBe(0);
  });

  it('next は最後の問題で false を返す', () => {
    store.load('meisho', [q('1'), q('2')], '2026-10-25');
    store.answer(0);
    expect(store.next()).toBe(true);
    store.answer(0);
    expect(store.next()).toBe(false);
    expect(store.finished()).toBe(true);
    expect(store.score()).toBe(2);
  });

  it('全問答えたら自己ベストを保存し、低い点では上書きしない', () => {
    store.load('kakei', [q('1')], '2026-10-25');
    store.answer(0);
    expect(store.best('kakei')).toBe(1);
    store.load('kakei', [q('1')], '2026-10-25');
    store.answer(3);
    expect(store.best('kakei')).toBe(1);
    expect(store.best('meisho')).toBeNull();
  });

  it('今日の5問は日付ごとの結果を残す', () => {
    store.load('daily', [q('1'), q('2')], '2026-10-25');
    store.answer(0);
    store.next();
    store.answer(1);
    expect(store.dailyResult('2026-10-25')).toBe(1);
    expect(store.dailyResult('2026-10-26')).toBeNull();
  });

  it('localStorage が使えなくても動く', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    store.load('kakei', [q('1')], '2026-10-25');
    expect(() => store.answer(0)).not.toThrow();
    spy.mockRestore();
  });
});
