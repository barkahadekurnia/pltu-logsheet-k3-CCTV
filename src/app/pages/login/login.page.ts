import { UserData } from 'src/app/services/shared/shared.service';
/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, LoadingController, NavController } from '@ionic/angular';
import { App, AppInfo } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Storage } from '@capacitor/storage';
import { AppUpdate, AppUpdateAvailability } from '@robingenz/capacitor-app-update';
import { DatabaseService } from 'src/app/services/database/database.service';
import { HttpService, LoginData } from 'src/app/services/http/http.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { lowerCase, upperCase } from 'lodash';

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
    private utils: UtilsService
  ) {

    this.form = {
      username: '',
      password: ''
    };

    this.isPasswordVisible = false;
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      if (this.platform.is('capacitor')) {
        App.getInfo().then((appInfo: AppInfo) => this.appVersion = `${appInfo.version}.${appInfo.build}` ?? '1.0.0');
        console.log('versi aplikasi',this.appVersion)
      }
    });
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

      loader.present();

      try {
        const response = await this.http.login(this.form);
        console.log('respon login',response)

        if (response.data?.status !== 200) {
          const alert = await this.utils.createCustomAlert({
            type: 'error',
            header: 'Error',
            message: response.data.messages.error,
            buttons: [{
              text: 'Close',
              handler: () => alert.dismiss()
            }]
          })
        alert.present();

          // throw response.data;

        }
        console.log('periksa role',response?.data?.data?.user?.role_group)

        if (upperCase(response?.data?.data?.user?.role_group) == "PETUGAS") {
          this.http.requests({
            requests: [
              () => this.http.getGroupOperator(response?.data?.data?.user?.id),
            ],
            onSuccess: async ([responseGrup]) => {
            console.log('respon jika role petugas', responseGrup)

              if (responseGrup.status >= 400) {
                throw responseGrup;
              }
              this.shared.setUserDetail({
                shift: responseGrup?.data?.data?.shift,
                nonshift: responseGrup?.data?.data?.nonShift,
                lk3: responseGrup?.data?.data?.lk3
              });
              console.log('session userdetail', this.shared.userdetail)

            },

            onError: error => console.error(error)
          });


        }else{
          this.shared.setUserDetail({
            shift: '',
            nonshift: '',
            lk3: ''
          });
        }
        await this.onSuccessLogin(response.data);
      } catch (error) {
        const alert = await this.utils.createCustomAlert({
          type: 'error',
          header: 'Error',
          message: this.http.getErrorMessage(error),
          buttons: [{
            text: 'Close',
            handler: () => alert.dismiss()
          }]
        });

        alert.present();
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
    console.log('parameter onsuccess login', response)

    const parameter = {
      tag: '',
      fullname: response?.data?.user?.name,
      tagLocation: '',
      firstLogin: '1'
    };
    console.log('variable parameter before', parameter)

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
    console.log('session userdata', this.shared.user)

    const password = await this.utils.encrypt(this.form.password);

    await Storage.set({
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
          console.log('response get kategori', responseCategory)

          if (responseCategory.status >= 400) {
            throw responseCategory;
          }
          const kategori = [];
          for (const category of responseCategory?.data?.data) {
            console.log('online', category.assetCategoryIconUrl)
            const offlinePhoto = await this.offlinePhoto('category', category.assetCategoryIconUrl);
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
          console.log('kategori data', kategori)

          await this.database.emptyTable('category')
            .then(() => this.database.insert('category', kategori));

        },
        onError: error => console.error(error)
      });


    } catch (error) {
      console.error(error);
    }

  }

  private async offlinePhoto(type: string, url: string) {
    let filePath: string;
    console.log('data lempar', url)
    try {
      const name = url?.split('/').pop();
      console.log('nama', name)

      const { path } = await this.http.download({
        url,
        filePath: `${name}`,
        fileDirectory: Directory.Data
      });
      filePath = path;
    } catch (error) {
      console.error(error);
    }

    return filePath;
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
