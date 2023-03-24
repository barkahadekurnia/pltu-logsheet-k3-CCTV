import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IllustrationProgressComponent } from './illustration-progress.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [IllustrationProgressComponent],
  declarations: [IllustrationProgressComponent]
})
export class IllustrationProgressComponentModule { }
