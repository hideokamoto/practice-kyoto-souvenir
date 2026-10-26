import { Component, inject, OnInit, signal } from '@angular/core';
import { APP_NAME, REPO_URL } from '../app-info';
import { DataService } from '../data/data.service';
import { GSI_META } from '../data/static-sources';
import type { SourceMeta } from '../data/types';

const ALL = ['omiyage', 'meisho', 'kakei', 'kanko', 'shaji', 'sangyo'] as const;

@Component({
  selector: 'app-credits',
  template: `
    <h1>クレジット</h1>
    <p>
      {{ name }}
      の問題は、下のオープンデータから自動で作っています。問題文・選択肢・解説は、データの値を加工したものです。
      データの内容は各データの公開時点のもので、現在の状況と違うことがあります。
    </p>
    <p>
      京都市・京都府・国の機関・Wikimedia Foundation とは関係のない、非公式のクイズです。
      ソースコードとデータの作り方は
      <a [href]="repo" target="_blank" rel="noopener noreferrer">GitHub</a> にあります。
    </p>

    @if (error(); as e) {
      <p role="alert" class="error">{{ e }}</p>
    }

    <h2>データの出典</h2>
    <ul class="metas">
      @for (m of metas(); track m.id) {
        <li>
          <h3>
            <a [href]="m.url" target="_blank" rel="noopener noreferrer">{{ m.title }}</a>
          </h3>
          <p>
            {{ m.publisher }} ／
            @if (m.licenseUrl; as u) {
              <a [href]="u" target="_blank" rel="noopener noreferrer">{{ m.license }}</a>
            } @else {
              {{ m.license }}
            }
            ／ 取得日 {{ m.retrievedAt }}
          </p>
          @if (m.note) {
            <p class="note">{{ m.note }}</p>
          }
        </li>
      }
    </ul>
  `,
  styles: `
    h1 {
      font-size: 1.5rem;
    }
    .metas {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 1rem;
    }
    .metas li {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface);
    }
    h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
    }
    .metas p {
      margin: 0.2rem 0;
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }
    .note {
      color: var(--muted);
    }
    .error {
      color: var(--ng);
    }
  `,
})
export class CreditsPage implements OnInit {
  private readonly data = inject(DataService);
  protected readonly name = APP_NAME;
  protected readonly repo = REPO_URL;
  protected readonly metas = signal<SourceMeta[]>([GSI_META]);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const d = await this.data.load(ALL);
      const metas = (Object.values(d) as { meta: SourceMeta[] }[]).flatMap((x) => x.meta);
      const unique = [...new Map([...metas, GSI_META].map((m) => [m.id, m])).values()];
      this.metas.set(unique);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }
}
