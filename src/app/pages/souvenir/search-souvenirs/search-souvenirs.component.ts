import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterSouvenir } from '../store';

@Component({
    selector: 'app-search-souvenirs',
    templateUrl: './search-souvenirs.component.html',
    styleUrls: ['./search-souvenirs.component.scss'],
    standalone: false
})
export class SearchSouvenirsComponent {
  private readonly store = inject(Store);

  public searchByName(event: Event) {
    const name = (event.target as HTMLInputElement).value;
    this.store.dispatch(filterSouvenir(name));
  }

}

