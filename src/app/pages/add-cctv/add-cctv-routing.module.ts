import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddCctvPage } from './add-cctv.page';

const routes: Routes = [
  {
    path: '',
    component: AddCctvPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddCctvPageRoutingModule {}
