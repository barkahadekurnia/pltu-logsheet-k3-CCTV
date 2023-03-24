import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SchedulesPageRoutingModule } from './schedules-routing.module';

import { SchedulesPage } from './schedules.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';
import { BadgeStatComponentModule } from 'src/app/components/badge-stat/badge-stat.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SchedulesPageRoutingModule,
    ScreenViewComponentModule,
    BadgeStatComponentModule
  ],
  declarations: [SchedulesPage]
})
export class SchedulesPageModule {}
