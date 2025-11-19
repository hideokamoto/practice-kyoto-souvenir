import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { StoreModule } from '@ngrx/store';

import { souvenirFeatureKey, souvenirReducer } from './store';
import { ListSouvenirsComponent } from './list-souvenirs/list-souvenirs.component';
import { SearchSouvenirsComponent } from './search-souvenirs/search-souvenirs.component';
import { SharedComponentsModule } from 'src/app/shared/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
    SharedComponentsModule,
    StoreModule.forFeature(souvenirFeatureKey, souvenirReducer)
  ],
  declarations: [
    ListSouvenirsComponent,
    SearchSouvenirsComponent
  ],
  exports: [
    ListSouvenirsComponent,
    SearchSouvenirsComponent
  ]
})
export class SouvenirComponentsModule { }

