import { Component, OnInit, signal } from '@angular/core';

/** ビルド時に Angular CLI が出力する 3rdpartylicenses.txt（同梱ライブラリのライセンス）を表示する。 */
@Component({
  selector: 'app-licenses',
  template: `
    <h1>ライセンス</h1>
    <p>このアプリに同梱しているライブラリのライセンスは次のとおりです。</p>
    @if (text(); as t) {
      <pre>{{ t }}</pre>
    } @else {
      <p>{{ error() ?? '読み込み中…' }}</p>
    }
  `,
  styles: `
    pre {
      white-space: pre-wrap;
      font-size: 0.75rem;
      padding: 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow-wrap: anywhere;
    }
  `,
})
export class LicensesPage implements OnInit {
  protected readonly text = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const res = await fetch('3rdpartylicenses.txt');
      if (!res.ok) throw new Error(String(res.status));
      this.text.set(await res.text());
    } catch {
      this.error.set('ライセンス一覧は本番ビルドでのみ表示されます。');
    }
  }
}
