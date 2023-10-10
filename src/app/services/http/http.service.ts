/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable, Injector } from '@angular/core';
import { Platform, LoadingController, NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Storage } from '@capacitor/storage';
import {
  Http,
  HttpOptions,
  HttpUploadFileOptions,
  HttpDownloadFileOptions
} from '@capacitor-community/http';

import { timeout, retry } from 'rxjs/operators';

import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService, MyAlertOptions } from 'src/app/services/utils/utils.service';
import { environment } from 'src/environments/environment';

export type LoginData = {
  username: string;
  password: string;
};
export type LaporanData = {
  reportDate: string;
  parentNotes: string;
};

export type RecordData = {
  trxId: string;
  scheduleTrxId: string;
  parameterId: string;
  value: string;
  syncAt: string;
  scannedAt: string;
  scannedEnd: string;
  scannedBy: string;
  scannedWith: string;
  scannedNotes: string;
  condition: string;
};
export type Rfid = {
  rfid: string;
};
export type AssetIdToType = {
  asset: string;
};
export type RecordAttachment = {
  scheduleTrxId: string;
  trxId?: string;
  filePath: string;
  type: string;
  notes: string;
  parameterId: string;
  timestamp: string;
};
export type RecordAttachmentApar = {
  scheduleTrxId: string;
  trxId?: string;
  filePath: string;
  type: string;
  notes: string;
  timestamp: string;
};

export type ActivityData = {
  activity: string;
  ip: null;
  assetId: string | null;
  data: string;
  time: string;
};

export type RequestSet = {
  requests: (() => Promise<any>)[];
  onSuccess?: (responses: any[]) => void | any;
  onError?: (error: any) => void | any;
  onComplete?: () => void | any;
};

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  timeout: number;
  retry: number;

  constructor(
    private injector: Injector,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private httpClient: HttpClient,
  ) {
    this.timeout = 10000;
    this.retry = 3;
  }

  get token() {
    const shared = this.injector.get(SharedService);
    return shared.user.token;
  }

  getAnyData(url, params?: any) {
    const options: HttpOptions = {
      url,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      params,
      responseType: 'json'
    };

    return Http.get(options);
  }

  postAnyData(url: string, data) {
    const observable = this.httpClient
      .post(url, data, {
        headers: {
          Authorization: `Bearer ${this.token}`
        },
        observe: 'response',
        responseType: 'json'
      })
      .pipe(timeout(this.timeout), retry(this.retry));

    return observable.toPromise();


    // const options: HttpOptions = {
    //   url,
    //   headers: {
    //     Authorization: `Bearer ${this.token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   data,
    //   responseType: 'json'
    // };

    // return Http.post(options);
  }

  postAnyDataJson(url: string, data) {
    const observable = this.httpClient
      .post(url, data, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        observe: 'response',
        responseType: 'json'
      })
      .pipe(timeout(this.timeout), retry(this.retry));

    return observable.toPromise();
  }

  postAnyDataNative(url: string, data) {
    const options = {
      url, 
      data, 
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    }
    const observable = Http.post(options);

    return observable;
  }

  login(data: LoginData) {

    const options: HttpOptions = {
      url: environment.url.login,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data,
      responseType: 'json'
    };

    return Http.post(options);
  }
  kirimlaporan(id: string, data: LaporanData) {

    const options: HttpOptions = {
      url: environment.url.kirimlaporan + '/' + id,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data,
      responseType: 'json'
    };

    return Http.post(options);
  }

  getAssets(params: { tag?: string; tagLocation?: string } = {}) {
    const options: HttpOptions = {
      url: environment.url.assets,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      params,
      responseType: 'json'
    };

    return Http.get(options);
  }
  getAssetsId(params: string) {
    const options: HttpOptions = {
      url: environment.url.assetsid + '/' + params,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };

    return Http.get(options);
  }
  getAssetsDetail(params: string) {
    const options: HttpOptions = {
      url: environment.url.assetsdetail + '/' + params,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };

    return Http.get(options);
  }

  getAssetTags() {
    const options: HttpOptions = {
      url: environment.url.tags,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };

    return Http.get(options);
  }
  typeTag(data: AssetIdToType) {
    console.log('data cek type', data);
    const options: HttpOptions = {
      url: environment.url.tagsscan,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      data,
      responseType: 'json'
    };

    return Http.post(options);
  }
  getAssetTagsAsset(asset) {
    const options: HttpOptions = {
      url: environment.url.tags + '?asset=' + asset,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };

    return Http.get(options);
  }
  getjadwal(params: { tanggal?: string } = {}) {
    const options: HttpOptions = {
      url: environment.url.jadwal,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      params,
      responseType: 'json'
    };

    return Http.get(options);
  }

  getjadwaldate(params: { userId?: string; date?: string } = {}, categoryid) {
    // eslint-disable-next-line max-len
    //http://114.6.64.2:11241/api/logsheet_dev/api/schedule/getAssetByCategory/c3777b68-ba7e-11ec-adb0-a8ea9c4fb59f?userId=6596&date=2022-12-08
    const options: HttpOptions = {
      url: environment.url.jadwaldate + '/' + categoryid,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      params,
      responseType: 'json'
    };

    return Http.get(options);
  }
  getapar() {
    const options: HttpOptions = {
      url: environment.url.apar,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };

    return Http.get(options);
  }
  changerfid(params: string, data: Rfid) {
    const options: HttpOptions = {
      url: environment.url.changerfid + '/' + params,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      data,
      responseType: 'json'
    };

    return Http.post(options);
  }
  getCountAsset() {
    const options: HttpOptions = {
      url: environment.url.countassets,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };

    return Http.get(options);
  }
  // getTags(params: { tag?: string; tagLocation?: string } = {}) {
  //   const options: HttpOptions = {
  //     url: environment.url.tags,
  //     headers: {
  //       Authorization: `Bearer ${this.token}`
  //     },
  //     params,
  //     responseType: 'json'
  //   };

  //   return Http.get(options);
  // }

  // getTagLocations(params: { tag?: string; tagLocation?: string } = {}) {
  //   const options: HttpOptions = {
  //     url: environment.url.tagLocations,
  //     headers: {
  //       Authorization: `Bearer ${this.token}`
  //     },
  //     params,
  //     responseType: 'json'
  //   };

  //   return Http.get(options);
  // }

  getParameters(data: AssetIdToType) {
    console.log(data);
    
    const options: HttpOptions = {
      url: environment.url.parameters,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'multipart/form-data'
      },
      data,
      responseType: 'json'
    };

    return Http.post(options);
  }

  getSchedules(params: { groupOperatorId?: string } = {}) {
    const options: HttpOptions = {
      url: environment.url.schedules,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      params,
      responseType: 'json'
    };

    return Http.get(options);
  }

  getSchedulesShift(params) {
    const options: HttpOptions = {
      url: environment.url.schedulesShift + '/'+ params,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };

    return Http.get(options);
  }
  
  getSchedulesnonsift(params: { userId?: string } = {}) {
    const options: HttpOptions = {
      url: environment.url.schedulesnonsift,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      params,
      responseType: 'json'
    };

    return Http.get(options);
  }
  getSchedulesnonsiftadmin() {
    const options: HttpOptions = {
      url: environment.url.schedulesnonsift,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };

    return Http.get(options);
  }
  getSchedulesManual(params: { userId?: string } = {}) {
    const options: HttpOptions = {
      url: environment.url.schedulesnonmanual,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      params,
      responseType: 'json'
    };

    return Http.get(options);
  }
  getSchedulesManualadmin() {
    const options: HttpOptions = {
      url: environment.url.schedulesnonmanual,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };

    return Http.get(options);
  }
  //http://114.6.64.2:11241/api/logsheet_dev/api/transaction/schedule/nonShift?userId=6596
  //http://114.6.64.2:11241/api/logsheet_new/api/transaction/schedule/viewTrxParent/
  getGroupOperator(params) {
    const options: HttpOptions = {
      url: environment.url.grupoperator + '/' + params,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };
    return Http.get(options);
  }
  getDetailLaporan(params) {
    const options: HttpOptions = {
      url: environment.url.detaillaporan + '/' + params,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };
    return Http.get(options);
  }
  getCategory() {
    const options: HttpOptions = {
      url: environment.url.category,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      responseType: 'json'
    };
    return Http.get(options);
  }
  getLaporan(params: { userId?: string } = {}) {
    const options: HttpOptions = {
      url: environment.url.laporanpetugas,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      params,
      responseType: 'json'
    };
    return Http.get(options);
  }

  uploadRecords(data: RecordData[]) {
    const options: HttpOptions = {
      url: environment.url.records,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      data,
      responseType: 'json'
    };

    return Http.post(options);
  }

  uploadRecordAttachment(attachment: RecordAttachment) {
    const options: HttpUploadFileOptions = {
      url: environment.url.recordAttachment,
      name: 'filePath',
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      data: {
        scheduleTrxId: attachment.scheduleTrxId,
        notes: attachment.notes,
        trxId: attachment.trxId,
        timestamp: attachment.timestamp,
        parameterId: attachment.parameterId
      },
      filePath: attachment.filePath,
      responseType: 'json',
    };

    if (attachment.trxId) {
      options.data.trxId = attachment.trxId;
    }

    return Http.uploadFile(options);
  }

  uploadRecordAttachmentApar(attachment: RecordAttachmentApar) {
    const options: HttpUploadFileOptions = {
      url: environment.url.attach,
      name: 'filePath',
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      data: {
        scheduleTrxId: attachment.scheduleTrxId,
        notes: attachment.notes,
        trxId: attachment.trxId,
        timestamp: attachment.timestamp
      },
      filePath: attachment.filePath,
      responseType: 'json',
    };

    if (attachment.trxId) {
      options.data.trxId = attachment.trxId;
    }

    return Http.uploadFile(options);
  }

  uploadActivityLogs(data: ActivityData[]) {
    const options: HttpOptions = {
      url: environment.url.activityLogs,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      data,
      responseType: 'json'
    };

    return Http.post(options);
  }

  uploadDetailLocation(tagId, data: any) {
    const options: HttpOptions = {
      url: `${environment.url.updateLocation}/${tagId}`,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      data,
      responseType: 'json'
    };

    return Http.put(options);
  }

  //upgrade buat edit lokasi
  selectionUnit() {
    const options: HttpOptions = { 
      url: `${environment.url.selectionUnit}`,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      responseType: 'json'
    }

    return Http.get(options);
  }

  selectionArea(unitId:any) {
    const options: HttpOptions = {
      url: `${environment.url.selectionArea}${unitId}`,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type' :'application/json'
      },
      responseType: 'json'
    }

    return Http.get(options);
  }

  selectionTandaPemasangan(areaId:any) {
    const options: HttpOptions = {
      url: `${environment.url.selectionArea}${areaId}`,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type' :'application/json'
      },
      responseType: 'json'
    }

    return Http.get(options);
  }

  async refreshToken() {
    const utils = this.injector.get(UtilsService);
    // console.log('utils', utils);
    // console.log('environment.values.form', environment.values.form);

    const { value } = await Storage.get({
      key: environment.values.form
    });

    const form = utils.parseJson(value);
    console.log('form', form);

    if (form) {
      const password = await utils.decrypt(form?.password);
      const data = { ...form, password };

      await this.requests({
        requests: [() => this.login(data)],
        onSuccess: async ([response]) => {
          if (response.status >= 400) {
            throw response;
          }

          const shared = this.injector.get(SharedService);

          shared.setUserData({
            token: response?.data?.data?.token
          });
        },
        onError: () => { }
      });
    }
  }

  async download(options: HttpDownloadFileOptions) {
    return Http.downloadFile(options);
  }

  requests(options: RequestSet) {
    let retry = 1;

    const doRequest = async (withFinally = true) => {
      try {
        const responses = await Promise.all(options.requests.map(request => request()));
        const [response] = responses;

        if (response.status === 401) {
          throw response;
        }

        await options?.onSuccess?.(responses);
      } catch (error) {
        if (error?.status === 401 && retry > 0) {
          retry--;

          await this.refreshToken();
          await doRequest(false);
        } else if (options?.onError) {
          await options.onError(error);
        } else {
          await this.showError(error);
        }
      } finally {
        if (withFinally) {
          await options?.onComplete?.();
        }
      }
    };

    return doRequest();
  }

  async showError(error: any, alertOptions: MyAlertOptions = {}) {
    const utils = this.injector.get(UtilsService);

    const alert = await utils.createCustomAlert({
      type: 'error',
      header: 'Error',
      message: this.getErrorMessage(error),
      buttons: [
        error?.status === 401
          ? {
            text: 'Logout',
            handler: async () => {
              await alert.dismiss();

              const loader = await this.loadingCtrl.create({
                spinner: 'dots',
                message: 'Logging out...',
                cssClass: 'dark:ion-bg-gray-800',
                mode: 'ios'
              });

              loader.present();
              utils.stopMonitor();

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
                    message: 'User logged out because the session timed out',
                    status: 'success'
                  }
                });
              }

              await this.navCtrl.navigateRoot('login');
              loader.dismiss();
            }
          }
          : {
            text: 'Close',
            handler: () => alert.dismiss()
          }
      ],
      ...alertOptions
    });

    alert.present();
  }

  getErrorMessage(error: any) {
    if (typeof error === 'string' && error) {
      return error;
    }

    if (typeof error?.message === 'string' && error?.message) {
      if (error.message === 'ConnectException') {
        return 'Failed to connect to server, please check your connection!';
      }

      return error.message;
    }

    if (typeof error?.message === 'object' && error?.message != null) {
      for (const value of Object.values(error.message)) {
        if (typeof value === 'string' && value) {
          return value;
        }
      }
    }

    return this.getHttpStatusError(error?.status)
      || 'An error occurred while making a request to the server';
  }

  getHttpStatusError(status: number) {
    if (status === 400) {
      return 'Bad Request';
    }

    if (status === 401) {
      return 'Your session is expired, please relogin!';
    }

    if (status === 403) {
      return 'Forbidden';
    }

    if (status === 404) {
      return 'Not Found';
    }

    if (status === 405) {
      return 'Method Not Allowed';
    }

    if (status === 408) {
      return 'Request Timeout';
    }

    if (status === 500) {
      return 'Internal Server Error';
    }

    if (status === 502) {
      return 'Bad Gateway';
    }

    if (status === 503) {
      return 'Service Unavailable';
    }

    if (status === 504) {
      return 'Gateway Timeout';
    }

    return null;
  }
}
