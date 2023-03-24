import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RfidScanPage } from './rfid-scan.page';

const routes: Routes = [
  {
    path: '',
    component: RfidScanPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RfidScanPageRoutingModule {}
