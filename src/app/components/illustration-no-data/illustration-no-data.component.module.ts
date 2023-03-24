import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IllustrationNoDataComponent } from './illustration-no-data.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [IllustrationNoDataComponent],
  declarations: [IllustrationNoDataComponent]
})
export class IllustrationNoDataComponentModule { }
