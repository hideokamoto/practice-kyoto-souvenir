import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { StoreModule } from '@ngrx/store';

import { PlansPageRoutingModule } from './plans-routing.module';
import { PlansPage } from './plans.page';
import { PlanDetailPage } from './plan-detail/plan-detail.page';
import { sightsFeatureKey, sightsReducer } from '../sights/store';
import { SharedPipesModule } from '../../shared/pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PlansPageRoutingModule,
    StoreModule.forFeature(sightsFeatureKey, sightsReducer),
    SharedPipesModule
  ],
  declarations: [PlansPage, PlanDetailPage]
})
export class PlansPageModule {}
