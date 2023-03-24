import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActivityLogDetailsPage } from './activity-log-details.page';

const routes: Routes = [
  {
    path: '',
    component: ActivityLogDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivityLogDetailsPageRoutingModule {}
