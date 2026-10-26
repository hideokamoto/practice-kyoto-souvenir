import { Component, computed, input, signal } from '@angular/core';
import type { Photo } from '../data/types';

/** Wikimedia Commons の写真。作者・ライセンス・出典を必ず写真の下に出す。 */
@Component({
  selector: 'app-commons-photo',
  template: `
    <figure class="photo">
      <img
        [src]="photo().thumb"
        [attr.width]="photo().width"
        [attr.height]="photo().height"
        [alt]="alt()"
        referrerpolicy="no-referrer"
        (error)="failedSrc.set(photo().thumb)"
      />
      @if (failed()) {
        <p role="status" class="failed">
          写真を読み込めませんでした（Wikimedia Commons が混み合っている可能性があります）。
        </p>
      }
      <figcaption>
        写真：{{ photo().author }}／
        @if (photo().licenseUrl; as url) {
          <a [href]="url" target="_blank" rel="noopener noreferrer">{{ photo().license }}</a>
        } @else {
          {{ photo().license }}
        }
        ／<a [href]="photo().page" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>
      </figcaption>
    </figure>
  `,
  styles: `
    .photo {
      margin: 0 0 1rem;
    }
    img {
      display: block;
      width: 100%;
      height: auto;
      max-height: 360px;
      object-fit: contain;
      background: var(--surface);
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    .failed {
      margin: 0.3rem 0 0;
      font-size: 0.85rem;
      color: var(--ng);
    }
    figcaption {
      margin-top: 0.3rem;
      font-size: 0.75rem;
      color: var(--muted);
      overflow-wrap: anywhere;
    }
  `,
})
export class CommonsPhoto {
  readonly photo = input.required<Photo>();
  readonly alt = input('');
  // 次の問題でも同じコンポーネントが使い回されるので、失敗は写真の URL ごとに覚える
  protected readonly failedSrc = signal<string | null>(null);
  protected readonly failed = computed(() => this.failedSrc() === this.photo().thumb);
}
