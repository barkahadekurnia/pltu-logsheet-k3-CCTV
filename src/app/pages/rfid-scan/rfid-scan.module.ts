import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RfidScanPageRoutingModule } from './rfid-scan-routing.module';

import { RfidScanPage } from './rfid-scan.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RfidScanPageRoutingModule,
    ScreenViewComponentModule
  ],
  declarations: [RfidScanPage]
})
export class RfidScanPageModule { }
