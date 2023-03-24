import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { BadgeStatComponentModule } from 'src/app/components/badge-stat/badge-stat.component.module';
import { PercentageComponentModule } from 'src/app/components/percentage/percentage.component.module';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    BadgeStatComponentModule,
    PercentageComponentModule,
    ScreenViewComponentModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
