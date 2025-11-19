import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';

import { DiscoverPage } from './discover.page';
import { DiscoverPageRoutingModule } from './discover-routing.module';
import { sightsFeatureKey, sightsReducer } from '../sights/store';
import { souvenirFeatureKey, souvenirReducer } from '../souvenir/store';
import { SightsComponentsModule } from '../sights/sights-components.module';
import { SouvenirComponentsModule } from '../souvenir/souvenir-components.module';
import { SharedComponentsModule } from '../../shared/components/components.module';
import { SharedPipesModule } from '../../shared/pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DiscoverPageRoutingModule,
    StoreModule.forFeature(sightsFeatureKey, sightsReducer),
    StoreModule.forFeature(souvenirFeatureKey, souvenirReducer),
    SightsComponentsModule,
    SouvenirComponentsModule,
    SharedComponentsModule,
    SharedPipesModule
  ],
  declarations: [
    DiscoverPage
  ]
})
export class DiscoverPageModule {}

