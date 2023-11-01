import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ChangeRfidPageRoutingModule } from './change-rfid-routing.module';

import { ChangeRfidPage } from './change-rfid.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChangeRfidPageRoutingModule,
    ScreenViewComponentModule

  ],
  declarations: [ChangeRfidPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChangeRfidPageModule { }
