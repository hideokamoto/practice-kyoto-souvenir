import { Component, input } from '@angular/core';
import type { SourceMeta } from '../data/types';

@Component({
  selector: 'app-source-list',
  template: `
    @if (sources().length) {
      <div class="sources">
        <h3>出典</h3>
        <ul>
          @for (s of sources(); track s.id) {
            <li>
              <a [href]="s.url" target="_blank" rel="noopener noreferrer">{{ s.title }}</a>
              （{{ s.publisher }}、{{ s.license }}）
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    h3 {
      margin: 0 0 0.2rem;
      font-size: 0.8rem;
      color: var(--muted);
    }
    ul {
      margin: 0;
      padding-left: 1.1rem;
      font-size: 0.85rem;
    }
    li {
      overflow-wrap: anywhere;
    }
  `,
})
export class SourceList {
  readonly sources = input.required<readonly SourceMeta[]>();
}
