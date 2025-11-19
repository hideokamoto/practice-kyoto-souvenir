import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { StoreModule } from '@ngrx/store';

import { souvenirFeatureKey, souvenirReducer } from './store';
import { ListSouveniresComponent } from './list-souvenires/list-souvenires.component';
import { SearchSouveniresComponent } from './search-souvenires/search-souvenires.component';
import { SharedComponentsModule } from 'src/app/shared/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedComponentsModule,
    StoreModule.forFeature(souvenirFeatureKey, souvenirReducer)
  ],
  declarations: [
    ListSouveniresComponent,
    SearchSouveniresComponent
  ],
  exports: [
    ListSouveniresComponent,
    SearchSouveniresComponent
  ]
})
export class SouvenirComponentsModule { }

