import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AttachmentSettingsPage } from './attachment-settings.page';

const routes: Routes = [
  {
    path: '',
    component: AttachmentSettingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttachmentSettingsPageRoutingModule {}
