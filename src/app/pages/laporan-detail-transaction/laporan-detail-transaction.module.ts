import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LaporanDetailTransactionPageRoutingModule } from './laporan-detail-transaction-routing.module';

import { LaporanDetailTransactionPage } from './laporan-detail-transaction.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LaporanDetailTransactionPageRoutingModule
  ],
  declarations: [LaporanDetailTransactionPage]
})
export class LaporanDetailTransactionPageModule {}
