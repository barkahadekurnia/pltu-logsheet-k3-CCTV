import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IllustrationQrScanComponent } from './illustration-qr-scan.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [IllustrationQrScanComponent],
  declarations: [IllustrationQrScanComponent]
})
export class IllustrationQrScanComponentModule { }
