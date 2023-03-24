import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AssetCategoryPage } from './asset-category.page';

const routes: Routes = [
  {
    path: '',
    component: AssetCategoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssetCategoryPageRoutingModule {}
