import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IllustrationSynchronizeComponent } from './illustration-synchronize.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [IllustrationSynchronizeComponent],
  declarations: [IllustrationSynchronizeComponent]
})
export class IllustrationSynchronizeComponentModule { }
