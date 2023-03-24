import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivityLogsPageRoutingModule } from './activity-logs-routing.module';

import { ActivityLogsPage } from './activity-logs.page';
import { ScreenViewComponentModule } from 'src/app/components/screen-view/screen-view.component.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivityLogsPageRoutingModule,
    ScreenViewComponentModule
  ],
  declarations: [ActivityLogsPage]
})
export class ActivityLogsPageModule {}
