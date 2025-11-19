import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { StoreModule } from '@ngrx/store';

import { sightsFeatureKey, sightsReducer } from './store';
import { ListSightItemComponent } from './list-sight-item/list-sight-item.component';
import { SearchSightsComponent } from './search-sights/search-sights.component';
import { SharedComponentsModule } from 'src/app/shared/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
    SharedComponentsModule,
    StoreModule.forFeature(sightsFeatureKey, sightsReducer)
  ],
  declarations: [
    ListSightItemComponent,
    SearchSightsComponent
  ],
  exports: [
    ListSightItemComponent,
    SearchSightsComponent
  ]
})
export class SightsComponentsModule { }

