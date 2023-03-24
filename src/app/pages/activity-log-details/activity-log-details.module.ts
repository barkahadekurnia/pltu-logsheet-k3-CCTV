import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivityLogDetailsPageRoutingModule } from './activity-log-details-routing.module';

import { ActivityLogDetailsPage } from './activity-log-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivityLogDetailsPageRoutingModule
  ],
  declarations: [ActivityLogDetailsPage]
})
export class ActivityLogDetailsPageModule {}
