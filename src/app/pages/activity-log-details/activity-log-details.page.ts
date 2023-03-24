import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-activity-log-details',
  templateUrl: './activity-log-details.page.html',
  styleUrls: ['./activity-log-details.page.scss'],
})
export class ActivityLogDetailsPage {
  log: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private utils: UtilsService
  ) { }

  ionViewWillEnter() {
    const transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );

    if (!transitionData) {
      return this.utils.back();
    }

    transitionData.data = this.utils.parseJson(transitionData.data);

    if (transitionData.data) {
      transitionData.data = Array.isArray(transitionData.data)
        ? transitionData.data
        : [transitionData.data];

      transitionData.data = transitionData.data.map((item: any) => {
        const keyName = Object.keys(item).find(key => key.includes('Id'));
        const logId = keyName ? item[keyName] : transitionData.logId;

        return { ...item, logId };
      });
    }

    this.log = transitionData;
  }
}
