import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MapPickerComponent } from './map-picker.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [MapPickerComponent],
  declarations: [MapPickerComponent]
})
export class MapPickerComponentModule { }
