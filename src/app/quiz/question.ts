import type {
  KakeiData,
  KankoData,
  MeishoData,
  OmiyageData,
  Photo,
  SangyoData,
  ShajiData,
} from '../data/types';
import type { Rng } from './rng';

/** 難易度。問題の型は全段階で同じで、選択肢の紛らわしさと題材の有名さを変える。 */
export type Level = 'easy' | 'normal' | 'hard';
export const LEVELS: readonly Level[] = ['easy', 'normal', 'hard'];

export type DatasetKey = 'omiyage' | 'meisho' | 'kanko' | 'kakei' | 'shaji' | 'sangyo';

export interface Datasets {
  omiyage?: OmiyageData;
  meisho?: MeishoData;
  kanko?: KankoData;
  kakei?: KakeiData;
  shaji?: ShajiData;
  sangyo?: SangyoData;
}

export type Media =
  | { kind: 'photo'; photo: Photo; alt: string }
  | { kind: 'aerial'; lat: number; lon: number; zoom: number; alt: string };

export interface Question {
  /** `${template}:${entityKey}`。1 プレイの中で重複させない。 */
  id: string;
  template: string;
  prompt: string;
  /** 問題文に添える引用（説明文の抜粋など）。答えは伏せ字にしてある。 */
  quote?: string;
  media?: Media;
  choices: string[];
  answerIndex: number;
  explanation: string;
  /** 出典 id（SourceMeta.id） */
  sources: string[];
}

/** 1 種類の出題テンプレート。E は出題対象（品目・施設など）。 */
export interface Template<E = unknown> {
  id: string;
  needs: DatasetKey;
  /** level を省略したら 'normal'。 */
  candidates(d: Datasets, level?: Level): readonly E[];
  key(e: E): string;
  /** 条件に合う問題が作れなければ null（呼び出し側は別の対象で作り直す）。level を省略したら 'normal'。 */
  build(e: E, d: Datasets, rng: Rng, level?: Level): Question | null;
}
