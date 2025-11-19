import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterSouvenir } from '../store';

@Component({
    selector: 'app-search-souvenirs',
    templateUrl: './search-souvenirs.component.html',
    styleUrls: ['./search-souvenirs.component.scss'],
    standalone: false
})
export class SearchSouvenirsComponent {

  constructor(
    private readonly store: Store,
  ) { }

  public searchByName(event: Event) {
    const name = (event.target as HTMLInputElement).value;
    this.store.dispatch(filterSouvenir(name));
  }

}

