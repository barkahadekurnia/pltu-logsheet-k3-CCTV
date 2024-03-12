import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { PickerScreenComponent } from './picker-screen.component';
import { IllustrationNoDataComponentModule } from '../illustration-no-data/illustration-no-data.component.module';
import { IllustrationProgressComponentModule } from '../illustration-progress/illustration-progress.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IllustrationNoDataComponentModule,
    IllustrationProgressComponentModule,
  ],
  exports: [PickerScreenComponent],
  declarations: [PickerScreenComponent]
})
export class PickerScreenComponentModule { }
