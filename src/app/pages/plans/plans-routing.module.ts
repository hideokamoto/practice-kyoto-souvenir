import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlansPage } from './plans.page';
import { PlanDetailPage } from './plan-detail/plan-detail.page';

const routes: Routes = [
  {
    path: '',
    component: PlansPage
  },
  {
    path: ':id',
    component: PlanDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlansPageRoutingModule {}
