import { Component, computed, input } from '@angular/core';
import { GSI_PHOTO_URL, GSI_TILES_PAGE, tilePosition } from './tiles';

const TILE = 256;

/** 地理院タイル（航空写真）を 3×3 枚並べ、指定した地点が枠の中心に来るように表示する。 */
@Component({
  selector: 'app-aerial-photo',
  template: `
    <figure class="aerial" role="img" [attr.aria-label]="alt()">
      <div class="layer" [style.margin-left.px]="-offset().x" [style.margin-top.px]="-offset().y">
        @for (t of tiles(); track t.src) {
          <img
            [src]="t.src"
            alt=""
            [style.left.px]="t.left"
            [style.top.px]="t.top"
            width="256"
            height="256"
          />
        }
      </div>
      <span class="marker" aria-hidden="true"></span>
      <figcaption>
        <a [href]="tilesPage" target="_blank" rel="noopener noreferrer"
          >国土地理院（地理院タイル）</a
        >
      </figcaption>
    </figure>
  `,
  styles: `
    .aerial {
      position: relative;
      overflow: hidden;
      margin: 0 0 1rem;
      height: 300px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface);
    }
    .layer {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 768px;
      height: 768px;
    }
    img {
      position: absolute;
      display: block;
    }
    .marker {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 22px;
      height: 22px;
      margin: -11px 0 0 -11px;
      border: 3px solid #e60012;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
    }
    figcaption {
      position: absolute;
      right: 0;
      bottom: 0;
      padding: 0.1rem 0.5rem;
      background: rgba(255, 255, 255, 0.85);
      font-size: 0.7rem;
    }
    figcaption a {
      color: #1f1e1d;
    }
  `,
})
export class AerialPhoto {
  readonly lat = input.required<number>();
  readonly lon = input.required<number>();
  readonly zoom = input(17);
  readonly alt = input('');
  protected readonly tilesPage = GSI_TILES_PAGE;

  private readonly pos = computed(() => tilePosition(this.lat(), this.lon(), this.zoom()));

  /** 3×3 の並びの中で、地点が左上から何ピクセルの位置にあるか */
  protected readonly offset = computed(() => {
    const p = this.pos();
    return { x: TILE + (p.x - Math.floor(p.x)) * TILE, y: TILE + (p.y - Math.floor(p.y)) * TILE };
  });

  protected readonly tiles = computed(() => {
    const p = this.pos();
    const tx = Math.floor(p.x);
    const ty = Math.floor(p.y);
    const out: { src: string; left: number; top: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        out.push({
          src: GSI_PHOTO_URL(this.zoom(), tx + dx, ty + dy),
          left: (dx + 1) * TILE,
          top: (dy + 1) * TILE,
        });
      }
    }
    return out;
  });
}
