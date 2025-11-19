import { Injectable, inject } from '@angular/core';
import { from } from 'rxjs';
import { concatMap, tap, finalize, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { setSouvenir } from './store';
import { LoadingController } from '@ionic/angular';

export type Souvenir = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  name_kana: string;
  description: string;
};

@Injectable({
  providedIn: 'root'
})
export class SouvenirService {
  private readonly store = inject(Store);
  private readonly loadingController = inject(LoadingController);
  public fetchSouvenirs(showLoading = true) {
    const dataLoaderObservar = from(
      import('./dataset/kyoto-souvenir.json')
    );
    
    if (showLoading) {
      const loadingObservar = from(
        this.loadingController.create()
          .then(d => d.present())
      );
      return loadingObservar.pipe(
        concatMap(() => dataLoaderObservar.pipe(
            map(result => Object.values(result) as unknown as Souvenir[]),
            tap(souvenirs => {
              this.store.dispatch(setSouvenir(souvenirs));
            }),
            finalize(() => {
              this.loadingController.dismiss();
            })
          ))
      );
    } else {
      return dataLoaderObservar.pipe(
        map(result => Object.values(result) as unknown as Souvenir[]),
        tap(souvenirs => {
          this.store.dispatch(setSouvenir(souvenirs));
        })
      );
    }
  }
}
