import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverOptions } from '@ionic/core';

import {
  Platform,
  IonRouterOutlet,
  NavController,
  LoadingController,
  PopoverController,
  AlertOptions,
} from '@ionic/angular';

import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Storage } from '@capacitor/storage';
import { AES256 } from '@awesome-cordova-plugins/aes-256/ngx';
import { SharedService } from 'src/app/services/shared/shared.service';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';

import {
  CustomAlertComponent,
  CustomAlertOptions
} from 'src/app/components/custom-alert/custom-alert.component';

export interface MyAlertOptions extends CustomAlertOptions {
  backdropDismiss?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  private alert: HTMLIonAlertElement | HTMLIonPopoverElement;
  private interval: any;
  private secureKey: string;
  private secureIV: string;
  private routerOutlet: IonRouterOutlet;
  private isBackButtonEnabled: boolean;
  alertCtrl: any;

  constructor(
    private injector: Injector,
    private platform: Platform,
    private router: Router,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private popoverCtrl: PopoverController,
    private aes256: AES256,
  ) {
    this.isBackButtonEnabled = true;
  }

  setRouterOutlet(routerOutlet: IonRouterOutlet) {
    this.routerOutlet = routerOutlet;
  }

  createCustomAlert(alertOptions: MyAlertOptions) {
    const { backdropDismiss, ...options } = alertOptions;

    const popoverOptions: PopoverOptions = {
      component: CustomAlertComponent,
      componentProps: { options },
      cssClass: 'alert-popover center-popover',
      mode: 'ios',
      backdropDismiss
    };

    return this.popoverCtrl.create(popoverOptions);
  }
  async createAlert(options: AlertOptions) {
    const alert = await this.alertCtrl.create(options);
    alert.present();

    return alert;
  }
  async presentLoader() {
    const loader = await this.loadingCtrl.create({
      spinner: null,
      message: `<img src="assets/img/loader.gif" class="w-20 h-20" />`,
      cssClass: 'custom-loader',
      backdropDismiss: true,
      mode: 'ios',
    });
    await loader.present();
    return loader;
  }
  async encrypt(data: string) {
    if (!this.platform.is('capacitor')) {
      return data;
    }

    if (!this.secureKey) {
      const { value } = await Storage.get({
        key: environment.values.secureKey
      });

      this.secureKey = value;
    }

    if (!this.secureKey) {
      this.secureKey = await this.aes256.generateSecureKey(environment.values.salt);

      await Storage.set({
        key: environment.values.secureKey,
        value: this.secureKey
      });
    }

    if (!this.secureIV) {
      const { value } = await Storage.get({
        key: environment.values.secureIV
      });

      this.secureIV = value;
    }

    if (!this.secureIV) {
      this.secureIV = await this.aes256.generateSecureIV(environment.values.salt);

      await Storage.set({
        key: environment.values.secureIV,
        value: this.secureIV
      });
    }

    return this.aes256.encrypt(this.secureKey, this.secureIV, data);
  }

  async decrypt(data: string) {
    if (!this.platform.is('capacitor')) {
      return data;
    }

    if (!this.secureKey) {
      const { value } = await Storage.get({
        key: environment.values.secureKey
      });

      this.secureKey = value;
    }

    if (!this.secureIV) {
      const { value } = await Storage.get({
        key: environment.values.secureIV
      });

      this.secureIV = value;
    }

    return this.aes256.decrypt(this.secureKey, this.secureIV, data);
  }

  getTime() {
    try {
      const shared = this.injector.get(SharedService);
      moment.locale('id')

      if (!shared.isAuthenticated) {
        throw new Error();
      }

      const user = shared.user;

      const serverTimeAtLogin = new Date(
        moment(user.serverTimeAtLogin, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss')
      ).getTime();

      const localTimeAtLogin = new Date(
        moment(user.localTimeAtLogin).format('YYYY-MM-DDTHH:mm:ss')
      ).getTime();

      const offset = serverTimeAtLogin - localTimeAtLogin;
      const timeNow = offset + moment().valueOf();

      return isNaN(timeNow) ? moment().valueOf() : timeNow;
    } catch (error) {
      return moment().valueOf();
    }
  }
  getTimeNow() {
    try {
      const shared = this.injector.get(SharedService);
      moment.locale('id')

      if (!shared.isAuthenticated) {
        throw new Error();
      }

      const user = shared.user;
      const current = new Date();

      const serverTimeAtLogin = new Date(
        moment(current, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss')
      ).getTime();

      const localTimeAtLogin = new Date(
        moment(current).format('YYYY-MM-DDTHH:mm:ss')
      ).getTime();

      const offset = serverTimeAtLogin - localTimeAtLogin;
      const timeNow = offset + moment().valueOf();

      return isNaN(timeNow) ? moment().valueOf() : timeNow;
    } catch (error) {
      return moment().valueOf();
    }
  }

  startMonitor() {
    this.stopMonitor();
    const shared = this.injector.get(SharedService);

    if (shared.isAuthenticated) {
      this.monitor();
      this.interval = setInterval(() => this.monitor(), 30000);
    }
  }

  stopMonitor() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  back(depth: number = 1) {
    if (this.routerOutlet && !this.routerOutlet.canGoBack()) {
      if (this.router.url.startsWith('/login') || this.router.url.startsWith('/tabs')) {
        return App.exitApp();
      }

      return this.navCtrl.navigateRoot('tabs');
    }

    return this.routerOutlet.pop(depth > 0 ? depth : 1);
  }

  overrideBackButton(callback?: () => any | void) {
    return this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.isBackButtonEnabled && callback) {
        return callback();
      } else if (this.isBackButtonEnabled) {
        return this.back();
      }
    });
  }

  enableBackButton() {
    this.isBackButtonEnabled = true;
  }

  disableBackButton() {
    this.isBackButtonEnabled = false;
  }

  parseJson(data: string) {
    try {
      const value = JSON.parse(data);
      return value;
    } catch {
      return data;
    }
  }

  parseFloat(data: string, defaultValue = 0.0) {
    try {
      const value = parseFloat(data);
      return value;
    } catch (error) {
      return defaultValue;
    }
  }

  delay(delay: number) {
    return new Promise<void>(resolve => {
      setTimeout(() => resolve(), delay);
    });
  }

  generateArray(end: number, start?: number, step?: number) {
    return Array.from(this.range(end, start, step));
  }

  chunkArray(arr, num) {
    const chunks = (a, size) =>
      Array.from(
        new Array(Math.ceil(a.length / size)),
        (_, i) => a.slice(i * size, i * size + size)
      );

    return chunks(arr, num);
  }

  capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1) || str;
  }

  private async isCheated() {
    try {
      const shared = this.injector.get(SharedService);

      if (!shared.lastOpened) {
        throw new Error();
      }

      const now = this.getTime();
      const lastOpened = new Date(shared.lastOpened).getTime();

      if (!isNaN(lastOpened) && (now - lastOpened < 0)) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  private async monitor() {
    this.alert?.dismiss();
    const isCheated = await this.isCheated();

    if (!isCheated) {
      const shared = this.injector.get(SharedService);
      const now = this.getTime();
      shared.setLastOpened(moment(now).format('YYYY-MM-DDTHH:mm:ss'));
    } else {
      this.alert = await this.createCustomAlert({
        backdropDismiss: false,
        type: 'warning',
        header: 'Warning',
        message: 'Your clock is behind, please return to the current time!',
        buttons: [
          {
            text: 'Clear Data',
            handler: async () => {
              await this.alert.dismiss();

              const loader = await this.loadingCtrl.create({
                spinner: 'dots',
                message: 'Clearing data...',
                cssClass: 'dark:ion-bg-gray-800',
                mode: 'ios'
              });

              loader.present();
              this.stopMonitor();

              const shared = this.injector.get(SharedService);
              const userId = shared.user.id;
              await shared.clearAppData();

              if (this.platform.is('capacitor')) {
                const appInfo = await App.getInfo();
                const deviceInfo = await Device.getInfo();

                await shared.addLogActivity({
                  userId,
                  activity: 'User Logout from Mobile Scanner',
                  data: {
                    appVersion: appInfo.version,
                    operatingSystem: deviceInfo.operatingSystem,
                    osVersion: deviceInfo.osVersion,
                    message: 'User logged out due to incorrect time setting',
                    status: 'success'
                  }
                });
              }

              await this.navCtrl.navigateRoot('login');
              loader.dismiss();
            }
          },
          {
            text: 'Close App',
            handler: () => App.exitApp()
          }
        ]
      });

      this.alert.present();
    }
  }

  private *range(end: number, start: number = 1, step: number = 1) {
    for (let i = start; i <= end; i = i + step) {
      yield i;
    }
  }
}
