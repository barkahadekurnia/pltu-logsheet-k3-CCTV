import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AssetDetailPageRoutingModule } from './asset-detail-routing.module';

import { AssetDetailPage } from './asset-detail.page';


import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PickerScreenComponentModule } from 'src/app/components/picker-screen/picker-screen.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AssetDetailPageRoutingModule,
    PickerScreenComponentModule
  ],
  declarations: [AssetDetailPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AssetDetailPageModule {}
