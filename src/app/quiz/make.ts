import type { Media, Question } from './question';
import { shuffle, type Rng } from './rng';
import { containsLoosely, normalize } from './text';

export interface QuestionSpec {
  template: string;
  key: string;
  prompt: string;
  quote?: string;
  media?: Media;
  answer: string;
  /** 候補を多めに渡してよい。正解と同じもの・重複を除いた先頭から最大 3 つ使う。 */
  distractors: readonly string[];
  /** 選択肢の最少数（既定 4）。これに届かなければ問題を作らない。 */
  minChoices?: number;
  explanation: string;
  sources: string[];
}

/**
 * 選択肢を組み立てて Question にする。次のときは null を返し、呼び出し側が別の対象で作り直す。
 * - 誤答が足りない（正解と表記ゆれで同じもの・重複は数えない）
 * - 問題文・引用・画像の代替テキストに正解が含まれている
 */
export function makeQuestion(spec: QuestionSpec, rng: Rng): Question | null {
  const min = spec.minChoices ?? 4;
  const seen = new Set([normalize(spec.answer)]);
  const wrong: string[] = [];
  for (const d of spec.distractors) {
    const n = normalize(d);
    if (n === '' || seen.has(n)) continue;
    seen.add(n);
    wrong.push(d);
    if (wrong.length === 3) break;
  }
  if (wrong.length + 1 < min) return null;
  const visible = [spec.prompt, spec.quote ?? '', spec.media?.alt ?? ''].join('\n');
  if (containsLoosely(visible, spec.answer)) return null;

  const choices = shuffle([spec.answer, ...wrong], rng);
  return {
    id: `${spec.template}:${spec.key}`,
    template: spec.template,
    prompt: spec.prompt,
    ...(spec.quote !== undefined ? { quote: spec.quote } : {}),
    ...(spec.media ? { media: spec.media } : {}),
    choices,
    answerIndex: choices.indexOf(spec.answer),
    explanation: spec.explanation,
    sources: spec.sources,
  };
}
