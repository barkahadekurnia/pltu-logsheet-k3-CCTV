import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IllustrationNfcScanComponent } from './illustration-nfc-scan.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [IllustrationNfcScanComponent],
  declarations: [IllustrationNfcScanComponent]
})
export class IllustrationNfcScanComponentModule { }
