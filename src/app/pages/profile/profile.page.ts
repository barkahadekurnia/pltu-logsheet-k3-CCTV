import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService, UserData } from 'src/app/services/shared/shared.service';
import * as moment from 'moment';
import { LoadingController, NavController, Platform } from '@ionic/angular';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { App, AppInfo } from '@capacitor/app';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: UserData;
  loginAt: string;
  tags: any[];
  tagLocations: any[];

  constructor(
    private database: DatabaseService,
    private shared: SharedService,
    private loadingCtrl: LoadingController,
    private utils: UtilsService,
    private platform: Platform,
    private navCtrl: NavController,
  ) {
    this.user = {};
    this.loginAt = '';
    this.tags = [];
    this.tagLocations = [];
  }

  ngOnInit() {
    this.user = this.shared.user;

    if (this.user.serverTimeAtLogin) {
      this.loginAt = moment(this.user.serverTimeAtLogin).format('D MMMM YYYY HH:mm');
    }

    // if (this.user.parameter?.tag) {
    //   this.getTags().then(tags => {
    //     const userTags = this.user.parameter?.tag?.split?.(',') || [];

    //     for (const tagId of userTags) {
    //       const tag = tags.find(item => item.tagId === tagId);

    //       if (tag) {
    //         this.tags.push(tag);
    //       }
    //     }
    //   });
    // }

    // if (this.user.parameter?.tagLocation) {
    //   this.getTagLocations().then(tagLocations => {
    //     const userTagLocations = this.user.parameter?.tagLocation?.split?.(',') || [];

    //     for (const tagLocationId of userTagLocations) {
    //       const tagLocation = tagLocations.find(item => item.tagLocationId === tagLocationId);

    //       if (tagLocation) {
    //         this.tagLocations.push(tagLocation);
    //       }
    //     }
    //   });
    // }

    this.mainanString()

    console.log('testing')
  }

  async getTags() {
    const tags = [];

    try {
      const result = await this.database.select('tag', {
        groupBy: ['tagId']
      });

      tags.push(
        ...this.database.parseResult(result)
      );
    } catch (error) {
      console.error(error);
    }

    return tags;
  }

  async getTagLocations() {
    const tagLocations = [];

    try {
      const result = await this.database.select('tagLocation', {
        column: ['tagLocationId', 'tagLocationName'],
        groupBy: ['tagLocationId']
      });

      tagLocations.push(
        ...this.database.parseResult(result)
      );
    } catch (error) {
      console.error(error);
    }

    return tagLocations;
  }

  async checkRecords() {
    const loader = await this.loadingCtrl.create({
      spinner: 'dots',
      message: 'Checking data...',
      cssClass: 'dark:ion-bg-gray-800',
      mode: 'ios'
    });

    loader.present();

    try {
      const result = await this.database.select('record', {
        where: {
          query: 'isUploaded=?',
          params: [0]
        },
        limit: 1
      });

      loader.dismiss();

      if (!this.database.parseResult(result).length) {
        return this.confirmLogout();
      }

      const confirm = await this.utils.createCustomAlert({
        type: 'warning',
        header: 'Warning',
        message: 'There are recording data that has not been synchronized to the server, are you sure you want to logout?',
        buttons: [
          {
            text: 'Continue Logout',
            handler: () => {
              confirm.dismiss();
              return this.confirmLogout();
            }
          },
          {
            text: 'Cancel',
            handler: () => confirm.dismiss()
          }
        ]
      });

      confirm.present();
      return confirm;
    } catch (error) {
      console.error(error);
      await loader.dismiss();
      return this.confirmLogout();
    }
  }

  private async confirmLogout() {
    const confirm = await this.utils.createCustomAlert({
      color: 'danger',
      type: 'warning',
      header: 'Confirm',
      message: 'Are you sure want to logout?',
      buttons: [
        {
          text: 'Logout',
          handler: async () => {
            confirm.dismiss();
            return this.logout();
          }
        },
        {
          text: 'Cancel',
          handler: () => confirm.dismiss()
        }
      ],
    });

    confirm.present();
  }

  private async logout() {
    const loader = await this.loadingCtrl.create({
      spinner: 'dots',
      message: 'Logging out...',
      cssClass: 'dark:ion-bg-gray-800',
      mode: 'ios'
    });

    loader.present();
    this.utils.stopMonitor();
    await this.shared.clearAppData();

    if (this.platform.is('capacitor')) {
      const appInfo: AppInfo = await App.getInfo();
      const deviceInfo = await Device.getInfo();

      await this.shared.addLogActivity({
        userId: this.user.id,
        activity: 'User Logout from Mobile Scanner',
        data: {
          appVersion: `${appInfo.version}.${appInfo.build}`,
          operatingSystem: deviceInfo.operatingSystem,
          osVersion: deviceInfo.osVersion,
          message: 'Success logout from application',
          status: 'success'
        }
      });
    }

    await this.navCtrl.navigateRoot('login');
    loader.dismiss();
  }

  mainanString(){
    const url = "http://114.6.64.2:11241/fire/#/landing/c3777b68-ba7e-11ec-adb0-a8ea9c4fb59f/b5fdd272-bcd7-430b-b39e-29b4f38ebc13"

    const urlSplit = url.split("/")

    console.log('url split', urlSplit)
    console.log('url ', url)
  }
}
