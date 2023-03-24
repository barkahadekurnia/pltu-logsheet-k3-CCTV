import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { App, AppInfo } from '@capacitor/app';
import { UtilsService } from 'src/app/services/utils/utils.service';
import * as moment from 'moment';

@Component({
  selector: 'app-app-information',
  templateUrl: './app-information.page.html',
  styleUrls: ['./app-information.page.scss'],
})
export class AppInformationPage implements OnInit {
  application: {
    id: string;
    name: string;
    version: string;
    build: string;
  };

  versionHistory: {
    data: any[];
    timestamp?: string;
  };

  loading: boolean;
  source: string;

  constructor(
    private platform: Platform,
    private utils: UtilsService
  ) {
    this.application = {
      id: '',
      name: '',
      version: '',
      build: ''
    };

    this.versionHistory = {
      data: []
    };

    this.loading = true;
    this.source = '';
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      if (this.platform.is('capacitor')) {
        App.getInfo().then((appInfo: AppInfo) => {
          this.application.id = appInfo.id;
          this.application.name = appInfo.name;
          this.application.version = appInfo.version;
          this.application.build = appInfo.build;
        });
      }

      this.getVersionHistory();
    });
  }

  doRefresh(e: any) {
    this.getVersionHistory().finally(() => e.target.complete());
  }

  private getVersionHistory() {
    return new Promise<void>(resolve => {
      const now = this.utils.getTime();
      this.source = 'server';

      this.versionHistory = {
        timestamp: moment(now).format('D MMMM YYYY HH:mm'),
        data: [{
          version: 'v1.0.1',
          changeLogs: ['New Release App'],
          timestamp: '5 October 2021 13:00'
        }]
      };

      this.loading = false;
      resolve();
    });

    // return this.http.requests({
    //   requests: [() => this.http.getVersionHistory()],
    //   onSuccess: async ([response]) => {
    //     const versionHistory = {
    //       timestamp: moment(await this.time.now()).format('D MMMM YYYY HH:mm'),
    //       data: response?.data?.map?.((app: any) => ({
    //         version: app.version,
    //         changeLogs: app.description
    //           ? app.description
    //               .split?.('- ')
    //               .map((changeLog: string) => changeLog.trim())
    //               .filter((changeLog: string) => changeLog)
    //           : [],
    //         timestamp: moment(app.timestamp).format('D MMMM YYYY HH:mm')
    //       }))
    //     };

    //     this.source = 'server';
    //     this.versionHistory = versionHistory;
    //     this.logger.run(() => console.log(this.versionHistory));

    //     await this.storage.set('app__versionHistory', this.versionHistory);
    //   },
    //   onError: async () => {
    //     this.source = 'local';
    //     this.versionHistory = await this.storage.get('app__versionHistory');
    //     this.logger.run(() => console.log(this.versionHistory));
    //   },
    //   onComplete: () => this.loading = false
    // });
  }
}
