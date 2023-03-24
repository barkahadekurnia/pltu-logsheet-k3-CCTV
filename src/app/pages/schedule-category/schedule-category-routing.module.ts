import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScheduleCategoryPage } from './schedule-category.page';

const routes: Routes = [
  {
    path: '',
    component: ScheduleCategoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScheduleCategoryPageRoutingModule {}
