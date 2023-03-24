import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SaveOptionsComponent } from './save-options.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [SaveOptionsComponent],
  declarations: [SaveOptionsComponent]
})
export class SaveOptionsComponentModule { }
