import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LaporanHarianDetailPageRoutingModule } from './laporan-harian-detail-routing.module';

import { LaporanHarianDetailPage } from './laporan-harian-detail.page';
import { BadgeStatComponentModule } from 'src/app/components/badge-stat/badge-stat.component.module';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LaporanHarianDetailPageRoutingModule,
    ScreenViewComponentModule,
    BadgeStatComponentModule
  ],
  declarations: [LaporanHarianDetailPage]
})
export class LaporanHarianDetailPageModule {}
