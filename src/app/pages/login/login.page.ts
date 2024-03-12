/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, LoadingController, NavController } from '@ionic/angular';
import { App, AppInfo } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { DatabaseService } from 'src/app/services/database/database.service';
import { HttpService, LoginData } from 'src/app/services/http/http.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
import { MediaService } from 'src/app/services/media/media.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  form: LoginData;
  appVersion: string;
  isPasswordVisible: boolean;

  constructor(
    private router: Router,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private database: DatabaseService,
    private http: HttpService,
    private shared: SharedService,
    private utils: UtilsService,
    private media: MediaService
  ) {
    this.form = {
      username: '',
      password: ''
    };

    this.isPasswordVisible = false;
  }

  async ngOnInit() {
    this.platform.ready();
    const appInfo: AppInfo = await App.getInfo();
    this.appVersion = `${appInfo.version}.${appInfo.build}` ?? '1.0.0';
  }

  openSettings() {
    return this.router.navigate(['settings']);
  }

  async login() {
    const formValidationResult = this.validateForm();

    if (formValidationResult.ok) {
      const loader = await this.loadingCtrl.create({
        message: 'Harap Tunggu...',
        spinner: 'dots',
        cssClass: 'dark:ion-bg-gray-800',
        mode: 'ios',
      });

      await loader.present();

      try {
        const response = await this.http.login(this.form);

        if (![200, 201].includes(response.data?.status)) {
          throw response;
        }

        await this.onSuccessLogin(response.data);
      } catch (error) {
        console.error(error);
        const alert = await this.utils.createCustomAlert({
          type: 'error',
          header: 'Error',
          message: this.http.getErrorMessage(error),
          buttons: [{
            text: 'Close',
            handler: () => alert.dismiss()
          }]
        });

        await alert.present();
      } finally {
        loader.dismiss();
      }
    } else {
      const alert = await this.utils.createCustomAlert({
        type: 'error',
        header: 'Error',
        message: formValidationResult.message,
        buttons: [{
          text: 'Close',
          handler: () => alert.dismiss()
        }],
      });

      alert.present();
    }
  }

  private async onSuccessLogin(response: any) {
    await this.database.initTables();
    await this.downloadCategory();

    const parameter = {
      tag: '',
      fullname: response?.data?.user?.name,
      tagLocation: '',
      firstLogin: '1'
    };

    this.shared.setUserData({
      id: response?.data?.user?.id,
      name: response?.data?.user?.name,
      email: response?.data?.user?.email,
      group: response?.data?.user?.role_group,
      tempUserId: response?.data?.user?.tempUserId,
      namaperusahaan: response?.data?.user?.nama_perusahaan,
      photo: response?.data?.user?.pas_photo,
      parameter,
      token: response?.data?.token,
      serverTimeAtLogin: moment(response?.data?.server_time_at_login, 'YYYY-MM-DD HH:mm:ss')
        .format('YYYY-MM-DDTHH:mm:ss'),
      localTimeAtLogin: this.utils.getTime()
    });

    const password = await this.utils.encrypt(this.form.password);

    await Preferences.set({
      key: environment.values.form,
      value: JSON.stringify({
        ...this.form,
        password
      })
    });

    if (this.platform.is('capacitor')) {
      const appInfo = await App.getInfo();
      const deviceInfo = await Device.getInfo();

      await this.shared.addLogActivity({
        activity: 'User Login Aplikasi Mobile',
        data: {
          appVersion: appInfo.version,
          operatingSystem: deviceInfo.operatingSystem,
          osVersion: deviceInfo.osVersion,
          message: 'Success',
          status: 'success',
        },
      });
    }

    this.utils.startMonitor();
    await this.navCtrl.navigateRoot('tabs');
  }

  private async downloadCategory() {
    try {
      this.http.requests({
        requests: [
          () => this.http.getCategory(),
        ],
        onSuccess: async ([responseCategory]) => {
          if (![200, 201].includes(responseCategory.status)) {
            throw responseCategory;
          }

          const kategori = [];

          for (const category of responseCategory?.data?.data) {
            const offlinePhoto = category.assetCategoryIconUrl ? await this.offlinePhoto('category', category.assetCategoryIconUrl) : null;

            const data = {
              assetCategoryId: category.id,
              kode: category.code,
              assetCategoryName: category.asset_category_name,
              description: category.description,
              urlImage: category.assetCategoryIconUrl,
              urlOffline: offlinePhoto,
              schType: category.schType,
              assetCategoryType: category.assetCategoryType
            };
            kategori.push(data);
          }

          await this.database.emptyTable('category');
          await this.database.insert('category', kategori);
        },
        onError: error => console.error(error)
      });
    } catch (error) {
      console.error(error);
    }
  }

  private async offlinePhoto(type: string, url: string) {
    try {
      const name = url?.split('/').pop();
      const response = await this.http.nativeGetBlob(url);

      if (![200, 201].includes(response.status)) {
        return response;
      }

      const mimeType = (response.headers as any)?.['Content-Type'] || this.media.getMimeTypes(url);
      const base64 = `data:${mimeType};base64,${response.data}`;
      const blob = await this.media.convertFileToBlob(base64);
      const fileURI = await this.media.writeBlob(blob, name);

      return fileURI;
    } catch (error) {
      console.error(error);
    }

    return null;
  }

  private validateForm() {
    this.form.username = this.form.username.trim();

    if (!this.form.username) {
      return {
        ok: false,
        message: 'Username Tidak Boleh Kosong!'
      };
    }

    this.form.password = this.form.password.trim();

    if (!this.form.password) {
      return {
        ok: false,
        message: 'Password Tidak Boleh Kosong!'
      };
    }

    return {
      ok: true,
      message: 'Success validate form!'
    };
  }
}
