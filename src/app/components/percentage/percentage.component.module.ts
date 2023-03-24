import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { IonicModule } from '@ionic/angular';
import { PercentageComponent } from './percentage.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgxEchartsModule,
    IonicModule
  ],
  exports: [PercentageComponent],
  declarations: [PercentageComponent]
})
export class PercentageComponentModule { }
