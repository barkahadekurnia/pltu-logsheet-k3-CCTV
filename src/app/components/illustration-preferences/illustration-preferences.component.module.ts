import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IllustrationPreferencesComponent } from './illustration-preferences.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [IllustrationPreferencesComponent],
  declarations: [IllustrationPreferencesComponent]
})
export class IllustrationPreferencesComponentModule { }
