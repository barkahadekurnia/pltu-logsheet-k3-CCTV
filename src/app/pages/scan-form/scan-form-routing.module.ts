import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScanFormPage } from './scan-form.page';

const routes: Routes = [
  {
    path: '',
    component: ScanFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScanFormPageRoutingModule {}
