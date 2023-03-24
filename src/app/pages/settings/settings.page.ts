import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, AlertController, LoadingController, NavController } from '@ionic/angular';
import { App, AppInfo } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { Device } from '@capacitor/device';
import { TextZoom } from '@capacitor/text-zoom';
import { BarcodeScanner, ScanOptions, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService, UserData } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  textZoom: number;
  imageQuality: number;
  offlinePhotos: boolean;
  autoUpload: boolean;

  isHeaderVisible: boolean;
  isBackButtonVisible: boolean;
  isAuthenticated: boolean;
  user: UserData;

  constructor(
    private router: Router,
    private platform: Platform,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private database: DatabaseService,
    public shared: SharedService,
    private utils: UtilsService
  ) {
    this.textZoom = 10;
    this.imageQuality = 0;
    this.offlinePhotos = false;
    this.autoUpload = false;

    // this.shared.setBackButtonVisible = true;
    this.isHeaderVisible = true;
    this.isAuthenticated = false;
    this.user = {};
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.isAuthenticated = this.shared.isAuthenticated;
      this.user = this.shared.user;
      this.autoUpload = this.shared.actionAfterSave === 'upload';
      this.textZoom = this.shared.textZoom * 10;

      this.imageQuality = {
        low: 0,
        normal: 1,
        high: 2,
      }[this.shared.imageQuality];

      this.offlinePhotos = this.shared.isOfflineImages;
    });
  }

  ionViewWillEnter() {
    console.log(this.router.url);

    // if (this.router.url.includes('tabs')) {
    //   this.shared.setBackButtonVisible = false;
    // }
  }

  onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

  public textZoomFormatter(value: number) {
    return (value / 10).toFixed(1);
  }

  public imageQualityFormatter(value: number) {
    return ['Low', 'Normal', 'High'][value];
  }

  openPage(commands: any[]) {
    return this.router.navigate(commands);
  }

  onTextZoomChanged(e: any) {
    const value = e.detail.value / 10;
    TextZoom.set({ value });
    this.shared.setTextZoom(value);
  }

  onImageQualityChanged(e: any) {
    const quality = ['low', 'normal', 'high'][e.detail.value];
    this.shared.setImageQuality(quality as 'low' | 'normal' | 'high');
  }

  onOfflinePhotosChanged(e: any) {
    this.offlinePhotos = e.detail.checked;
    this.shared.setOfflineImages(e.detail.checked);
  }

  onAutoUploadChanged(e: any) {
    this.autoUpload = e.detail.checked;
    this.shared.setActionAfterSave(e.detail.checked ? 'upload' : 'local');
  }

  async scanQrCode() {
    const permission = await BarcodeScanner.checkPermission({ force: true });
    if (permission.granted) {
      BarcodeScanner.hideBackground();
      document.body.classList.add('qrscanner');

      const options: ScanOptions = {
        targetedFormats: [SupportedFormat.QR_CODE]
      };

      BarcodeScanner.startScan(options).then(async (result) => {
        this.utils.overrideBackButton();
        document.body.classList.remove('qrscanner');

        if (result.hasContent) {
          const alert = await this.alertCtrl.create({
            header: 'Result',
            message: result.content,
            mode: 'ios',
            cssClass: 'dark:ion-bg-gray-800',
            buttons: [
              {
                text: 'Cancel',
                role: 'cancel'
              },
              {
                text: 'Copy',
                handler: () => {
                  Clipboard.write({
                    // eslint-disable-next-line id-blacklist
                    string: result.content
                  });
                }
              }
            ]
          });

          alert.present();
        }
      });

      this.utils.overrideBackButton(() => {
        this.utils.overrideBackButton();
        document.body.classList.remove('qrscanner');
        BarcodeScanner.showBackground();
        BarcodeScanner.stopScan();
      });
    }
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
}
