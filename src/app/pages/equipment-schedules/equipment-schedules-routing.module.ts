import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EquipmentSchedulesPage } from './equipment-schedules.page';

const routes: Routes = [
  {
    path: '',
    component: EquipmentSchedulesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EquipmentSchedulesPageRoutingModule {}
