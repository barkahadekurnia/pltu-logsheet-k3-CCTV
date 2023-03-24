import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CheckPageRoutingModule } from './check-routing.module';

import { CheckPage } from './check.page';
import { BadgeStatComponentModule } from 'src/app/components/badge-stat/badge-stat.component.module';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CheckPageRoutingModule,
    BadgeStatComponentModule,
    ScreenViewComponentModule
  ],
  declarations: [CheckPage]
})
export class CheckPageModule {}
