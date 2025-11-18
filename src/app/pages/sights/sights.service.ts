import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { from } from 'rxjs';
import { concatMap, finalize, map, tap } from 'rxjs/operators';
import { setSights } from './store';

export type Sight = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  name_kana: string;
  description: string;
  address: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  business_hours: string;
  holiday: string;
  notes: string;
  price: string;
  tel: string;
};

@Injectable({
  providedIn: 'root'
})
export class SightsService {

  constructor(
    private readonly store: Store,
    private readonly loadingController: LoadingController
  ) { }

  public fetchSights(showLoading = true) {
    const dataLoaderObservar = from(
      import('./dataset/kyoto-sights.json')
    );
    
    if (showLoading) {
      const loadingObservar = from(
        this.loadingController.create()
          .then(d => d.present())
      );
      return loadingObservar.pipe(
        concatMap(() => dataLoaderObservar.pipe(
            map(result => Object.values(result)),
            tap(sights => {
              this.store.dispatch(setSights(sights));
            }),
            finalize(() => {
              this.loadingController.dismiss();
            })
          ))
      );
    } else {
      return dataLoaderObservar.pipe(
        map(result => Object.values(result)),
        tap(sights => {
          this.store.dispatch(setSights(sights));
        })
      );
    }
  }
}
