import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LaporanHarianPageRoutingModule } from './laporan-harian-routing.module';

import { LaporanHarianPage } from './laporan-harian.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';
import { BadgeStatComponentModule } from 'src/app/components/badge-stat/badge-stat.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LaporanHarianPageRoutingModule,
    ScreenViewComponentModule,
    BadgeStatComponentModule
  ],
  declarations: [LaporanHarianPage]
})
export class LaporanHarianPageModule {}
