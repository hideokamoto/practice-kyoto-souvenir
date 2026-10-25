import { Injectable } from '@angular/core';
import type { DatasetKey, Datasets } from '../quiz/question';

/** public/data/*.json を読む。base href からの相対パスなので、どのサブパスに置いても動く。 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly cache = new Map<DatasetKey, Promise<unknown>>();

  async load(keys: readonly DatasetKey[]): Promise<Datasets> {
    const entries = await Promise.all(keys.map(async (k) => [k, await this.one(k)] as const));
    return Object.fromEntries(entries) as Datasets;
  }

  private one(key: DatasetKey): Promise<unknown> {
    let p = this.cache.get(key);
    if (!p) {
      p = fetch(`data/${key}.json`).then(async (res) => {
        if (!res.ok) throw new Error(`データ ${key} を読み込めませんでした（HTTP ${res.status}）`);
        return res.json();
      });
      // 失敗したものは次に取り直せるよう、キャッシュから外す
      p.catch(() => this.cache.delete(key));
      this.cache.set(key, p);
    }
    return p;
  }
}
