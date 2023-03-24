import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AssetCategoryPageRoutingModule } from './asset-category-routing.module';

import { AssetCategoryPage } from './asset-category.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AssetCategoryPageRoutingModule,
    ScreenViewComponentModule
  ],
  declarations: [AssetCategoryPage]
})
export class AssetCategoryPageModule {}
