import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScheduleLokasiPageRoutingModule } from './schedule-lokasi-routing.module';

import { ScheduleLokasiPage } from './schedule-lokasi.page';
import { BadgeStatComponentModule } from 'src/app/components/badge-stat/badge-stat.component.module';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScheduleLokasiPageRoutingModule,
    ScreenViewComponentModule,
    BadgeStatComponentModule
  ],
  declarations: [ScheduleLokasiPage]
})
export class ScheduleLokasiPageModule {}
