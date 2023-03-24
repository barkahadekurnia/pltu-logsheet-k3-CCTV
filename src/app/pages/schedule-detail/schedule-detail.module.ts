import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScheduleDetailPageRoutingModule } from './schedule-detail-routing.module';

import { ScheduleDetailPage } from './schedule-detail.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScheduleDetailPageRoutingModule,
    ScreenViewComponentModule
  ],
  declarations: [ScheduleDetailPage]
})
export class ScheduleDetailPageModule {}
