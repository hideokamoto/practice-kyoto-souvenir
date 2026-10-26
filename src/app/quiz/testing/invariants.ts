import type { Question } from '../question';
import { containsLoosely, normalize } from '../text';

/** どのテンプレートの問題にも成り立つべき性質。 */
export function expectWellFormed(q: Question, sourceIds: readonly string[]): void {
  expect(q.choices.length).toBeGreaterThanOrEqual(2);
  expect(q.choices.length).toBeLessThanOrEqual(4);
  expect(new Set(q.choices.map(normalize)).size).toBe(q.choices.length);
  expect(q.answerIndex).toBeGreaterThanOrEqual(0);
  expect(q.answerIndex).toBeLessThan(q.choices.length);
  const answer = q.choices[q.answerIndex];
  const visible = [q.prompt, q.quote ?? '', q.media?.alt ?? ''].join('\n');
  expect(containsLoosely(visible, answer), `答えが問題文に漏れている: ${answer} / ${visible}`).toBe(
    false,
  );
  expect(q.prompt.trim().length).toBeGreaterThan(0);
  expect(q.explanation.trim().length).toBeGreaterThan(0);
  expect(q.sources.length).toBeGreaterThan(0);
  for (const s of q.sources) expect(sourceIds).toContain(s);
  expect(q.id.startsWith(`${q.template}:`)).toBe(true);
}

export function answerOf(q: Question): string {
  return q.choices[q.answerIndex];
}
