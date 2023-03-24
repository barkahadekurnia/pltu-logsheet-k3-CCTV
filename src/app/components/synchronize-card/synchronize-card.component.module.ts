/* eslint-disable max-len */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SynchronizeCardComponent } from './synchronize-card.component';

import { IllustrationSynchronizeComponentModule } from 'src/app/components/illustration-synchronize/illustration-synchronize.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IllustrationSynchronizeComponentModule
  ],
  exports: [SynchronizeCardComponent],
  declarations: [SynchronizeCardComponent]
})
export class SynchronizeCardComponentModule { }
