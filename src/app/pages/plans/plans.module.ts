import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PlansPageRoutingModule } from './plans-routing.module';
import { PlansPage } from './plans.page';
import { PlanDetailPage } from './plan-detail/plan-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PlansPageRoutingModule
  ],
  declarations: [PlansPage, PlanDetailPage]
})
export class PlansPageModule {}
