import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IllustrationAttachFileComponent } from './illustration-attach-file.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [IllustrationAttachFileComponent],
  declarations: [IllustrationAttachFileComponent]
})
export class IllustrationAttachFileComponentModule { }
