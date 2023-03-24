import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormPreviewPageRoutingModule } from './form-preview-routing.module';

import { FormPreviewPage } from './form-preview.page';
// eslint-disable-next-line max-len
import { IllustrationAttachFileComponentModule } from 'src/app/components/illustration-attach-file/illustration-attach-file.component.module';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormPreviewPageRoutingModule,
    IllustrationAttachFileComponentModule,
    ScreenViewComponentModule
  ],
  declarations: [FormPreviewPage]
})
export class FormPreviewPageModule { }
