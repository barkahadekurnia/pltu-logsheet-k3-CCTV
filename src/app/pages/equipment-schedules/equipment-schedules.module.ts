import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EquipmentSchedulesPageRoutingModule } from './equipment-schedules-routing.module';

import { EquipmentSchedulesPage } from './equipment-schedules.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';
import { BadgeStatComponentModule } from 'src/app/components/badge-stat/badge-stat.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EquipmentSchedulesPageRoutingModule,
    ScreenViewComponentModule,
    BadgeStatComponentModule
  ],
  declarations: [EquipmentSchedulesPage]
})
export class EquipmentSchedulesPageModule {}
