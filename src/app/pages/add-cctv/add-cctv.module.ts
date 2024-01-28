import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule ,  ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddCctvPageRoutingModule } from './add-cctv-routing.module';

import { AddCctvPage } from './add-cctv.page';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddCctvPageRoutingModule,

    ReactiveFormsModule,
  ],
  declarations: [AddCctvPage]
})
export class AddCctvPageModule {}
