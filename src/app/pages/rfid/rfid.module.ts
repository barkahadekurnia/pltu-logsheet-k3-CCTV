import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RfidPageRoutingModule } from './rfid-routing.module';

import { RfidPage } from './rfid.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RfidPageRoutingModule,
    ScreenViewComponentModule

  ],
  declarations: [RfidPage]
})
export class RfidPageModule { }
