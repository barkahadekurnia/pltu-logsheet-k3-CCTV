import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AttachmentSettingsPageRoutingModule } from './attachment-settings-routing.module';

import { AttachmentSettingsPage } from './attachment-settings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AttachmentSettingsPageRoutingModule
  ],
  declarations: [AttachmentSettingsPage]
})
export class AttachmentSettingsPageModule {}
