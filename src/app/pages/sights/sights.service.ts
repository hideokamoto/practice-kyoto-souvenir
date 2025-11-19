import { Injectable, inject } from '@angular/core';
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  alt_name: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  alt_name_kana: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  postal_code: string;
  address: string;
  tel: string;
  fax: string;
  accessibility: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  opening_time: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  closing_time: string;
  duration: string;
  holiday: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  business_hours: string;
  price: string;
  notes: string;
  photo: string;
};

@Injectable({
  providedIn: 'root'
})
export class SightsService {
  private readonly store = inject(Store);
  private readonly loadingController = inject(LoadingController);

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
            map(result => Object.values(result) as unknown as Sight[]),
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
        map(result => Object.values(result) as unknown as Sight[]),
        tap(sights => {
          this.store.dispatch(setSights(sights));
        })
      );
    }
  }
}
