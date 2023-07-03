import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TransactionDetailPageRoutingModule } from './transaction-detail-routing.module';

import { TransactionDetailPage } from './transaction-detail.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';
import { BadgeStatComponentModule } from 'src/app/components/badge-stat/badge-stat.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TransactionDetailPageRoutingModule,
    ScreenViewComponentModule,
    BadgeStatComponentModule
  ],
  declarations: [TransactionDetailPage]
})
export class TransactionDetailPageModule {}
