import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScheduleLokasiPage } from './schedule-lokasi.page';

const routes: Routes = [
  {
    path: '',
    component: ScheduleLokasiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScheduleLokasiPageRoutingModule {}
