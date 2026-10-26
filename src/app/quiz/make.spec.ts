import { makeQuestion } from './make';
import { mulberry32 } from './rng';

const base = {
  template: 't',
  key: 'k',
  prompt: '問題',
  explanation: '解説',
  sources: ['s'],
};

describe('makeQuestion', () => {
  it('正解と誤答を混ぜ、answerIndex が正解を指す', () => {
    const q = makeQuestion({ ...base, answer: 'A', distractors: ['B', 'C', 'D'] }, mulberry32(1))!;
    expect(q.id).toBe('t:k');
    expect(q.choices.length).toBe(4);
    expect(q.choices[q.answerIndex]).toBe('A');
    expect([...q.choices].sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('誤答が足りなければ null', () => {
    expect(
      makeQuestion({ ...base, answer: 'A', distractors: ['B', 'C'] }, mulberry32(1)),
    ).toBeNull();
  });

  it('minChoices を下げれば 2 択も作れる', () => {
    const q = makeQuestion(
      { ...base, answer: 'A', distractors: ['B'], minChoices: 2 },
      mulberry32(1),
    )!;
    expect(q.choices.length).toBe(2);
  });

  it('表記ゆれで正解と同じになる誤答・重複する誤答は除く', () => {
    const q = makeQuestion(
      { ...base, answer: '八ツ橋', distractors: ['八ッ橋', 'B', 'B', 'C', 'D'] },
      mulberry32(1),
    )!;
    expect([...q.choices].sort()).toEqual(['B', 'C', 'D', '八ツ橋']);
  });

  it('誤答は最大 3 つまで使う', () => {
    const q = makeQuestion(
      { ...base, answer: 'A', distractors: ['B', 'C', 'D', 'E'] },
      mulberry32(1),
    )!;
    expect(q.choices.length).toBe(4);
  });

  it('問題文・引用に正解が含まれていれば null', () => {
    expect(
      makeQuestion(
        { ...base, prompt: '八ッ橋は？', answer: '八ツ橋', distractors: ['B', 'C', 'D'] },
        mulberry32(1),
      ),
    ).toBeNull();
    expect(
      makeQuestion(
        { ...base, quote: 'これは 八ツ橋', answer: '八ツ橋', distractors: ['B', 'C', 'D'] },
        mulberry32(1),
      ),
    ).toBeNull();
  });
});
