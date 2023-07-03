/* eslint-disable @typescript-eslint/semi */
/* eslint-disable @typescript-eslint/member-ordering */
import { UserDetail } from './../../services/shared/shared.service';
/* eslint-disable @typescript-eslint/naming-convention */
import { Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  MenuController,
  ModalController,
  NavController,
  Platform,
  PopoverController,
} from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotificationSchema } from '@capacitor/local-notifications';
import { DatabaseService } from 'src/app/services/database/database.service';
import { HttpService } from 'src/app/services/http/http.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import {
  SharedService,
  UserData,
} from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { Subscriber, Observable } from 'rxjs';
import {
  chain,
  cond,
  groupBy,
  intersection,
  toLower,
  uniq,
  uniqBy,
  zip,
} from 'lodash';
import * as moment from 'moment';

import { CustomAlertButton } from 'src/app/components/custom-alert/custom-alert.component';
import { SynchronizeCardComponent } from 'src/app/components/synchronize-card/synchronize-card.component';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AssetsPage } from '../assets/assets.page';
import {
  BarcodeScanner,
  ScanOptions,
  SupportedFormat,
} from '@capacitor-community/barcode-scanner';
import { NFC } from '@awesome-cordova-plugins/nfc/ngx';

type NfcStatus =
  | 'NO_NFC'
  | 'NFC_DISABLED'
  | 'NO_NFC_OR_NFC_DISABLED'
  | 'NFC_OK';

type RequestOrder = {
  [key: string]: {
    label: string;
    message: string;
    status: string;
    request?: () => any | void;
  };
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private nfcStatus: NfcStatus;

  application: {
    name: string;
    logo: {
      default: string;
      light: string;
      dark: string;
    };
    lastSync: string;
    bgSyncButton: 'btn-primary' | 'btn-success' | 'btn-warning' | 'btn-error';
  };
  akun: {
    nama: string;
    role: string;
  };
  count: {
    uploaded: number;
    unuploaded: number;
    holded: number;
    unscanned: number;
    assets: number;
    laporan: number;
    sudahtransaksi: number;
    belumtransaksi: number;
    sudahlaporan: number;
    belumlaporan: number;
  };
  datalaporan = [];

  jumlahlaporan: any;

  isHeaderVisible: boolean;
  loading: boolean;

  user: UserData;
  detailuser: UserDetail;
  gruprole: any;
  datasift: any;
  datanonsift: any;
  datalk3: any;
  uploadedSchedules = [];
  private syncJob: {
    counter: number;
    order: RequestOrder;
    isUploading: boolean;
  };

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private platform: Platform,
    private popoverCtrl: PopoverController,
    private database: DatabaseService,
    private http: HttpService,
    private notification: NotificationService,
    public shared: SharedService,
    private utils: UtilsService,
    private menuCtrl: MenuController,
    private injector: Injector,
    private nfc1: NFC
  ) {
    this.application = {
      name: 'Digital Logsheet',
      logo: {
        default: 'assets/img/s2p-logo.png',
        light: 'assets/img/s2p-logo.png',
        dark: '',
      },
      lastSync: null,
      bgSyncButton: 'btn-primary',
    };

    this.count = {
      assets: 0,
      uploaded: 0,
      unuploaded: 0,
      holded: 0,
      unscanned: 0,
      laporan:0,
      sudahtransaksi:0,
      belumtransaksi:0,
      sudahlaporan: 0,
      belumlaporan: 0,
    };

    this.syncJob = {
      counter: 0,
      order: {},
      isUploading: false,
    };

    this.isHeaderVisible = false;
    this.loading = true;
    this.user = {};

    this.gruprole = this.shared.user.group;
    this.datasift = this.shared.userdetail.shift;
    this.datanonsift = this.shared.userdetail.nonshift;
    this.datalk3 = this.shared.userdetail.lk3;

    console.log(this.gruprole, this.datasift, this.datanonsift, this.datalk3);
  }

  get applicationLogo() {
    const isDarkMode = 1 + 1 === 4;

    if (isDarkMode && this.application.logo.dark) {
      return this.application.logo.dark;
    }

    if (this.application.logo.light) {
      return this.application.logo.light;
    }

    return this.application.logo.default;
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.user = this.shared.user;
      this.detailuser = this.shared.userdetail;
      this.application.name = 'Digital Damkar';
      this.application.logo.light = 'assets/img/s2p-logo.png';
      this.application.logo.dark = 'assets/img/s2p-logo.png';
    });
  }

  ionViewWillEnter() {
    this.platform.ready().then(() => {
      if (this.shared.lastSynchronize) {
        const now = this.utils.getTime();
        const lastSync = new Date(this.shared.lastSynchronize).getTime();
        const difference = now - lastSync;

        this.application.lastSync = moment(lastSync).from(now);
        this.application.bgSyncButton =
          difference > 18000000
            ? 'btn-error' // 5 hours
            : difference > 7200000
            ? 'btn-warning' // 3 hours
            : 'btn-success';
      } else {
        this.application.lastSync = null;
        this.application.bgSyncButton = 'btn-primary';
      }
      // menghitung chart
      this.getLocalAssets();
    });
  }
  // refresh
  doRefresh(e: any) {
    // menghitung chart
    this.getLocalAssets().finally(() => e.target.complete());
  }

  onScroll(e: any) {
    const val = e.detail.scrollTop > 0;
    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }
  // fungsi buka page dinamis
  openPage(commands: any[]) {
    return this.router.navigate(commands);
  }

  async openModal() {
    const modal = await this.modalCtrl.create({
      component: AssetsPage,
      componentProps: {
        isSearchFocus: true,
      },
      backdropDismiss: true,
    });

    return modal.present();
  }

  async synchronize() {
    // this.http.refreshToken();
    this.syncJob.counter = 0;
    this.syncJob.isUploading = false;
    this.syncJob.order = {
      // records: {
      //   label: 'Records',
      //   status: 'loading',
      //   message: 'Periksa data records...',
      // },
      // recordAttachments: {
      //   label: 'Record Attachments',
      //   status: 'loading',
      //   message: 'Periksa record attachments...',
      // },
      schedules: {
        label: 'Schedules',
        status: 'loading',
        message: 'Mengambil data schedules...',
      },
      assets: {
        label: 'Lokasi',
        status: 'loading',
        message: 'Mengambil data lokasi...',
      },
      activityLogs: {
        label: 'Activity Logs',
        status: 'loading',
        message: 'Periksa Aktivitas Log...',
      },
    };

    const loader = await this.popoverCtrl.create({
      component: SynchronizeCardComponent,
      cssClass: 'alert-popover center-popover',
      backdropDismiss: false,
      mode: 'ios',
      componentProps: {
        options: {
          complexMessage: Object.values(this.syncJob.order),
          observable: new Observable((subscriber) => {
            // this.syncJob.order.records.request = () =>
            //   this.uploadRecords(subscriber, loader);

            // this.syncJob.order.recordAttachments.request = () =>
            //   this.uploadRecordAttachments(subscriber, loader);

            this.syncJob.order.schedules.request = () =>
              this.getSchedules(subscriber, loader);

            this.syncJob.order.assets.request = () =>
              this.getAssets(subscriber, loader);

            this.syncJob.order.activityLogs.request = () =>
              this.uploadActivityLogs(subscriber, loader);
          }),
        },
      },
    });

    await loader.present();
    const orders = Object.values(this.syncJob.order);

    for (const item of orders) {
      await item.request?.();
    }

    const now = this.utils.getTime();
    this.application.lastSync = moment(now).from(now);
    this.application.bgSyncButton = 'btn-success';
    this.shared.setLastSynchronize(moment(now).format('YYYY-MM-DDTHH:mm:ss'));
  }
  // pengecekan jumlah alat pemadam
  private async getCountAssets() {
    return this.http.requests({
      requests: [() => this.http.getCountAsset()],
      onSuccess: async ([response]) => {
        if (response.status >= 400) {
          throw response;
        }
        this.count.assets = response?.data?.data;

        console.log('data', response?.data?.data);
      },
      onError: (error) => {
        this.shared.addLogActivity({
          activity: 'Gagal mendapatkan data jumlah asset',
          data: {
            message: this.http.getErrorMessage(error),
            status: 'failed',
          },
        });
      },
    });
  }
  async openHarian() {
    const data = JSON.stringify({
      data: this.datalaporan,
    });
    console.log('data json :', JSON.parse(data));
    return this.router.navigate(['laporan-harian', { data }]);
  }
  private async getLocalAssets() {
    try {
      const result = await this.database.select('schedule', {
        column: ['assetId', 'assetStatusName', 'assetNumber', 'assetStatusId'],
        groupBy: ['assetId'],
      });

      const assetsParameterStatuses = await this.getAssetsParameterStatuses();
      // const holdedRecords = await this.getHoldedRecords();
      // console.log('0. chart ', result)
      // console.log('1. data schedule chart ', assetsParameterStatuses)
      const assets = this.database
        .parseResult(result)
        .filter((asset) => {
          const assetParameterStatuses =
            assetsParameterStatuses[asset.assetId] || [];
          // console.log('2. data asetid filter', asset.assetId)
          // console.log('2. data chart filter', assetParameterStatuses)

          return assetParameterStatuses;
        })
        .map((asset) => {
          // const hasRecordHold = holdedRecords.includes(asset.assetId);

          const schedule = {
            uploaded: 0,
            unuploaded: 0,
            holded: 0,
            unscanned: 0,
            total: 0,
            percentage: 0,
          };

          return { ...asset, schedule };
        });
      // console.log('3. data chart jumlah', assets)

      await this.getLocalSchedules(assets);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  // private async getTransaction(){
  //   this.http.requests({
  //     requests: [() => this.http.getLaporan(userId)],
  //     onSuccess: async ([responseLaporan]) => {
  //       if (responseLaporan.status >= 400) {
  //         throw responseLaporan;
  //       }
  //       console.log('responseLaporan', responseLaporan);
  //       this.jumlahlaporan = responseLaporan?.data?.data?.length
  //       console.log('jumlahLaporan',this.jumlahlaporan);
        
  //       if (this.jumlahlaporan) {
  //         const filterdata = responseLaporan?.data?.data?.filter(
  //           (scan) => scan.reportDate == null
  //         );
  //         console.log('filterdata', filterdata);
  //         count.laporan = filterdata?.length;
  //         count.belumlaporan = filterdata?.length;
  //         count.sudahlaporan = this.jumlahlaporan-count.laporan;
  //         console.log('belum laporan',count.sudahlaporan);
          
  //         this.datalaporan = filterdata;
  //         console.log('dataLaporan',this.datalaporan)
  //       }
  //     },
  //     onError: (error) => console.error(error),
  //   });
  // }

  private async getLocalSchedules(assets: any[]) {
    // //console.log('4. data local asset ke get localSchedule', assets);
    try {
      const count = {
        assets: 0,
        uploaded: 0,
        unuploaded: 0,
        holded: 0,
        unscanned: 0,
        laporan: 0,
        sudahtransaksi: 0,
        belumtransaksi: 0,
        sudahlaporan: 0,
        belumlaporan: 0,
      };

      const assetIds = assets.map((asset) => asset.assetId);
      const marks = this.database.marks(assetIds.length).join(',');

      const result = await this.database.select('schedule', {
        column: ['scheduleTrxId', 'assetId', 'scannedAt'],
        groupBy: ['scheduleTrxId'],
        where: {
          query: `assetId IN (${marks})`,
          params: assetIds,
        },
      });

      const now = this.utils.getTime();
      const dateInThisMonth = this.getDateInThisMonth(now);
      const lastWeek = Math.max(...dateInThisMonth.map((item) => item.week));
      const schedules = this.database.parseResult(result);
      // console.log('5. data localSchedule', schedules);
      // console.log('6. bulan ini', dateInThisMonth);
      // console.log('7. lastWeek', lastWeek);

      // .filter(schedule => this.filterSchedule(schedule, now, dateInThisMonth, lastWeek));

      const unuploadedRecords = await this.getUnuploadedRecords();
      // //console.log('8. belum upload', unuploadedRecords);

      for (const item of schedules) {
        const assetIndex = assets.findIndex(
          (asset) => asset.assetId === item.assetId
        );
        if (assetIndex >= 0 && item.scannedAt != null) {
          // Uploaded
          assets[assetIndex].schedule.uploaded++;
          count.uploaded++;
        } else if (
          assetIndex >= 0 &&
          unuploadedRecords.includes(item.scheduleTrxId)
        ) {
          // Unuploaded
          assets[assetIndex].schedule.unuploaded++;
          count.unuploaded++;
        } else if (assetIndex >= 0) {
          // Unscanned
          assets[assetIndex].schedule.unscanned++;
          count.unscanned++;
        } else {
          assets[assetIndex].schedule.unscanned++;
          count.laporan++;
        }
        // } else if (assetIndex >= 0 && assets[assetIndex].hasRecordHold) { // Holded | Unscanned
        //   const start = new Date(item.scheduleFrom).getTime();
        //   const end = new Date(item.scheduleTo).getTime();
        //   const key = moment(now).isBetween(start, end) ? 'holded' : 'unscanned';
        //   assets[assetIndex].schedule[key]++;
        //   count[key]++;
        // } else if (assetIndex >= 0) { // Unscanned
        //   assets[assetIndex].schedule.unscanned++;
        //   count.unscanned++;
        // }
      }
      console.log('10. upload', count.uploaded);
      console.log('11. belum upload', count.unuploaded);
      console.log('12. belum scan', count.unscanned);

      // count.assets = assets.length;
      this.count = count;
      this.getCountAssets();
      const userId = { userId: this.shared.user.id };

      this.http.requests({
        requests: [() => this.http.getLaporan(userId)],
        onSuccess: async ([responseLaporan]) => {
          if (responseLaporan.status >= 400) {
            throw responseLaporan;
          }
          console.log('responseLaporan', responseLaporan);
          this.jumlahlaporan = responseLaporan?.data?.data?.length
          console.log('jumlahLaporan',this.jumlahlaporan);
          
          if (this.jumlahlaporan) {
            const filterdata = responseLaporan?.data?.data?.filter(
              (scan) => scan.reportDate == null
            );
            console.log('filterdata', filterdata);
            count.laporan = filterdata?.length;
            count.belumlaporan = filterdata?.length;
            count.sudahlaporan = this.jumlahlaporan-count.laporan;
            console.log('belum laporan',count.sudahlaporan);
            
            this.datalaporan = filterdata;
            console.log('dataLaporan',this.datalaporan)
          }
        },
        onError: (error) => console.error(error),
      });
      console.log('data kirim', this.datalaporan);
    } catch (error) {
      console.error(error);
    }
  }

  private async prepareDirectory(
    type: 'asset' | 'parameter',
    exceptions: string[] = []
  ) {
    try {
      const { files } = await Filesystem.readdir({
        path: type,
        directory: Directory.Data,
      });

      const fileToDeleted = files.filter((file) => !exceptions.includes(file));

      for (const file of fileToDeleted) {
        await Filesystem.deleteFile({
          path: `${type}/${file}`,
          directory: Directory.Data,
        });
      }
    } catch (error) {
      // //console.log(error)
      await Filesystem.mkdir({
        path: type,
        directory: Directory.Data,
      });
    }
  }
  private async getAssetsParameterStatuses() {
    const assetParameterStatuses: any = {};

    try {
      const columns = ['assetId'];

      const result = await this.database.select('parameter', {
        column: columns,
        groupBy: columns,
      });

      const parameterStatuses = this.database.parseResult(result);

      Object.entries(groupBy(parameterStatuses, 'assetId')).forEach(
        ([assetId, parameters]) => {
          assetParameterStatuses[assetId] = uniq<string>(
            parameters
              .map((parameter) =>
                parameter.showOn?.length ? parameter.showOn?.split?.(',') : []
              )
              .reduce((prev, curr) => prev.concat(curr), [])
          );
        }
      );
    } catch (error) {
      console.error(error);
    }

    return assetParameterStatuses;
  }
  private async downloadPhoto(type: 'asset' | 'parameter', url: string) {
    let filePath: string;

    try {
      const name = url?.split('/').pop();

      const { path } = await this.http.download({
        url,
        filePath: `${type}/${name}`,
        fileDirectory: Directory.Data,
      });

      filePath = path;
    } catch (error) {
      console.error(error);
    }

    return filePath;
  }
  
  async showDetails(akun?: any) {
    await this.menuCtrl.enable(true, 'sidebar');
    return this.menuCtrl.open('sidebar');
  }

  private async getParameterByAssetId(assetId) {
    const loader = await this.utils.presentLoader();
    return this.http.requests({
      requests: [() => this.http.getParameters(assetId)],
      onSuccess: async ([responseParameters]) => {
        if (![200, 201].includes(responseParameters.status)) {
          throw responseParameters;
        }

        if (responseParameters?.data?.data?.length) {
          const parameters = [];

          for (const parameter of responseParameters?.data?.data) {
            for (const param of parameter) {
              const data = {
                assetId: param.assetId,
                assetNumber: param.assetNumber,
                description: param.description,
                inputType: param.inputType,
                max: param.max,
                min: param.min,
                normal: param.normal,
                abnormal: param.abnormal,
                option: param.option,
                parameterId: param.parameterId,
                parameterName: param.parameterName,
                schType: toLower(param.schType),
                showOn: param.showOn,
                sortId: param.index,
                uom: param.uom,
                workInstruction: param.workInstruction,
                tagId: param.tagId,
                unit: param.unit,
                unitId: param.unitId,
                area: param.area,
                areaId: param.areaId,
                created_at: param.created_at,
                updated_at: param.updated_at,
                parameterGroup: param.parameterGroup,
              };
              parameters.push(data);
            }
          }
          console.log('parameter1', parameters);

          let storeParameters = [];
          // await this.database.emptyTable('parameter');
          // .then(() => this.database.insertbatch('parameter', val);
          storeParameters = this.utils.chunkArray(parameters, 250);
          storeParameters?.map?.(async (val) => {
            await this.database.insert('parameter', val);
          });
          // //console.log('storeParameters', storeParameters);

          // setTimeout(async () => {
          //   const start = parameters.length;

          //   if (start < parameters.length) {
          //     let end = start + 900;

          //     end = end > parameters.length
          //       ? parameters.length
          //       : end;

          //     parameters.push(
          //       ...parameters.slice(start, end)
          //     );
          //   }

          //   console.log('parameter2', parameters);
          //   await this.database.emptyTable('parameter')
          //     .then(() => this.database.insertbatch('parameter', parameters));
          // }, 500);
          // //console.log('cek isi parameter', parameters);
        }
      },
      onError: error => console.error(error),
      onComplete: () => loader.dismiss()
    });
  }

  private async getUnuploadedRecords() {
    const records: string[] = [];

    try {
      const result = await this.database.select('record', {
        column: ['scheduleTrxId'],
        where: {
          query: 'isUploaded=?',
          params: [0],
        },
        groupBy: ['scheduleTrxId'],
      });

      records.push(
        ...this.database
          .parseResult(result)
          .map((record) => record.scheduleTrxId)
      );
    } catch (error) {
      console.error(error);
    }

    return records;
  }

  private async getHoldedRecords() {
    const records: string[] = [];

    try {
      const recordHold = await this.database.select('recordHold', {
        column: ['assetId'],
        groupBy: ['assetId'],
      });

      const recordAttachmentHold = await this.database.select(
        'recordAttachment',
        {
          column: ['scheduleTrxId'],
          where: {
            query: 'isUploaded=?',
            params: [-1],
          },
          groupBy: ['scheduleTrxId'],
        }
      );

      records.push(
        ...uniq([
          ...this.database.parseResult(recordHold).map((item) => item.assetId),
          ...this.database
            .parseResult(recordAttachmentHold)
            .map((item) => item.key),
        ])
      );
    } catch (error) {
      console.error(error);
    }

    return records;
  }

  private onProcessFinished(
    subscriber: Subscriber<any>,
    loader: HTMLIonPopoverElement
  ) {
    this.syncJob.counter++;
    const maxCount = Object.keys(this.syncJob.order).length;
    // //console.log('jumlah syc', this.syncJob.counter);

    if (this.syncJob.counter < maxCount) {
      subscriber.next({
        complexMessage: Object.values(this.syncJob.order),
      });
    } else {
      const data: any = {
        complexMessage: Object.values(this.syncJob.order),
        buttons: [
          {
            text: 'Tutup',
            handler: () => loader.dismiss(),
          },
        ],
      };

      const hasFailedSync = Object.values(this.syncJob.order).find(
        (item) => item.status === 'failed'
      );

      if (hasFailedSync) {
        data.buttons.push({
          text: 'See Details',
          handler: () => {
            loader.dismiss();
            this.router.navigate(['activity-logs']);
          },
        });
      }

      subscriber.next(data);

      this.getLocalAssets().finally(async () => {
        try {
          await this.database.vacuum();
          await this.checkSharedRecords();
        } catch (error) {
          console.error(error);
        }
      });
    }
  }

  private async getUnuploadedData(table: string) {
    const data: any[] = [];

    try {
      const result = await this.database.select(table, {
        where: {
          query: 'isUploaded=?',
          params: [0],
        },
      });

      data.push(...this.database.parseResult(result));
    } catch (error) {
      console.error(error);
    }

    return data;
  }

  private async checkSharedRecords() {
    this.shared.records.forEach(async (record) => {
      for (const index of record.requests.keys()) {
        if (
          record.requests[index].status !== 'success' &&
          record.requests[index].type === 'record'
        ) {
          const [{ scheduleTrxId }] = record.requests[index].data;

          const extra = {
            where: {
              query: 'scheduleTrxId=?',
              params: [scheduleTrxId],
            },
            groupBy: ['scheduleTrxId'],
            limit: 1,
          };

          const localRecord = await this.database.select('record', {
            column: ['isUploaded'],
            ...extra,
          });

          const [{ isUploaded }] = this.database.parseResult(localRecord);

          if (isUploaded) {
            record.requests[index].status = 'success';
            continue;
          }

          const localSchedule = await this.database.select('dataschedule', {
            column: ['syncAt'],
            ...extra,
          });

          const [{ syncAt }] = this.database.parseResult(localSchedule);
          record.requests[index].status =
            syncAt != null ? 'success' : record.requests[index].status;
        } else if (record.requests[index].status !== 'success') {
          const { recordAttachmentId } = record.requests[index].data;

          const result = await this.database.select('recordAttachment', {
            column: ['isUploaded'],
            where: {
              query: 'recordAttachmentId=?',
              params: [recordAttachmentId],
            },
            groupBy: ['recordAttachmentId'],
            limit: 1,
          });

          const [{ isUploaded }] = this.database.parseResult(result);
          record.requests[index].status = isUploaded
            ? 'success'
            : record.requests[index].status;
        }
      }

      record.status = record.requests.find(
        (request: any) => request.status !== 'success'
      )
        ? record.status
        : 'success';
    });
  }

  private async getPreviousPhotos(table: 'schedule' | 'asset' | 'parameter') {
    const photos: any = {};

    try {
      const result = await this.database.select(table, {
        column: ['photo'],
        groupBy: ['photo'],
        where: {
          query: 'photo IS NOT NULL',
          params: [],
        },
      });

      this.database
        .parseResult(result)
        .forEach(({ photo, offlinePhoto }) => (photos[photo] = offlinePhoto));
    } catch (error) {
      console.error(error);
    }

    return photos;
  }

  private async uploadRecords(
    subscriber: Subscriber<any>,
    loader: HTMLIonPopoverElement
  ) {
    const now = this.utils.getTime();
    const syncAt = moment(now).format('YYYY-MM-DD HH:mm:ss');

    const records = (await this.getUnuploadedData('record')).map((record) => ({
      condition: record.condition,
      parameterId: record.parameterId,
      scannedAt: record.scannedAt,
      scannedBy: record.scannedBy,
      scannedEnd: record.scannedEnd,
      scannedNotes: record.scannedNotes,
      scannedWith: record.scannedWith,
      scheduleTrxId: record.scheduleTrxId,
      syncAt,
      trxId: record.trxId,
      value: record.value,
      userId: this.shared.user.id,
      updated_at: syncAt,
    }));

    // //console.log('records', records);

    if (records.length) {
      this.syncJob.isUploading = true;
      this.syncJob.order.records.message = 'Uploading data records...';

      const scheduleTrxIds = uniq(
        records.map((record) => record.scheduleTrxId)
      );

      if (scheduleTrxIds.length > 1) {
        this.syncJob.order.records.message += ` (${scheduleTrxIds.length})`;
      }

      subscriber.next({
        complexMessage: Object.values(this.syncJob.order),
      });

      return this.http.requests({
        requests: [() => this.http.uploadRecords(records)],
        onSuccess: async ([response]) => {
          if (response.status >= 400) {
            throw response;
          }

          const uploaded = response?.data?.data?.sch200?.map?.(
            (schedule: any) => schedule.scheduleId
          );

          const activityLogs =
            response?.data?.data?.sch200?.map?.((schedule: any) => ({
              scheduleTrxId: schedule.scheduleId,
              status: 'success',
              message: 'Success add data',
            })) || [];

          activityLogs.push(
            ...(response?.data?.data?.sch404?.map?.((schedule: any) => ({
              scheduleTrxId: schedule.scheduleId,
              status: 'success',
              message: 'Success add data',
            })) || [])
          );

          if (uploaded?.length) {
            const marks = this.database.marks(uploaded.length).join(',');

            const where = {
              query: `scheduleTrxId IN (${marks})`,
              params: uploaded,
            };

            this.database.update('dataschedule', { syncAt }, where);
            this.database.update('record', { isUploaded: 1 }, where);
          }

          if (uploaded?.length === scheduleTrxIds.length) {
            this.syncJob.order.records.status = 'success';
            this.syncJob.order.records.message = 'Success upload data records';

            if (uploaded.length > 1) {
              this.syncJob.order.records.message += ` (${uploaded.length})`;
            }
          } else {
            this.syncJob.order.records.status = 'failed';
            this.syncJob.order.records.message =
              'Failed to upload data records';
            const failureCount =
              scheduleTrxIds.length - (uploaded?.length || 0);

            if (failureCount > 0) {
              this.syncJob.order.records.message += ` (${failureCount})`;
            }
          }

          this.shared.addLogActivity({
            activity: 'User upload data ke server',
            data: activityLogs,
          });
        },
        onError: (error) => {
          const activityLogs = scheduleTrxIds.map((scheduleTrxId) => ({
            scheduleTrxId,
            status: 'failed',
            message: this.http.getErrorMessage(error),
          }));

          this.shared.addLogActivity({
            activity: 'User upload data ke server',
            data: activityLogs,
          });

          this.syncJob.order.records.status = 'failed';
          this.syncJob.order.records.message = 'gagal upload data';
        },
        onComplete: () => this.onProcessFinished(subscriber, loader),
      });
    } else {
      delete this.syncJob.order.records;

      subscriber.next({
        complexMessage: Object.values(this.syncJob.order),
      });
    }
  }

  private async uploadRecordAttachments(subscriber: Subscriber<any>, loader: HTMLIonPopoverElement) {
    const recordAttachments = (await this.getUnuploadedData('recordAttachment'))
      .map((attachment) => ({
        recordAttachmentId: attachment.recordAttachmentId,
        scheduleTrxId: attachment.scheduleTrxId,
        trxId: attachment.trxId,
        notes: attachment.notes,
        type: attachment.type,
        filePath: attachment.filePath,
        timestamp: attachment.timestamp,
        parameterId: attachment.parameterId,
      }));
    // //console.log('isi att', recordAttachments);
    if (recordAttachments.length) {
      //console.log('recordAttachments', recordAttachments)
      const uploaded = [];
      const activityLogs = [];
      this.syncJob.isUploading = true;
      this.syncJob.order.recordAttachments.message =
        'Upload file attachments...';

      if (recordAttachments.length > 1) {
        this.syncJob.order.recordAttachments.message += `(${recordAttachments.length})`;
      }

      const attachmentBySchedule: any = {};

      Object.entries(groupBy(recordAttachments, 'scheduleTrxId'))
        .forEach(([scheduleTrxId, attachments]) => {
          //console.log('attachments cek1', attachments)
          attachmentBySchedule[scheduleTrxId] = {
            attachmentIds: attachments.map(
              (attachment) => attachment.recordAttachmentId
            ),
            uploadedAttachmentIds: [],
          };
        }
      );

      subscriber.next({
        complexMessage: Object.values(this.syncJob.order),
      });
      //console.log('recordAttachmentId', recordAttachments.entries())

      for (const [i, item] of recordAttachments.entries()) {
        const { recordAttachmentId, ...data } = item;

        const leftover = recordAttachments.length - (i + 1);
        // console.log('recordAttachments.length :', recordAttachments.length)
        // console.log('i :', i)
        // console.log({ uploadRecordAttachment: JSON.stringify(data) });
        console.log('data upload', data);
        console.log('data upload item', item);
        console.log('data upload recordAttachmentId', recordAttachmentId);

        await this.http.requests({
          requests: [() => this.http.uploadRecordAttachment(data)],
          onSuccess: ([response]) => {
            if (response.status >= 400) {
              throw response;
            }
            //console.log('recordAttachmentId', response)
            uploaded.push(recordAttachmentId);

            attachmentBySchedule[item.scheduleTrxId].uploadedAttachmentIds.push(
              recordAttachmentId
            );

            activityLogs.push({
              scheduleTrxId: item.scheduleTrxId,
              status: 'success',
              message: `berhasil upload file attachment`,
            });
          },
          onError: (error) => {
            //console.log(error)
            activityLogs.push({
              scheduleTrxId: item.scheduleTrxId,
              status: 'failed',
              message: error?.data
                ? this.http.getErrorMessage(error.data)
                : this.http.getErrorMessage(error),
            });
          },
          onComplete: () => {
            if (leftover) {
              this.syncJob.order.recordAttachments.message =
                'Upload file attachments...';

              if (leftover > 1) {
                this.syncJob.order.recordAttachments.message += ` (${leftover})`;
              }

              subscriber.next({
                complexMessage: Object.values(this.syncJob.order),
              });
            } else {
              const uploadedBySchedule = Object.entries<any>(
                attachmentBySchedule
              )
                .filter(
                  ([key, value]) =>
                    value.attachmentIds?.length ===
                    value.uploadedAttachmentIds?.length
                )
                .map(([scheduleTrxId]) => scheduleTrxId);
              // //console.log('uploadedBySchedule', uploadedBySchedule);

              if (uploadedBySchedule.length) {
                const marks = this.database.marks(uploadedBySchedule.length);
                // //console.log('marks', marks);

                const where = {
                  query: `trxId IN (${marks})`,
                  params: uploadedBySchedule,
                };
                //console.log(where)
                this.database.update('recordAttachment', { isUploaded: 1 }, where);
              }

              if (uploaded.length === recordAttachments.length) {
                this.syncJob.order.recordAttachments.status = 'success';
                this.syncJob.order.recordAttachments.message =
                  'Berhasil upload file attachment';

                if (uploaded.length > 1) {
                  this.syncJob.order.recordAttachments.message += `s (${uploaded.length})`;
                }
              } else {
                const failureCount = recordAttachments.length - uploaded.length;
                this.syncJob.order.recordAttachments.status = 'failed';
                this.syncJob.order.recordAttachments.message =
                  'Gagal upload file attachment';

                if (failureCount > 0) {
                  this.syncJob.order.recordAttachments.message += ` (${failureCount})`;
                }
              }

              this.shared.addLogActivity({
                activity: 'User upload file attachments ke server',
                data: activityLogs,
              });

              this.onProcessFinished(subscriber, loader);
            }
          },
        });
      }
    } else {
      delete this.syncJob.order.recordAttachments;

      subscriber.next({
        complexMessage: Object.values(this.syncJob.order),
      });
    }
  }

  private async getSchedules(
    subscriber: Subscriber<any>,
    loader: HTMLIonPopoverElement
  ) {
    const shared = this.injector.get(SharedService);
    if (shared.user.group === 'ADMIN') {
      return this.http.requests({
        requests: [() => this.http.getSchedules()],
        onSuccess: async ([response]) => {
          if (response.status >= 400) {
            throw response;
          }

          if (response?.data?.data?.length) {
            const uploadedSchedules = [];
            const notifications = [];

            const schedules = response?.data?.data?.map?.(
              (dataschedule: any) => {
                if (dataschedule.syncAt != null) {
                  uploadedSchedules.push(dataschedule.scheduleTrxId);
                } else {
                  notifications.push(dataschedule);
                }
                const data = {
                  scheduleTrxId: dataschedule.scheduleTrxId,
                  assetCategoryId: dataschedule.assetCategoryId,
                  assetCategoryName: dataschedule.assetCategoryName,
                  abbreviation: dataschedule.abbreviation,
                  adviceDate: dataschedule.adviceDate,
                  approvedAt: dataschedule.approvedAt,
                  approvedBy: dataschedule.approvedBy,
                  approvedNotes: dataschedule.approvedNotes,
                  assetId: dataschedule.assetId,
                  assetNumber: dataschedule.assetNumber,
                  assetStatusId: dataschedule.assetStatusId,
                  assetStatusName: dataschedule.assetStatusName,
                  condition: dataschedule.condition,
                  merk: dataschedule.merk,
                  capacityValue: dataschedule.capacityValue,
                  detailLocation: dataschedule.detailLocation,
                  unitCapacity: dataschedule.unitCapacity,
                  supplyDate: dataschedule.supplyDate,
                  reportPhoto: dataschedule.reportPhoto,
                  photo: dataschedule.photo?.path,
                  scannedAccuration: dataschedule.scannedAccuration,
                  scannedAt: dataschedule.scannedAt,
                  scannedBy: dataschedule.scannedBy,
                  scannedEnd: dataschedule.scannedEnd,
                  scannedNotes: dataschedule.scannedNotes,
                  scannedWith: dataschedule.scannedWith,
                  schDays: dataschedule.schDays,
                  schFrequency: dataschedule.schFrequency,
                  schManual: dataschedule.schManual,
                  schType: toLower(dataschedule.schType),
                  schWeekDays: dataschedule.schWeekDays,
                  schWeeks: dataschedule.schWeeks,
                  scheduleFrom: dataschedule.scheduleFrom,
                  scheduleTo: dataschedule.scheduleTo,
                  syncAt: dataschedule.syncAt,
                  tagId: dataschedule.tagId,
                  tagNumber: dataschedule.tagNumber,
                  unit: dataschedule.unit,
                  unitId: dataschedule.unitId,
                  area: dataschedule.area,
                  areaId: dataschedule.areaId,
                  latitude: dataschedule.latitude,
                  longitude: dataschedule.longitude,
                  created_at: dataschedule.created_at,
                  deleted_at: dataschedule.deleted_at,
                  date: dataschedule.date,
                  assetForm: JSON.stringify(dataschedule.assetForm),
                  idschedule: dataschedule.idschedule,
                };

                return data;
              }
            );

            const assetIdSchedule = [];
            const assetIdType = [];

            const assetiduniq = uniqBy(response?.data?.data, 'assetId');

            const assetiduniq = uniqBy(response?.data?.data, 'assetId');

            assetiduniq
              ?.map?.((dataschedule: any) => {
                assetIdType.push(dataschedule.assetId);
                assetIdSchedule.push({
                  assetId: dataschedule.assetId,
                  categoryId: dataschedule.assetCategoryId
                });
              });
            const assetIdScheduleType = { asset: JSON.stringify(assetIdSchedule) };
            const assetIdScheduleType1 = { asset: JSON.stringify(assetIdType) };
            //console.log('assetIdSchedule', assetIdSchedule);

            this.getTypeScan(assetIdScheduleType1);
            // this.getParameterByAssetId(assetIdScheduleType);
            let splitAssetIdSchedule = [];
            splitAssetIdSchedule = this.utils.chunkArray(assetIdSchedule, 250);
            splitAssetIdSchedule?.map?.(async val => {
              const payload = { asset: JSON.stringify(val) };
              await this.getParameterByAssetId(payload);
            });
            //Jika ada record yang belum di upload
            // if (uploadedSchedules?.length) {
            //   const marks = this.database.marks(uploadedSchedules.length).join(',');
            //   const where = {
            //     query: `scheduleTrxId IN (${marks})`,
            //     params: uploadedSchedules
            //   };

            //   this.database.update('record', { isUploaded: 1 }, where);
            // }
            await this.database
              .emptyTable('schedule')
              .then(() => this.database.insertbatch('schedule', schedules))
              .then(() => {
                this.http.requests({
                  requests: [() => this.http.getSchedulesnonsiftadmin()],
                  onSuccess: async ([response]) => {
                    if (response.status >= 400) {
                      throw response;
                    }

                    //console.log('getSchedulesNonSift', response);

                    if (response?.data?.data?.length) {
                      const notifications = [];

                      const schedulesnonsift = response?.data?.data?.map?.(
                        (dataschedule: any) => {
                          if (dataschedule.syncAt != null) {
                            this.uploadedSchedules.push(
                              dataschedule.scheduleTrxId
                            );
                          } else {
                            notifications.push(dataschedule);
                          }

                          const data = {
                            scheduleTrxId: dataschedule.scheduleTrxId,
                            assetCategoryId: dataschedule.assetCategoryId,
                            assetCategoryName: dataschedule.assetCategoryName,
                            abbreviation: dataschedule.abbreviation,
                            adviceDate: dataschedule.adviceDate,
                            approvedAt: dataschedule.approvedAt,
                            approvedBy: dataschedule.approvedBy,
                            approvedNotes: dataschedule.approvedNotes,
                            assetId: dataschedule.assetId,
                            assetNumber: dataschedule.assetNumber,
                            assetStatusId: dataschedule.assetStatusId,
                            assetStatusName: dataschedule.assetStatusName,
                            condition: dataschedule.condition,
                            merk: dataschedule.merk,
                            capacityValue: dataschedule.capacityValue,
                            detailLocation: dataschedule.detailLocation,
                            unitCapacity: dataschedule.unitCapacity,
                            supplyDate: dataschedule.supplyDate,
                            reportPhoto: dataschedule.reportPhoto,
                            photo: dataschedule.photo?.path,
                            scannedAccuration: dataschedule.scannedAccuration,
                            scannedAt: dataschedule.scannedAt,
                            scannedBy: dataschedule.scannedBy,
                            scannedEnd: dataschedule.scannedEnd,
                            scannedNotes: dataschedule.scannedNotes,
                            scannedWith: dataschedule.scannedWith,
                            schDays: dataschedule.schDays,
                            schFrequency: dataschedule.schFrequency,
                            schManual: dataschedule.schManual,
                            schType: toLower(dataschedule.schType),
                            schWeekDays: dataschedule.schWeekDays,
                            schWeeks: dataschedule.schWeeks,
                            scheduleFrom: dataschedule.scheduleFrom,
                            scheduleTo: dataschedule.scheduleTo,
                            syncAt: dataschedule.syncAt,
                            tagId: dataschedule.tagId,
                            tagNumber: dataschedule.tagNumber,
                            unit: dataschedule.unit,
                            unitId: dataschedule.unitId,
                            area: dataschedule.area,
                            areaId: dataschedule.areaId,
                            latitude: dataschedule.latitude,
                            longitude: dataschedule.longitude,
                            created_at: dataschedule.created_at,
                            deleted_at: dataschedule.deleted_at,
                            date: dataschedule.date,
                            assetForm: JSON.stringify(dataschedule.assetForm),
                            idschedule: dataschedule.idschedule,
                          };

                          return data;
                        });
                      const assetIdSchedule = [];
                      const assetIdType = [];

                      const assetiduniq = uniqBy(response?.data?.data, "assetId");

                      assetiduniq?.map?.((dataschedule: any) => {
                        assetIdType.push(dataschedule.assetId);
                        assetIdSchedule.push({
                          assetId: dataschedule.assetId,
                          categoryId: dataschedule.assetCategoryId,
                        });
                      // //console.log('assetIdSchedule', assetIdSchedule);
                      const assetIdScheduleType = { asset: JSON.stringify(assetIdSchedule) };
                      const assetIdScheduleType1 = { asset: JSON.stringify(assetIdType) };
                      //console.log('assetIdSchedule', assetIdSchedule);

                      this.getTypeScan(assetIdScheduleType1);
                      // this.getParameterByAssetId(assetIdScheduleType);
                      splitAssetIdSchedule = [];
                      splitAssetIdSchedule = this.utils.chunkArray(assetIdSchedule, 250);
                      splitAssetIdSchedule?.map?.(async val => {
                        const payload = { asset: JSON.stringify(val) };
                        await this.getParameterByAssetId(payload);
                      });
                      this.database.insertbatch('schedule', schedulesnonsift);
                      this.shared.addLogActivity({
                        activity:
                          'User synchronizes data non-shift dari server',
                        data: {
                          message: 'Berhasil synchronize schedules Non Sift',
                          status: 'success',
                        },
                      });

                      await this.notification.cancel('Scan Asset Notification');

                      const groupedNotifications = groupBy(
                        notifications,
                        'scheduleTo'
                      );

                      for (const [key, data] of Object.entries<any>(
                        groupedNotifications
                      )) {
                        const assetNames = data
                          .map((item: any) => item.asset_number)
                          .join(',');
                        const notificationSchema: LocalNotificationSchema = {
                          id: 0, // ID akan otomatis ditimpa oleh service
                          title: 'Scan Asset Notification',
                          body: `Waktu untuk scan ${assetNames}`,
                          schedule: {
                            at: new Date(
                              moment(key).format('YYYY-MM-DDTHH:mm:ss')
                            ),
                            allowWhileIdle: true,
                          },
                          smallIcon: 'ic_notification_schedule',
                          largeIcon: 'ic_notification_schedule',
                        };

                        notificationSchema.schedule.at.setHours(
                          notificationSchema.schedule.at.getHours() - 1
                        );

                        await this.notification.schedule(
                          key,
                          notificationSchema
                        );
                      }

                      const notificationSchema: LocalNotificationSchema = {
                        id: 0, // ID akan otomatis ditimpa oleh service
                        title: 'Scan Asset Notification',
                        body: 'Waktu untuk scan',
                        schedule: {
                          at: new Date(
                            moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
                          ),
                          allowWhileIdle: true,
                        },
                        smallIcon: 'ic_notification_schedule',
                        largeIcon: 'ic_notification_schedule',
                      };

                      await this.notification.schedule(
                        moment(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
                        notificationSchema
                      );

                      this.syncJob.order.schedules.status = 'success';
                      this.syncJob.order.schedules.message =
                        'Success mengambil data schedules';
                    } else {
                      this.shared.addLogActivity({
                        activity:
                          'User synchronizes schedules non-shift dari server',
                        data: {
                          message: 'Data schedules kosong',
                          status: 'failed',
                        },
                      });

                      this.syncJob.order.schedules.status = 'failed';
                      this.syncJob.order.schedules.message =
                        'Data schedules kosong';
                    }
                  },
                  onError: (error) => {
                    this.shared.addLogActivity({
                      activity: 'User synchronizes schedules dari server',
                      data: {
                        message: this.http.getErrorMessage(error),
                        status: 'failed',
                      },
                    });

                    this.syncJob.order.schedules.status = 'failed';
                    this.syncJob.order.schedules.message =
                      'Gagal mendapatkan data schedules';
                  },
                });
              })
              .then(() => {
                this.http.requests({
                  requests: [() => this.http.getSchedulesManualadmin()],
                  onSuccess: async ([response]) => {
                    //console.log(response.data.data)
                    if (response.status >= 400) {
                      throw response;
                    }

                    //console.log('getSchedulesManual', response);

                    if (response?.data?.data?.length) {
                      const notifications = [];

                      const schedulesmanual = response?.data?.data?.map?.(
                        (dataschedule: any) => {
                          if (dataschedule.syncAt != null) {
                            this.uploadedSchedules.push(
                              dataschedule.scheduleTrxId
                            );
                          } else {
                            notifications.push(dataschedule);
                          }

                          const data = {
                            scheduleTrxId: dataschedule.scheduleTrxId,
                            assetCategoryId: dataschedule.assetCategoryId,
                            assetCategoryName: dataschedule.assetCategoryName,
                            abbreviation: dataschedule.abbreviation,
                            adviceDate: dataschedule.adviceDate,
                            approvedAt: dataschedule.approvedAt,
                            approvedBy: dataschedule.approvedBy,
                            approvedNotes: dataschedule.approvedNotes,
                            assetId: dataschedule.assetId,
                            assetNumber: dataschedule.assetNumber,
                            assetStatusId: dataschedule.assetStatusId,
                            assetStatusName: dataschedule.assetStatusName,
                            condition: dataschedule.condition,
                            merk: dataschedule.merk,
                            capacityValue: dataschedule.capacityValue,
                            detailLocation: dataschedule.detailLocation,
                            unitCapacity: dataschedule.unitCapacity,
                            supplyDate: dataschedule.supplyDate,
                            reportPhoto: dataschedule.reportPhoto,
                            photo: dataschedule.photo?.path,
                            scannedAccuration: dataschedule.scannedAccuration,
                            scannedAt: dataschedule.scannedAt,
                            scannedBy: dataschedule.scannedBy,
                            scannedEnd: dataschedule.scannedEnd,
                            scannedNotes: dataschedule.scannedNotes,
                            scannedWith: dataschedule.scannedWith,
                            schDays: dataschedule.schDays,
                            schFrequency: dataschedule.schFrequency,
                            schManual: dataschedule.schManual,
                            schType: toLower(dataschedule.schType),
                            schWeekDays: dataschedule.schWeekDays,
                            schWeeks: dataschedule.schWeeks,
                            scheduleFrom: dataschedule.scheduleFrom,
                            scheduleTo: dataschedule.scheduleTo,
                            syncAt: dataschedule.syncAt,
                            tagId: dataschedule.tagId,
                            tagNumber: dataschedule.tagNumber,
                            unit: dataschedule.unit,
                            unitId: dataschedule.unitId,
                            area: dataschedule.area,
                            areaId: dataschedule.areaId,
                            latitude: dataschedule.latitude,
                            longitude: dataschedule.longitude,
                            created_at: dataschedule.created_at,
                            deleted_at: dataschedule.deleted_at,
                            date: dataschedule.date,
                            assetForm: JSON.stringify(dataschedule.assetForm),
                            idschedule: dataschedule.idschedule,
                          };

                          return data;
                        }
                      );
                      const assetIdSchedule = [];
                      const assetIdType = [];
                      response?.data?.data?.map?.((dataschedule: any) => {
                        assetIdType.push(dataschedule.assetId);
                        assetIdSchedule.push({
                          assetId: dataschedule.assetId,
                          categoryId: dataschedule.assetCategoryId,
                        });
                      const assetIdScheduleType = { asset: JSON.stringify(assetIdSchedule) };
                      const assetIdScheduleType1 = { asset: JSON.stringify(assetIdType) };
                      //console.log('assetIdSchedule', assetIdSchedule);

                      this.getTypeScan(assetIdScheduleType1);
                      // this.getParameterByAssetId(assetIdScheduleType);
                      splitAssetIdSchedule = [];
                      splitAssetIdSchedule = this.utils.chunkArray(assetIdSchedule, 250);
                      splitAssetIdSchedule?.map?.(async val => {
                        const payload = { asset: JSON.stringify(val) };
                        await this.getParameterByAssetId(payload);
                      });
                      this.database.insertbatch('schedule', schedulesmanual);

                      this.shared.addLogActivity({
                        activity: 'User synchronizes data manual dari server',
                        data: {
                          message: 'Berhasil synchronize schedules',
                          status: 'success',
                        },
                      });

                      await this.notification.cancel('Scan Asset Notification');

                      const groupedNotifications = groupBy(
                        notifications,
                        'scheduleTo'
                      );

                      for (const [key, data] of Object.entries<any>(
                        groupedNotifications
                      )) {
                        const assetNames = data
                          .map((item: any) => item.asset_number)
                          .join(',');
                        const notificationSchema: LocalNotificationSchema = {
                          id: 0, // ID akan otomatis ditimpa oleh service
                          title: 'Scan Asset Notification',
                          body: `Waktu untuk scan ${assetNames}`,
                          schedule: {
                            at: new Date(
                              moment(key).format('YYYY-MM-DDTHH:mm:ss')
                            ),
                            allowWhileIdle: true,
                          },
                          smallIcon: 'ic_notification_schedule',
                          largeIcon: 'ic_notification_schedule',
                        };

                        notificationSchema.schedule.at.setHours(
                          notificationSchema.schedule.at.getHours() - 1
                        );

                        await this.notification.schedule(
                          key,
                          notificationSchema
                        );
                      }

                      const notificationSchema: LocalNotificationSchema = {
                        id: 0, // ID akan otomatis ditimpa oleh service
                        title: 'Scan Asset Notification',
                        body: 'Waktu untuk scan',
                        schedule: {
                          at: new Date(
                            moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
                          ),
                          allowWhileIdle: true,
                        },
                        smallIcon: 'ic_notification_schedule',
                        largeIcon: 'ic_notification_schedule',
                      };

                      await this.notification.schedule(
                        moment(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
                        notificationSchema
                      );

                      this.syncJob.order.schedules.status = 'success';
                      this.syncJob.order.schedules.message =
                        'Success mengambil data schedules';
                    } else {
                      this.shared.addLogActivity({
                        activity: 'User synchronizes schedules dari server',
                        data: {
                          message: 'Data schedules kosong',
                          status: 'failed',
                        },
                      });

                      this.syncJob.order.schedules.status = 'failed';
                      this.syncJob.order.schedules.message =
                        'Data schedules kosong';
                    }
                  },
                  onError: (error) => {
                    this.shared.addLogActivity({
                      activity: 'User synchronizes schedules dari server',
                      data: {
                        message: this.http.getErrorMessage(error),
                        status: 'failed',
                      },
                    });

                    this.syncJob.order.schedules.status = 'failed';
                    this.syncJob.order.schedules.message =
                      'Gagal mendapatkan data schedules';
                  },
                });
              });

            this.shared.addLogActivity({
              activity: 'User synchronizes schedules dari server',
              data: {
                message: 'Berhasil synchronize schedules',
                status: 'success',
              },
            });

            await this.notification.cancel('Scan Asset Notification');
            //console.log('notifications', notifications);

            const groupedNotifications = groupBy(notifications, 'scheduleTo');

            for (const [key, data] of Object.entries<any>(
              groupedNotifications
            )) {
              const assetNames = data
                .map((item: any) => item.asset_number)
                .join(',');

              // //console.log(moment(key).format('YYYY-MM-DDTHH:mm:ss'));
              // //console.log(new Date(moment(key).format('YYYY-MM-DDTHH:mm:ss')));

              // eslint-disable-next-line @typescript-eslint/no-shadow
              const notificationSchema: LocalNotificationSchema = {
                id: 0, // ID akan otomatis ditimpa oleh service
                title: 'Scan Asset Notification',
                body: `Waktu untuk scan ${assetNames}`,
                schedule: {
                  at: new Date(moment(key).format('YYYY-MM-DDTHH:mm:ss')),
                  allowWhileIdle: true,
                },
                smallIcon: 'ic_notification_schedule',
                largeIcon: 'ic_notification_schedule',
              };

              notificationSchema.schedule.at.setHours(
                notificationSchema.schedule.at.getHours() - 1
              );

              await this.notification.schedule(key, notificationSchema);
            }

            const notificationSchema: LocalNotificationSchema = {
              id: 0, // ID akan otomatis ditimpa oleh service
              title: 'Scan Asset Notification',
              body: 'Waktu untuk scan',
              schedule: {
                at: new Date(moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')),
                allowWhileIdle: true,
              },
              smallIcon: 'ic_notification_schedule',
              largeIcon: 'ic_notification_schedule',
            };

            await this.notification.schedule(
              moment(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
              notificationSchema
            );

            this.syncJob.order.schedules.status = 'success';
            this.syncJob.order.schedules.message =
              'Berhasil mendapatkan data schedules';
          } else {
            this.shared.addLogActivity({
              activity: 'User synchronizes schedules dari server',
              data: {
                message: 'Data schedules kosong',
                status: 'failed',
              },
            });

            this.syncJob.order.schedules.status = 'failed';
            this.syncJob.order.schedules.message = 'Data schedules kosong';
          }
        },
        onError: (error) => {
          this.shared.addLogActivity({
            activity: 'User synchronizes schedules dari server',
            data: {
              message: this.http.getErrorMessage(error),
              status: 'failed',
            },
          });

          this.syncJob.order.schedules.status = 'failed';
          this.syncJob.order.schedules.message =
            'Gagal mendapatkan data schedules';
        },
        onComplete: () => this.onProcessFinished(subscriber, loader),
      });
    } else {
      await this.database
        .emptyTable('schedule')
        .then(() => this.getSchedulesShift())
        .then(() => this.getSchedulesNonSift())
        .then(() => this.getSchedulesManual());
      if (this.uploadedSchedules?.length) {
        const marks = this.database
          .marks(this.uploadedSchedules.length)
          .join(',');
        const where = {
          query: `scheduleTrxId IN (${marks})`,
          params: this.uploadedSchedules,
        };

        this.database.update('record', { isUploaded: 1 }, where);
      }
      this.onProcessFinished(subscriber, loader);
    }
  }

  private async getSchedulesShift() {
    const shared = this.injector.get(SharedService);
    const userIdShift = JSON.stringify(shared.userdetail.shift);
    const userId = { groupOperatorId: JSON.parse(userIdShift).data.operatorId };
    //console.log('status sift', JSON.parse(userIdShift).status)
    //console.log('status userId', userId)
    if (JSON.parse(userIdShift).status == 1) {
      this.http.requests({
        requests: [() => this.http.getSchedules(userId)],
        onSuccess: async ([response]) => {
          if (response.status >= 400) {
            throw response;
          }
          //console.log('response data sift', response?.data?.data)

          if (response?.data?.data?.length) {
            let notifications = [];

            const schedules = response?.data?.data?.map?.(
              (dataschedule: any) => {
                if (dataschedule.syncAt !== null) {
                  this.uploadedSchedules.push(dataschedule.scheduleTrxId);
                } else if (!dataschedule.scannedAt) {
                  notifications.push(dataschedule);
                }

                // //console.log('photo', dataschedule.photo.path)
                // var foto = dataschedule.photo.path;
                const dataScheduledShift = {
                  scheduleTrxId: dataschedule.scheduleTrxId,
                  assetCategoryId: dataschedule.assetCategoryId,
                  assetCategoryName: dataschedule.assetCategoryName,
                  abbreviation: dataschedule.abbreviation,
                  adviceDate: dataschedule.adviceDate,
                  approvedAt: dataschedule.approvedAt,
                  approvedBy: dataschedule.approvedBy,
                  approvedNotes: dataschedule.approvedNotes,
                  assetId: dataschedule.assetId,
                  assetNumber: dataschedule.assetNumber,
                  assetStatusId: dataschedule.assetStatusId,
                  assetStatusName: dataschedule.assetStatusName,
                  condition: dataschedule.condition,
                  merk: dataschedule.merk,
                  capacityValue: dataschedule.capacityValue,
                  detailLocation: dataschedule.detailLocation,
                  unitCapacity: dataschedule.unitCapacity,
                  supplyDate: dataschedule.supplyDate,
                  reportPhoto: dataschedule.reportPhoto,
                  photo: dataschedule.photo?.path,
                  scannedAccuration: dataschedule.scannedAccuration,
                  scannedAt: dataschedule.scannedAt,
                  scannedBy: dataschedule.scannedBy,
                  scannedEnd: dataschedule.scannedEnd,
                  scannedNotes: dataschedule.scannedNotes,
                  scannedWith: dataschedule.scannedWith,
                  schDays: dataschedule.schDays,
                  schFrequency: dataschedule.schFrequency,
                  schManual: dataschedule.schManual,
                  schType: toLower(dataschedule.schType),
                  schWeekDays: dataschedule.schWeekDays,
                  schWeeks: dataschedule.schWeeks,
                  scheduleFrom: dataschedule.scheduleFrom,
                  scheduleTo: dataschedule.scheduleTo,
                  syncAt: dataschedule.syncAt,
                  tagId: dataschedule.tagId,
                  tagNumber: dataschedule.tagNumber,
                  unit: dataschedule.unit,
                  unitId: dataschedule.unitId,
                  area: dataschedule.area,
                  areaId: dataschedule.areaId,
                  latitude: dataschedule.latitude,
                  longitude: dataschedule.longitude,
                  created_at: dataschedule.created_at,
                  deleted_at: dataschedule.deleted_at,
                  date: dataschedule.date,
                  assetForm: JSON.stringify(dataschedule.assetForm),
                  idschedule: dataschedule.idschedule,
                };

                return dataScheduledShift;
              });
            const assetIdSchedule = [];
            const assetIdType = [];

            const assetiduniq = uniqBy(response?.data?.data, "assetId");

            assetiduniq
              ?.map?.((dataschedule: any) => {
                assetIdType.push(dataschedule.assetId)
                assetIdSchedule.push({
                  "assetId": dataschedule.assetId,
                  "categoryId": dataschedule.assetCategoryId
                }
                )
              });
            // //console.log('assetIdSchedule', assetIdSchedule);
            const assetIdScheduleType = { asset: JSON.stringify(assetIdSchedule) };
            const assetIdScheduleType1 = { asset: JSON.stringify(assetIdType) };
            //console.log('assetIdSchedule', assetIdSchedule);

            this.getTypeScan(assetIdScheduleType1);
            // this.getParameterByAssetId(assetIdScheduleType);
            let splitAssetIdSchedule = [];
            splitAssetIdSchedule = this.utils.chunkArray(assetIdSchedule, 250);
            splitAssetIdSchedule?.map?.(async val => {
              const payload = { asset: JSON.stringify(val) };
              await this.getParameterByAssetId(payload);
            });
            //console.log('splitAssetIdSchedule', splitAssetIdSchedule);


            //Jika ada record yang belum di upload


            // //console.log('assetIdSchedule', assetIdSchedule);
            // //console.log('schedules cek', schedules);
            this.database.insertbatch('schedule', schedules);

            this.shared.addLogActivity({
              activity: 'User Sinkronisasi Data dari Server',
              data: {
                message: 'Berhasil sinkronisasi jadwal shift',
                status: 'success',
              },
            });

            await this.notification.cancel('Notifikasi Scan');

            const scheduleFromGroupNotify = groupBy(
              notifications,
              'scheduleFrom'
            );
            const scheduleToGroupNotify = groupBy(notifications, 'scheduleTo');
            let scheduledData = { ...scheduleFromGroupNotify, ...scheduleToGroupNotify };
            // //console.log('scheduledData', scheduledData);

            for (const [key, data] of Object.entries<any>(scheduledData)) {
              const assetNames = data
                .map((item: any) => item.assetNumber)
                .join(', ');

              let scheduleTime: Date;

              const isExpiredSchedule = moment(key).subtract(1, 'd').isBefore(moment().format('YYYY-MM-DD HH:mm:ss'));
              const isUpcomingSchedule = moment(key).subtract(1, 'd').isAfter(moment().format('YYYY-MM-DD HH:mm:ss'));

              // eslint-disable-next-line @typescript-eslint/no-shadow
              const notificationSchema: LocalNotificationSchema = {
                id: 0, // ID akan otomatis ditimpa oleh service
                title: 'Scan Asset Notification',
                body: `Waktu untuk scan ${assetNames}`,
                schedule: {
                  at: new Date(moment(key).format('YYYY-MM-DDTHH:mm:ss')),
                  allowWhileIdle: true
                },
                smallIcon: 'ic_notification_schedule',
                largeIcon: 'ic_notification_schedule'
              };

              if (isExpiredSchedule) {
                notificationSchema.schedule.at.setDate(
                  notificationSchema.schedule.at.getDate() + 1
                );
              } else if (isUpcomingSchedule) {
                notificationSchema.schedule.at.setDate(
                  notificationSchema.schedule.at.getDate() - 1
                );
              }

              await this.notification.schedule(key, notificationSchema);
            }

            this.syncJob.order.schedules.status = 'success';
            this.syncJob.order.schedules.message =
              'Success mengambil data schedules';
          } else {
            this.shared.addLogActivity({
              activity: 'User synchronizes schedules dari server',
              data: {
                message: 'Data schedules kosong',
                status: 'failed',
              },
            });

            this.syncJob.order.schedules.status = 'failed';
            this.syncJob.order.schedules.message = 'Data schedules kosong';
          }
        },
        onError: (error) => {
          this.shared.addLogActivity({
            activity: 'User synchronizes schedules dari server',
            data: {
              message: this.http.getErrorMessage(error),
              status: 'failed',
            },
          });

          this.syncJob.order.schedules.status = 'failed';
          this.syncJob.order.schedules.message =
            'Gagal mendapatkan data schedules';
        },
      });
    }
  }

  private async getSchedulesNonSift() {
    const shared = this.injector.get(SharedService);
    const userIdNonShift = JSON.stringify(shared.userdetail.nonshift);
    if (JSON.parse(userIdNonShift).status == 1) {
      const usernonId = {
        userId: JSON.parse(userIdNonShift).data.operatorUserId,
      };
      this.http.requests({
        requests: [() => this.http.getSchedulesnonsift(usernonId)],
        onSuccess: async ([response]) => {
          if (response.status >= 400) {
            throw response;
          }

          //console.log('getSchedulesNonSift', response);

          if (response?.data?.data?.length) {
            const notifications = [];

            const schedules = response?.data?.data?.map?.(
              (dataschedule: any) => {
                if (dataschedule.syncAt != null) {
                  this.uploadedSchedules.push(dataschedule.scheduleTrxId);
                } else {
                  notifications.push(dataschedule);
                }

                const data = {
                  scheduleTrxId: dataschedule.scheduleTrxId,
                  assetCategoryId: dataschedule.assetCategoryId,
                  assetCategoryName: dataschedule.assetCategoryName,
                  abbreviation: dataschedule.abbreviation,
                  adviceDate: dataschedule.adviceDate,
                  approvedAt: dataschedule.approvedAt,
                  approvedBy: dataschedule.approvedBy,
                  approvedNotes: dataschedule.approvedNotes,
                  assetId: dataschedule.assetId,
                  assetNumber: dataschedule.assetNumber,
                  assetStatusId: dataschedule.assetStatusId,
                  assetStatusName: dataschedule.assetStatusName,
                  condition: dataschedule.condition,
                  merk: dataschedule.merk,
                  capacityValue: dataschedule.capacityValue,
                  detailLocation: dataschedule.detailLocation,
                  unitCapacity: dataschedule.unitCapacity,
                  supplyDate: dataschedule.supplyDate,
                  reportPhoto: dataschedule.reportPhoto,
                  photo: dataschedule.photo?.path,
                  scannedAccuration: dataschedule.scannedAccuration,
                  scannedAt: dataschedule.scannedAt,
                  scannedBy: dataschedule.scannedBy,
                  scannedEnd: dataschedule.scannedEnd,
                  scannedNotes: dataschedule.scannedNotes,
                  scannedWith: dataschedule.scannedWith,
                  schDays: dataschedule.schDays,
                  schFrequency: dataschedule.schFrequency,
                  schManual: dataschedule.schManual,
                  schType: toLower(dataschedule.schType),
                  schWeekDays: dataschedule.schWeekDays,
                  schWeeks: dataschedule.schWeeks,
                  scheduleFrom: dataschedule.scheduleFrom,
                  scheduleTo: dataschedule.scheduleTo,
                  syncAt: dataschedule.syncAt,
                  tagId: dataschedule.tagId,
                  tagNumber: dataschedule.tagNumber,
                  unit: dataschedule.unit,
                  unitId: dataschedule.unitId,
                  area: dataschedule.area,
                  areaId: dataschedule.areaId,
                  latitude: dataschedule.latitude,
                  longitude: dataschedule.longitude,
                  created_at: dataschedule.created_at,
                  deleted_at: dataschedule.deleted_at,
                  date: dataschedule.date,
                  assetForm: JSON.stringify(dataschedule.assetForm),
                  idschedule: dataschedule.idschedule,
                };

                return data;
              });
            const assetIdSchedule = [];
            const assetIdType = [];

            const assetiduniq = uniqBy(response?.data?.data, 'assetId');

            assetiduniq
              ?.map?.((dataschedule: any) => {
                assetIdType.push(dataschedule.assetId);
                assetIdSchedule.push({
                  assetId: dataschedule.assetId,
                  categoryId: dataschedule.assetCategoryId
                });
              });
            // //console.log('assetIdSchedule', assetIdSchedule);
            const assetIdScheduleType = { asset: JSON.stringify(assetIdSchedule) };
            const assetIdScheduleType1 = { asset: JSON.stringify(assetIdType) };
            //console.log('assetIdSchedule', assetIdSchedule);

            this.getTypeScan(assetIdScheduleType1);
            // this.getParameterByAssetId(assetIdScheduleType);
            let splitAssetIdSchedule = [];
            splitAssetIdSchedule = this.utils.chunkArray(assetIdSchedule, 250);
            splitAssetIdSchedule?.map?.(async val => {
              const payload = { asset: JSON.stringify(val) };
              await this.getParameterByAssetId(payload);
            });
            //Jika ada record yang belum di upload
            // if (uploadedSchedules?.length) {
            //   const marks = this.database.marks(uploadedSchedules.length).join(',');
            //   const where = {
            //     query: `scheduleTrxId IN (${marks})`,
            //     params: uploadedSchedules
            //   };

            //   this.database.update('record', { isUploaded: 1 }, where);
            // }

            // //console.log('assetIdSchedule', assetIdSchedule);
            // //console.log('schedules cek', schedules);
            this.database.insertbatch('schedule', schedules);

            this.shared.addLogActivity({
              activity: 'User synchronizes data dari server',
              data: {
                message: 'Berhasil synchronize schedules Non Sift',
                status: 'success',
              },
            });

            await this.notification.cancel('Scan Asset Notification');

            const groupedNotifications = groupBy(notifications, 'scheduleTo');

            for (const [key, data] of Object.entries<any>(
              groupedNotifications
            )) {
              const assetNames = data
                .map((item: any) => item.asset_number)
                .join(',');

              // //console.log(moment(key).format('YYYY-MM-DDTHH:mm:ss'));
              // //console.log(new Date(moment(key).format('YYYY-MM-DDTHH:mm:ss')));

              // eslint-disable-next-line @typescript-eslint/no-shadow
              const notificationSchema: LocalNotificationSchema = {
                id: 0, // ID akan otomatis ditimpa oleh service
                title: 'Scan Asset Notification',
                body: `Waktu untuk scan ${assetNames}`,
                schedule: {
                  at: new Date(moment(key).format('YYYY-MM-DDTHH:mm:ss')),
                  allowWhileIdle: true,
                },
                smallIcon: 'ic_notification_schedule',
                largeIcon: 'ic_notification_schedule',
              };

              notificationSchema.schedule.at.setHours(
                notificationSchema.schedule.at.getHours() - 1
              );

              await this.notification.schedule(key, notificationSchema);
            }

            const notificationSchema: LocalNotificationSchema = {
              id: 0, // ID akan otomatis ditimpa oleh service
              title: 'Scan Asset Notification',
              body: 'Waktu untuk scan',
              schedule: {
                at: new Date(moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')),
                allowWhileIdle: true,
              },
              smallIcon: 'ic_notification_schedule',
              largeIcon: 'ic_notification_schedule',
            };

            await this.notification.schedule(
              moment(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
              notificationSchema
            );

            this.syncJob.order.schedules.status = 'success';
            this.syncJob.order.schedules.message =
              'Success mengambil data schedules';
          } else {
            this.shared.addLogActivity({
              activity: 'User synchronizes schedules dari server',
              data: {
                message: 'Data schedules kosong',
                status: 'failed',
              },
            });

            this.syncJob.order.schedules.status = 'failed';
            this.syncJob.order.schedules.message = 'Data schedules kosong';
          }
        },
        onError: (error) => {
          this.shared.addLogActivity({
            activity: 'User synchronizes schedules dari server',
            data: {
              message: this.http.getErrorMessage(error),
              status: 'failed',
            },
          });

          this.syncJob.order.schedules.status = 'failed';
          this.syncJob.order.schedules.message =
            'Gagal mendapatkan data schedules';
        },
      });
    }
  }
  private async getSchedulesManual() {
    const shared = this.injector.get(SharedService);
    const userIdManual = JSON.stringify(shared.userdetail.lk3);

    if (JSON.parse(userIdManual).status == 1) {
      const usernonId = {
        userId: JSON.parse(userIdManual).data.operatorUserId,
      };
      this.http.requests({
        requests: [() => this.http.getSchedulesManual(usernonId)],
        onSuccess: async ([response]) => {
          //console.log(response.data.data)
          if (response.status >= 400) {
            throw response;
          }

          //console.log('getSchedulesManual', response);

          if (response?.data?.data?.length) {
            const notifications = [];

            const schedules = response?.data?.data?.map?.(
              (dataschedule: any) => {
                if (dataschedule.syncAt != null) {
                  this.uploadedSchedules.push(dataschedule.scheduleTrxId);
                } else {
                  notifications.push(dataschedule);
                }

                const data = {
                  scheduleTrxId: dataschedule.scheduleTrxId,
                  assetCategoryId: dataschedule.assetCategoryId,
                  assetCategoryName: dataschedule.assetCategoryName,
                  abbreviation: dataschedule.abbreviation,
                  adviceDate: dataschedule.adviceDate,
                  approvedAt: dataschedule.approvedAt,
                  approvedBy: dataschedule.approvedBy,
                  approvedNotes: dataschedule.approvedNotes,
                  assetId: dataschedule.assetId,
                  assetNumber: dataschedule.assetNumber,
                  assetStatusId: dataschedule.assetStatusId,
                  assetStatusName: dataschedule.assetStatusName,
                  condition: dataschedule.condition,
                  merk: dataschedule.merk,
                  capacityValue: dataschedule.capacityValue,
                  detailLocation: dataschedule.detailLocation,
                  unitCapacity: dataschedule.unitCapacity,
                  supplyDate: dataschedule.supplyDate,
                  reportPhoto: dataschedule.reportPhoto,
                  photo: dataschedule.photo?.path,
                  scannedAccuration: dataschedule.scannedAccuration,
                  scannedAt: dataschedule.scannedAt,
                  scannedBy: dataschedule.scannedBy,
                  scannedEnd: dataschedule.scannedEnd,
                  scannedNotes: dataschedule.scannedNotes,
                  scannedWith: dataschedule.scannedWith,
                  schDays: dataschedule.schDays,
                  schFrequency: dataschedule.schFrequency,
                  schManual: dataschedule.schManual,
                  schType: toLower(dataschedule.schType),
                  schWeekDays: dataschedule.schWeekDays,
                  schWeeks: dataschedule.schWeeks,
                  scheduleFrom: dataschedule.scheduleFrom,
                  scheduleTo: dataschedule.scheduleTo,
                  syncAt: dataschedule.syncAt,
                  tagId: dataschedule.tagId,
                  tagNumber: dataschedule.tagNumber,
                  unit: dataschedule.unit,
                  unitId: dataschedule.unitId,
                  area: dataschedule.area,
                  areaId: dataschedule.areaId,
                  latitude: dataschedule.latitude,
                  longitude: dataschedule.longitude,
                  created_at: dataschedule.created_at,
                  deleted_at: dataschedule.deleted_at,
                  date: dataschedule.date,
                  assetForm: JSON.stringify(dataschedule.assetForm),
                  idschedule: dataschedule.idschedule,
                };

                return data;
              }
            );
            const assetIdSchedule = [];
            const assetIdType = [];
            response?.data?.data
              ?.map?.((dataschedule: any) => {

                assetIdType.push(dataschedule.assetId);
                assetIdSchedule.push({
                  assetId: dataschedule.assetId,
                  categoryId: dataschedule.assetCategoryId
                });
              });
            // //console.log('assetIdSchedule', assetIdSchedule);
            const assetIdScheduleType = { asset: JSON.stringify(assetIdSchedule) };
            const assetIdScheduleType1 = { asset: JSON.stringify(assetIdType) };
            //console.log('assetIdSchedule', assetIdSchedule);

            this.getTypeScan(assetIdScheduleType1);
            // this.getParameterByAssetId(assetIdScheduleType);
            let splitAssetIdSchedule = [];
            splitAssetIdSchedule = this.utils.chunkArray(assetIdSchedule, 250);
            splitAssetIdSchedule?.map?.(async val => {
              const payload = { asset: JSON.stringify(val) };
              await this.getParameterByAssetId(payload);
            });

            //Jika ada record yang belum di upload


            // //console.log('assetIdSchedule', assetIdSchedule);
            // //console.log('schedules cek', schedules);
            this.database.insertbatch('schedule', schedules);

            this.shared.addLogActivity({
              activity: 'User synchronizes data dari server',
              data: {
                message: 'Berhasil synchronize schedules',
                status: 'success',
              },
            });

            await this.notification.cancel('Scan Asset Notification');

            const groupedNotifications = groupBy(notifications, 'scheduleTo');

            for (const [key, data] of Object.entries<any>(
              groupedNotifications
            )) {
              const assetNames = data
                .map((item: any) => item.asset_number)
                .join(',');

              // //console.log(moment(key).format('YYYY-MM-DDTHH:mm:ss'));
              // //console.log(new Date(moment(key).format('YYYY-MM-DDTHH:mm:ss')));

              // eslint-disable-next-line @typescript-eslint/no-shadow
              const notificationSchema: LocalNotificationSchema = {
                id: 0, // ID akan otomatis ditimpa oleh service
                title: 'Scan Asset Notification',
                body: `Waktu untuk scan ${assetNames}`,
                schedule: {
                  at: new Date(moment(key).format('YYYY-MM-DDTHH:mm:ss')),
                  allowWhileIdle: true,
                },
                smallIcon: 'ic_notification_schedule',
                largeIcon: 'ic_notification_schedule',
              };

              notificationSchema.schedule.at.setHours(
                notificationSchema.schedule.at.getHours() - 1
              );

              await this.notification.schedule(key, notificationSchema);
            }

            const notificationSchema: LocalNotificationSchema = {
              id: 0, // ID akan otomatis ditimpa oleh service
              title: 'Scan Asset Notification',
              body: 'Waktu untuk scan',
              schedule: {
                at: new Date(moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')),
                allowWhileIdle: true,
              },
              smallIcon: 'ic_notification_schedule',
              largeIcon: 'ic_notification_schedule',
            };

            await this.notification.schedule(
              moment(new Date()).format('YYYY-MM-DDTHH:mm:ss'),
              notificationSchema
            );

            this.syncJob.order.schedules.status = 'success';
            this.syncJob.order.schedules.message =
              'Success mengambil data schedules';
          } else {
            this.shared.addLogActivity({
              activity: 'User synchronizes schedules dari server',
              data: {
                message: 'Data schedules kosong',
                status: 'failed',
              },
            });

            this.syncJob.order.schedules.status = 'failed';
            this.syncJob.order.schedules.message = 'Data schedules kosong';
          }
        },
        onError: (error) => {
          this.shared.addLogActivity({
            activity: 'User synchronizes schedules dari server',
            data: {
              message: this.http.getErrorMessage(error),
              status: 'failed',
            },
          });

          this.syncJob.order.schedules.status = 'failed';
          this.syncJob.order.schedules.message =
            'Gagal mendapatkan data schedules';
        },
      });
    }
  }
  private async getAssets(
    subscriber: Subscriber<any>,
    loader: HTMLIonPopoverElement
  ) {
    return this.http.requests({
      requests: [() => this.http.getAssetTags()],
      onSuccess: async ([responseAssetTags]) => {
        //console.log('responseAssetTags', responseAssetTags);

        if (responseAssetTags.status >= 400) {
          throw responseAssetTags;
        }

        // await this.prepareDirectory('asset')
        await this.downloadCategory();
        // await this.processResponseAssetTags(responseAssetTags);

        this.syncJob.order.assets.status = 'success';
        this.syncJob.order.assets.message = 'Berhasil mendapatkan data lokasi';
      },
      onError: (error) => {
        this.shared.addLogActivity({
          activity: 'User synchronizes lokasi dari server',
          data: {
            message: this.http.getErrorMessage(error),
            status: 'failed',
          },
        });

        this.syncJob.order.assets.status = 'failed';
        this.syncJob.order.assets.message = 'Gagal mendapat data lokasi';
      },
      onComplete: () => this.onProcessFinished(subscriber, loader),
    });
  }
  private async getTypeScan(data) {
    //console.log('getTypeScan', data);

    return this.http.requests({
      requests: [() => this.http.typeTag(data)],
      onSuccess: async ([responseAssetTags]) => {
        //console.log('responseAssetTags', responseAssetTags);

        if (responseAssetTags.status >= 400) {
          throw responseAssetTags;
        }
        const assetTags = responseAssetTags?.data?.data?.map?.(
          (assetTag: any) => ({
            assetTaggingId: assetTag.assetTaggingId,
            assetId: assetTag.assetId,
            assetTaggingValue: assetTag.assetTaggingValue,
            assetTaggingType: assetTag.assetTaggingType,
            description: assetTag.description,
            created_at: assetTag.created_at,
            updated_at: assetTag.updated_at
          }

          ));
        // //console.log('assetTag', assetTags)
        // //console.log('assetTag Data', data)
        await this.database.emptyTable('assetTag')
          .then(() => this.database.insert('assetTag', assetTags));

        this.shared.addLogActivity({
          activity: 'User synchronizes tanda pemasangan dari server',
          data: {
            message: 'Berhasil synchronize tanda pemasangan',
            status: 'success',
          },
        });
      },
      onError: (error) => {},
    });
  }
  private async downloadCategory() {
    try {
      this.http.requests({
        requests: [() => this.http.getCategory()],
        onSuccess: async ([responseCategory]) => {
          if (responseCategory.status >= 400) {
            throw responseCategory;
          }
          //console.log('responseCategory', responseCategory);

          let previousPhotos: any = {};

          if (this.shared.isOfflineImages) {
            previousPhotos = await this.getPreviousPhotos('asset');
            //console.log('previousPhotos', previousPhotos);

            const newPhotos = responseCategory.data.data.map((asset: any) => asset.assetCategoryIconUrl);
            //console.log('newPhotos', newPhotos);

            const exceptions = Object.entries<string>(previousPhotos)
              .filter(([photo]) => newPhotos.includes(photo))
              .map(([photo, path]) => path?.split?.('/').pop());
            //console.log('exceptions', exceptions);

            await this.prepareDirectory('asset', exceptions);
          }

          const kategori = [];
          for (const category of responseCategory?.data?.data) {
            const offlinePhoto = await this.offlinePhoto('category', category.assetCategoryIconUrl);
            //console.log('offlinePhoto', offlinePhoto);

            const data = {
              assetCategoryId: category.id,
              kode: category.code,
              assetCategoryName: category.asset_category_name,
              description: category.description,
              urlImage: category.assetCategoryIconUrl,
              urlOffline: offlinePhoto,
              schType: toLower(category.schType),
            };
            kategori.push(data);
          }
          await this.database
            .emptyTable('category')
            .then(() => this.database.insertbatch('category', kategori));
        },
        onError: (error) => console.error(error),
      });
    } catch (error) {
      console.error(error);
    }
  }

  private async offlinePhoto(type: string, url: string) {
    let filePath: string;

    try {
      const name = url?.split('/').pop();

      const { path } = await this.http.download({
        url,
        filePath: `${name}`,
        fileDirectory: Directory.Data,
      });
      filePath = path;
    } catch (error) {
      console.error(error);
    }

    return filePath;
  }
  private async uploadActivityLogs(
    subscriber: Subscriber<any>,
    loader: HTMLIonPopoverElement
  ) {
    const activityLogs = (await this.getUnuploadedData('activityLog')).map(
      (activityLog) => {
        const data = {
          activity: activityLog.activity,
          ip: null,
          assetId: null,
          data: activityLog.data,
          time: activityLog.time,
        };

        if (Array.isArray(data.data) && data.data.length) {
          const [firstData] = data.data;
          data.assetId = firstData?.assetId || null;
        } else if (typeof data.data === 'object' && data.data !== null) {
          data.assetId = data.data?.assetId || null;
        }

        return data;
      }
    );

    if (activityLogs.length) {
      this.syncJob.isUploading = true;
      this.syncJob.order.activityLogs.message = 'Uploading log activities...';

      subscriber.next({
        complexMessage: Object.values(this.syncJob.order),
      });

      // //console.log({ uploadActivityLogs: JSON.stringify(activityLogs) });

      return this.http.requests({
        requests: [() => this.http.uploadActivityLogs(activityLogs)],
        onSuccess: async ([response]) => {
          if (response.status >= 400) {
            throw response;
          }

          this.database.update(
            'activityLog',
            { isUploaded: 1 },
            {
              query: `isUploaded=?`,
              params: [0],
            }
          );

          this.syncJob.order.activityLogs.status = 'success';
          this.syncJob.order.activityLogs.message =
            'Berhasil upload activity logs';
        },
        onError: (error) => {
          console.error(error);
          this.syncJob.order.activityLogs.status = 'failed';
          this.syncJob.order.activityLogs.message =
            'Gagal upload activity logs';
        },
        onComplete: () => this.onProcessFinished(subscriber, loader),
      });
    } else {
      delete this.syncJob.order.activityLogs;

      subscriber.next({
        complexMessage: Object.values(this.syncJob.order),
      });
    }
  }

  private async processResponseAssetTags(response: any) {
    if (response?.data?.data?.length) {
      const assetTags = response?.data?.data
        ?.map?.((assetTag: any) => ({
          assetTaggingId: assetTag.assetTaggingId,
          assetId: assetTag.assetId,
          assetTaggingValue: assetTag.assetTaggingValue,
          assetTaggingType: assetTag.assetTaggingType,
          description: assetTag.description,
          created_at: assetTag.created_at,
          updated_at: assetTag.updated_at
        }

        ));
      // //console.log('assetTags', assetTags);
      for (const assetT of assetTags) {
        // await this.getParameterByAssetId(assetT?.assetId);
        // //console.log('assetTags ID isi:', assetT?.assetId);
      }
      // //console.log('assetTags  ke 2:', assetTags);

      await this.database
        .emptyTable('assetTag')
        .then(() => this.database.insert('assetTag', assetTags));

      this.shared.addLogActivity({
        activity: 'User synchronizes tanda pemasangan dari server',
        data: {
          message: 'Berhasil synchronize tanda pemasangan',
          status: 'success',
        },
      });
    } else {
      this.shared.addLogActivity({
        activity: 'User synchronizes tanda pemasangan dari server',
        data: {
          message: 'Tanda pemasangan kosong',
          status: 'failed',
        },
      });
    }
  }

  private filterSchedule(
    schedule: any,
    now: number,
    dateInThisMonth: any[],
    lastWeek: number
  ) {
    const schType = schedule.schType?.toLowerCase?.();
    const weekdays = schedule?.schWeekDays
      ? schedule.schWeekDays?.toLowerCase?.().split(',')
      : [];

    if (schType === 'weekly') {
      const dateNow = dateInThisMonth.find(
        (item) => item.date === moment(now).date()
      );
      const isWeekNow =
        moment(now).week() ===
        moment(schedule.scheduleFrom, 'YYYY-MM-DD HH:mm:ss').week();
      return isWeekNow && weekdays.includes(dateNow?.day);
    }

    if (schType === 'monthly') {
      let isIncluded = true;

      const isMonthNow =
        moment(now).month() ===
        moment(schedule.scheduleFrom, 'YYYY-MM-DD HH:mm:ss').month();

      if (schedule.schWeeks || schedule.schWeekDays) {
        const dateNow = dateInThisMonth.find(
          (item) => item.date === moment(now).date()
        );
        const weeks = this.getSchWeeksAndDays(schedule.schWeeks, lastWeek);
        const matchWeek = weeks.includes(dateNow?.week);
        const matchWeekDay = weekdays.includes(dateNow?.day);

        isIncluded = matchWeek && matchWeekDay;
      }

      if (schedule.schDays) {
        const schDays = schedule.schDays
          ? schedule.schDays?.toLowerCase?.().split(',')
          : [];

        const dateNow = moment(now).date();
        const checkLast = schDays?.includes?.('last');
        isIncluded = schDays?.includes?.(dateNow.toString());

        if (checkLast) {
          const lastDateInThisMonth = moment(now)
            .month(moment(now).month() + 1)
            .date(0)
            .date();

          isIncluded = isIncluded || dateNow === lastDateInThisMonth;
        }
      }

      return isMonthNow && isIncluded;
    }

    return true;
  }

  private getDateInThisMonth(now: number) {
    const end = moment(now)
      .month(moment(now).month() + 1)
      .date(0)
      .date();

    const dateInThisMonth = this.utils.generateArray(end).map((item) => {
      const date = moment(now).date(item);
      const day = date.format('dd').toLowerCase();
      const week = date.week();

      return { date: item, day, week };
    });

    const [firstDay] = dateInThisMonth;
    const firstWeek = firstDay.week;
    const maxWeek = Math.max(...dateInThisMonth.map((item) => item.week));

    return dateInThisMonth.map((item) => {
      item.week = item.week - (firstWeek - 1);

      if (item.week < 1) {
        item.week = item.week + maxWeek;
      }

      return item;
    });
  }

  private getSchWeeksAndDays(schWeeks: string, lastWeek: number) {
    let weeks: any[] = schWeeks ? schWeeks?.toLowerCase?.().split(',') : [];

    weeks = weeks.map((item) => {
      if (item === 'first') {
        item = 1;
      } else if (item === 'second') {
        item = 2;
      } else if (item === 'third') {
        item = 3;
      } else if (item === 'fourth') {
        item = 4;
      } else if (item === 'fifth') {
        item = 5;
      } else if (item === 'last') {
        item = lastWeek;
      }

      return item;
    });

    return weeks;
  }

  async cekScan() {
    const permission = await BarcodeScanner.checkPermission({ force: true });
    if (permission.granted) {
      BarcodeScanner.hideBackground();
      document.body.classList.add('qrscanner');

      const options: ScanOptions = {
        targetedFormats: [SupportedFormat.QR_CODE],
      };

      BarcodeScanner.startScan(options).then(async (result) => {
        this.utils.overrideBackButton();
        document.body.classList.remove('qrscanner');

        if (result.hasContent) {
          const key = 'assetId=';
          const startIndex = result.content.indexOf(key) + key.length;

          const assetId = result.content;
          const data = JSON.stringify({
            type: 'qr',
            data: assetId,
          });
          //console.log('data', data);

          this.router.navigate(['asset-detail', { data }]);
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
  async openScan() {
    const stat = await this.checkStatus();
    //console.log('cek status nfc', stat)
    if (stat == 'NO_NFC') {

      const confirm = await this.utils.createCustomAlert({
        type: 'error',
        header: stat,
        message: 'NFC tidak tersedia',
        buttons: [
          {
            text: 'Tutup',
            handler: () => confirm.dismiss()
          }
        ]
      });

      confirm.present();
    } else {
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
            // const alert = await this.alertCtrl.create({
            //   header: 'Result',
            //   message: result.content,
            //   mode: 'ios',
            //   cssClass: 'dark:ion-bg-gray-800',
            //   buttons: [
            //     {
            //       text: 'Cancel',
            //       role: 'cancel'
            //     },
            //     {
            //       text: 'Copy',
            //       handler: () => {
            //         Clipboard.write({
            //           // eslint-disable-next-line id-blacklist
            //           string: result.content
            //         });
            //       }
            //     }
            //   ]
            // });

            // alert.present();
            const key = 'assetId=';
            const startIndex = result.content.indexOf(key) + key.length;

            const assetId = result.content;
            const data = JSON.stringify({
              type: 'qr',
              data: assetId
            });
            this.router.navigate(['change-rfid', { data }]);

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
  }
  async checkStatus() {
    if (this.platform.is('capacitor')) {
      try {
        this.nfcStatus = await this.nfc1.enabled();
      } catch (error) {
        this.nfcStatus = error;
      }
    }
    return this.nfcStatus;
  }

    return this.nfcStatus;
  }
}
