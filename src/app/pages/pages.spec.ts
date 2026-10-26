import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DataService } from '../data/data.service';
import { HomePage } from './home';
import { QuizPage } from './quiz';
import { ResultPage } from './result';
import { CreditsPage } from './credits';
import { QuizStore } from '../quiz/store';
import type { Question } from '../quiz/question';
import { meta, photo } from '../quiz/testing/fixtures';
import { MODES } from '../quiz/game';

const question = (over: Partial<Question> = {}): Question => ({
  id: 't:1',
  template: 't',
  prompt: '「化野」の読みは？',
  choices: ['あだしの', 'くらまぐち', 'しらかわ', 'ももやま'],
  answerIndex: 0,
  explanation: '「化野」は「あだしの」と読みます。',
  sources: ['kyoto-navi'],
  ...over,
});

function setup() {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: '**', children: [] }])],
  });
  localStorage.clear();
  return { store: TestBed.inject(QuizStore), router: TestBed.inject(Router) };
}

describe('HomePage', () => {
  it('難易度 3 つと今日の 5 問を表示する', async () => {
    setup();
    const f = TestBed.createComponent(HomePage);
    await f.whenStable();
    const labels = [...f.nativeElement.querySelectorAll('.mode-name')].map((e: Element) =>
      e.textContent?.trim(),
    );
    expect(labels).toEqual(MODES.map((m) => m.label));
  });

  it('モードを選ぶとデータを読み、5 問を作って出題画面へ移る', async () => {
    const { store, router } = setup();
    const omiyage = await import('../../../public/data/omiyage.json');
    vi.spyOn(TestBed.inject(DataService), 'load').mockResolvedValue({
      omiyage: omiyage.default as never,
    });
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(HomePage);
    await f.whenStable();
    (f.nativeElement.querySelector('button.mode') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(nav).toHaveBeenCalledWith(['/quiz']));
    expect(store.mode()).toBe('easy');
    expect(store.questions().length).toBe(5);
  });

  it('読み込みに失敗したら、その旨を表示する', async () => {
    setup();
    vi.spyOn(TestBed.inject(DataService), 'load').mockRejectedValue(
      new Error('データ omiyage を読み込めませんでした'),
    );
    const f = TestBed.createComponent(HomePage);
    await f.whenStable();
    (f.nativeElement.querySelector('button.mode') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      f.detectChanges();
      expect(f.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
        '読み込めませんでした',
      );
    });
  });
});

describe('QuizPage', () => {
  it('問題と選択肢を出し、回答すると正誤・解説・出典を出す', async () => {
    const { store } = setup();
    store.load('normal', [question()], '2026-10-25', [meta('kyoto-navi')]);
    const f = TestBed.createComponent(QuizPage);
    await f.whenStable();
    const el: HTMLElement = f.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('化野');
    const buttons = el.querySelectorAll<HTMLButtonElement>('button.choice');
    expect(buttons.length).toBe(4);
    expect(el.querySelector('.feedback')).toBeNull();
    buttons[1].click();
    await f.whenStable();
    expect(el.querySelector('.verdict')?.textContent).toContain('不正解');
    expect(el.querySelector('.feedback')?.textContent).toContain('あだしの');
    expect(el.querySelector('.sources')?.textContent).toContain('kyoto-navi');
    expect(buttons[0].classList).toContain('correct');
  });

  it('航空写真の問題では、地理院タイルと中心の印を出す', async () => {
    const { store } = setup();
    store.load(
      'normal',
      [
        question({
          media: { kind: 'aerial', lat: 34.9949, lon: 135.785, zoom: 17, alt: '航空写真' },
        }),
      ],
      '2026-10-25',
      [],
    );
    const f = TestBed.createComponent(QuizPage);
    await f.whenStable();
    const imgs = [...f.nativeElement.querySelectorAll('.aerial img')] as HTMLImageElement[];
    expect(imgs.length).toBe(9);
    expect(imgs[0].src).toMatch(/^https:\/\/cyberjapandata\.gsi\.go\.jp\/xyz\/seamlessphoto\/17\//);
    expect(f.nativeElement.querySelector('.aerial .marker')).not.toBeNull();
    expect(f.nativeElement.querySelector('.aerial')?.textContent).toContain('国土地理院');
  });

  it('写真の問題では、作者とライセンスを写真の下に出す', async () => {
    const { store } = setup();
    store.load(
      'normal',
      [question({ media: { kind: 'photo', photo: photo('X'), alt: '寺の写真' } })],
      '2026-10-25',
      [],
    );
    const f = TestBed.createComponent(QuizPage);
    await f.whenStable();
    const fig: HTMLElement = f.nativeElement.querySelector('figure.photo');
    expect(fig.querySelector('img')?.getAttribute('alt')).toBe('寺の写真');
    expect(fig.textContent).toContain('撮影者');
    expect(fig.textContent).toContain('CC BY-SA 4.0');
  });
});

describe('写真が読み込めないとき', () => {
  it('写真の枠に読み込めなかったことを出す', async () => {
    const { store } = setup();
    store.load(
      'normal',
      [question({ media: { kind: 'photo', photo: photo('X'), alt: '寺の写真' } })],
      '2026-10-25',
      [],
    );
    const f = TestBed.createComponent(QuizPage);
    await f.whenStable();
    f.nativeElement.querySelector('figure.photo img').dispatchEvent(new Event('error'));
    await f.whenStable();
    expect(f.nativeElement.querySelector('figure.photo [role="status"]')?.textContent).toContain(
      '読み込めませんでした',
    );
  });
});

describe('ResultPage', () => {
  it('得点・称号・シェア用リンクを出す', async () => {
    const { store } = setup();
    store.load('normal', [question(), question({ id: 't:2' })], '2026-10-25', []);
    store.answer(0);
    store.next();
    store.answer(1);
    const f = TestBed.createComponent(ResultPage);
    await f.whenStable();
    const el: HTMLElement = f.nativeElement;
    expect(el.querySelector('.score')?.textContent).toContain('1');
    expect(el.querySelector('.rank')?.textContent?.length).toBeGreaterThan(3);
    const share = el.querySelector<HTMLAnchorElement>('a.share')!;
    expect(decodeURIComponent(share.href)).toContain('京都いけず問答');
    expect(el.querySelectorAll('.review li').length).toBe(2);
  });
});

describe('CreditsPage', () => {
  it('全データの出典と、地理院タイルの出典を出す', async () => {
    setup();
    vi.spyOn(TestBed.inject(DataService), 'load').mockResolvedValue({
      omiyage: { meta: [meta('kyoto-navi')], items: [] },
      kakei: { meta: [meta('kakei')], period: '', items: [] },
    });
    const f = TestBed.createComponent(CreditsPage);
    await vi.waitFor(async () => {
      await f.whenStable();
      const text = f.nativeElement.textContent as string;
      expect(text).toContain('kyoto-navi');
      expect(text).toContain('kakei');
      expect(text).toContain('国土地理院');
    });
  });
});
