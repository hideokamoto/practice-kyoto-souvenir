import { Injectable } from '@angular/core';
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

  constructor(
    private readonly store: Store,
    private readonly loadingController: LoadingController,
  ) { }
  public fetchSouvenires(showLoading = true) {
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
            map(result => Object.values(result)),
            tap(souvenires => {
              this.store.dispatch(setSouvenir(souvenires));
            }),
            finalize(() => {
              this.loadingController.dismiss();
            })
          ))
      );
    } else {
      return dataLoaderObservar.pipe(
        map(result => Object.values(result)),
        tap(souvenires => {
          this.store.dispatch(setSouvenir(souvenires));
        })
      );
    }
  }
}
