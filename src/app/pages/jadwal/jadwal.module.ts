import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { JadwalPageRoutingModule } from './jadwal-routing.module';

import { JadwalPage } from './jadwal.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    JadwalPageRoutingModule,
    ScreenViewComponentModule

  ],
  declarations: [JadwalPage]
})
export class JadwalPageModule { }
