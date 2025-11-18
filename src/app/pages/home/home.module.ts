import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';

import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { sightsFeatureKey, sightsReducer } from '../sights/store';
import { souvenirFeatureKey, souvenirReducer } from '../souvenir/store';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    StoreModule.forFeature(sightsFeatureKey, sightsReducer),
    StoreModule.forFeature(souvenirFeatureKey, souvenirReducer)
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
