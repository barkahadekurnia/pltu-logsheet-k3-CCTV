import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { BadgeStatComponent } from './badge-stat.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [BadgeStatComponent],
  declarations: [BadgeStatComponent]
})
export class BadgeStatComponentModule { }
