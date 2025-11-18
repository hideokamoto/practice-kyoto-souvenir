import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';

import { FavoritesPage } from './favorites.page';
import { sightsFeatureKey, sightsReducer } from '../sights/store';
import { souvenirFeatureKey, souvenirReducer } from '../souvenir/store';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: FavoritesPage
      }
    ]),
    StoreModule.forFeature(sightsFeatureKey, sightsReducer),
    StoreModule.forFeature(souvenirFeatureKey, souvenirReducer)
  ],
  declarations: [FavoritesPage]
})
export class FavoritesPageModule {}
