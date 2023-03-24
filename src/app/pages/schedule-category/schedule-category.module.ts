import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScheduleCategoryPageRoutingModule } from './schedule-category-routing.module';

import { ScheduleCategoryPage } from './schedule-category.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScheduleCategoryPageRoutingModule
  ],
  declarations: [ScheduleCategoryPage]
})
export class ScheduleCategoryPageModule {}
