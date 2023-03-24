import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CustomAlertComponent } from './custom-alert.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [CustomAlertComponent],
  declarations: [CustomAlertComponent]
})
export class CustomAlertComponentModule { }
