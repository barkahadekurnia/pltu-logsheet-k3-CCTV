import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database/database.service';
import * as moment from 'moment';
import { SharedService } from 'src/app/services/shared/shared.service';

@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.page.html',
  styleUrls: ['./activity-logs.page.scss'],
})
export class ActivityLogsPage {
  activityLogs: any[];
  sourceActivityLogs: any[];

  isHeaderVisible: boolean;
  loading: boolean;
  loaded: number;

  constructor(
    private router: Router,
    private platform: Platform,
    private database: DatabaseService,
    public shared: SharedService,
  ) {
    this.activityLogs = [];
    this.sourceActivityLogs = [];

    this.isHeaderVisible = false;
    this.loading = true;
    this.loaded = 20;
    // this.shared.setBackButtonVisible = true;
  }

  async ionViewWillEnter() {
    // if (this.router.url.includes('tabs')) {
    //   this.shared.setBackButtonVisible = false;
    // }
    this.platform.ready().then(() => this.getActivityLogs());

  }

  doRefresh(e: any) {
    this.getActivityLogs().finally(() => e.target.complete());
  }

  onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

  openDetails(log: any) {
    const data = JSON.stringify(log);
    return this.router.navigate(['activity-log-details', { data }]);
  }

  pushData(event: any) {
    setTimeout(async () => {
      const start = this.activityLogs.length;

      if (start < this.sourceActivityLogs.length) {
        let end = start + 20;

        end = end > this.sourceActivityLogs.length
          ? this.sourceActivityLogs.length
          : end;

        this.activityLogs.push(
          ...this.sourceActivityLogs.slice(start, end)
        );

        if (this.loaded < this.activityLogs.length) {
          this.loaded = this.activityLogs.length;
        }
      }

      event.target.complete();
    }, 500);
  }

  private async getActivityLogs() {
    try {
      const result = await this.database.select('activityLog', {
        orderBy: [{
          column: 'logId',
          desc: true
        }]
      });

      this.sourceActivityLogs = this.database.parseResult(result)
        .map((item: any) => {
          const timestamp = moment(item.time, 'YYYY-MM-DD HH:mm:ss')
            .format('dddd, D MMMM YYYY HH:mm');

          return { ...item, timestamp };
        });
    } catch (error) {
      console.error(error);
    } finally {
      this.activityLogs = this.sourceActivityLogs.slice(0, this.loaded);
      this.loading = false;
    }
  }
}
