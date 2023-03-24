import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChangeRfidPage } from './change-rfid.page';

const routes: Routes = [
  {
    path: '',
    component: ChangeRfidPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChangeRfidPageRoutingModule {}
