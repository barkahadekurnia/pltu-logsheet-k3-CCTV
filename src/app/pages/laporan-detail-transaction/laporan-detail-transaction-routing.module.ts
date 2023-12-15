import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LaporanDetailTransactionPage } from './laporan-detail-transaction.page';

const routes: Routes = [
  {
    path: '',
    component: LaporanDetailTransactionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaporanDetailTransactionPageRoutingModule {}
