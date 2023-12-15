import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AssetDetailPageRoutingModule } from './asset-detail-routing.module';

import { AssetDetailPage } from './asset-detail.page';


import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AssetDetailPageRoutingModule
  ],
  declarations: [AssetDetailPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AssetDetailPageModule {}
