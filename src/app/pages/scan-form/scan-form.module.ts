import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScanFormPageRoutingModule } from './scan-form-routing.module';

import { ScanFormPage } from './scan-form.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';
import { IllustrationAttachFileComponentModule } from 'src/app/components/illustration-attach-file/illustration-attach-file.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScanFormPageRoutingModule,
    ScreenViewComponentModule,
    IllustrationAttachFileComponentModule
  ],
  declarations: [ScanFormPage]
})
export class ScanFormPageModule {}
