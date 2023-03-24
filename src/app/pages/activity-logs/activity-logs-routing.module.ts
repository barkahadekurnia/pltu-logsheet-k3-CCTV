import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActivityLogsPage } from './activity-logs.page';

const routes: Routes = [
  {
    path: '',
    component: ActivityLogsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivityLogsPageRoutingModule {}
