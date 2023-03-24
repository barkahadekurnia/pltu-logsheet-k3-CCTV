/* eslint-disable max-len */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ScreenViewComponent } from './screen-view.component';

import { IllustrationNfcScanComponentModule } from 'src/app/components/illustration-nfc-scan/illustration-nfc-scan.component.module';
import { IllustrationNoDataComponentModule } from 'src/app/components/illustration-no-data/illustration-no-data.component.module';
import { IllustrationPreferencesComponentModule } from 'src/app/components/illustration-preferences/illustration-preferences.component.module';
import { IllustrationProgressComponentModule } from 'src/app/components/illustration-progress/illustration-progress.component.module';
import { IllustrationQrScanComponentModule } from 'src/app/components/illustration-qr-scan/illustration-qr-scan.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IllustrationNfcScanComponentModule,
    IllustrationNoDataComponentModule,
    IllustrationPreferencesComponentModule,
    IllustrationProgressComponentModule,
    IllustrationQrScanComponentModule
  ],
  exports: [ScreenViewComponent],
  declarations: [ScreenViewComponent]
})
export class ScreenViewComponentModule { }
