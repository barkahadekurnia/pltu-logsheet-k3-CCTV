import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LaporanHarianPage } from './laporan-harian.page';

const routes: Routes = [
  {
    path: '',
    component: LaporanHarianPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaporanHarianPageRoutingModule {}
