import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppInformationPage } from './app-information.page';

const routes: Routes = [
  {
    path: '',
    component: AppInformationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppInformationPageRoutingModule {}
