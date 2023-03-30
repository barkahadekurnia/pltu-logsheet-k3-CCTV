import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LaporanHarianDetailPage } from './laporan-harian-detail.page';

const routes: Routes = [
  {
    path: '',
    component: LaporanHarianDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaporanHarianDetailPageRoutingModule {}
