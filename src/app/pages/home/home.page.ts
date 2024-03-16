/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/semi */
/* eslint-disable @typescript-eslint/member-ordering */
import { UserDetail } from './../../services/shared/shared.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  MenuController,
  ModalController,
  Platform,
  PopoverController,
} from '@ionic/angular';
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
import { Subscriber, Observable, forkJoin, map } from 'rxjs';
import {
  Dictionary,
  groupBy,
  toLower,
  uniq,
  uniqBy,
} from 'lodash';
import * as moment from 'moment';

import { SynchronizeCardComponent } from 'src/app/components/synchronize-card/synchronize-card.component';
import { AssetsPage } from '../assets/assets.page';
import {
  BarcodeScanner,
  ScanOptions,
  SupportedFormat,
} from '@capacitor-community/barcode-scanner';
import { MediaService } from 'src/app/services/media/media.service';
import { AssetsCategory } from 'src/app/interfaces/assets-category';
import { AssetDetails } from 'src/app/interfaces/asset-details';
import { environment } from 'src/environments/environment';
import { Assets } from 'src/app/interfaces/asset';

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

  idArea: any = []
  idUnit: any = []


  schedules:any;
  schedulePerDate:any[]= [];
  scheduleIdPerDate:any[]= [];
  dataShiftPerDay:any[]=[];

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
    private media: MediaService,
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
      laporan: 0,
      sudahtransaksi: 0,
      belumtransaksi: 0,
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

    console.log( 'user detail: ', this.shared.userdetail)
    console.log( 'user: ', this.shared.user)
    this.platform.ready().then(() => {
      this.user = this.shared.user;
      this.detailuser = this.shared.userdetail;
      this.application.name = 'CCTV Logsheet';
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

  doRefresh(e: any) {
    this.getLocalAssets().finally(() => e.target.complete());
  }

  onScroll(e: any) {
    const val = e.detail.scrollTop > 0;
    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

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
    this.syncJob.counter = 0;
    this.syncJob.isUploading = false;
    this.syncJob.order = {
      holdAssets: {
        label: 'Record Assets',
        status: 'loading',
        message: 'Periksa record asset offline...',
      },
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
        label: 'Online Assets',
        status: 'loading',
        message: 'Mengambil data asset online...',
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
            this.syncJob.order.holdAssets.request = () =>
              this.uploadAssets(subscriber, loader);

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

    await this.getLocalAssets();
  }

  // pengecekan jumlah alat pemadam
  async getCountAssets() {
    return this.http.requests({
      requests: [
        () => this.http.getCountAsset()
      ],
      onSuccess: async ([response]) => {
        if (![200, 201].includes(response.status)) {
          throw response;
        }

        this.count.assets = response?.data?.data;
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

  openHarian() {
    const data = JSON.stringify({
      data: this.datalaporan,
    });

    return this.router.navigate(['laporan-harian', { data }]);
  }

  async getLocalAssets() {
    try {
      const result = await this.database.select('schedule', {
        column: [
          'assetId',
          'assetStatusName',
          'assetNumber',
          'assetStatusId'
        ],
        groupBy: ['assetId'],
      });

      const assetsParameterStatuses = await this.getAssetsParameterStatuses();
      const assets = this.database
        .parseResult(result)
        .filter((asset) => {
          const assetParameterStatuses =
            assetsParameterStatuses[asset.assetId] || [];

          return assetParameterStatuses;
        })
        .map((asset) => {
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

      await this.getLocalSchedules(assets);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  private async getLocalSchedules(assets: any[]) {
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
        column: [
          'scheduleTrxId',
          'assetId',
          'scannedAt',
          'syncAt'
        ],
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

      console.log('8. belum upload', unuploadedRecords);

      console.log('items of schedules', schedules);

      //untuk menghitung data yg sudah transaksi / uploaded . pada bae
      for (const x of schedules) {
        // console.log('jumlah sebanyak x' , x.syncAt);
        if (x.syncAt !== null) {
          count.sudahtransaksi++
        }
      }

      console.log('sudah transaksi', count.sudahtransaksi);


      for (const item of schedules) {
        const assetIndex = assets.findIndex(
          (asset) => asset.assetId === item.assetId
        );
        if (assetIndex >= 0 && item.scannedAt !== null) {
          // Uploaded
          assets[assetIndex].schedule.uploaded++;
          count.uploaded++;
        } else if (assetIndex >= 0 &&
          unuploadedRecords.includes(item.scheduleTrxId)) {
          // Unuploaded
          assets[assetIndex].schedule.unuploaded++;
          count.unuploaded++;
        } else if (assetIndex >= 0) {
          // Unscanned
          assets[assetIndex].schedule.unscanned++;
          count.unscanned++;
        } else if (assetIndex >= 0) {
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
      console.log('99. sudah transaksi', count.sudahtransaksi);

      console.log('10. upload', count.uploaded);
      console.log('11. belum upload', count.unuploaded);
      console.log('12. belum scan', count.unscanned);
      console.log('13. data schedules di home', schedules);
      console.log('14. data assets di home', assets);


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
          // console.log('responseLaporan', responseLaporan);
          this.jumlahlaporan = responseLaporan?.data?.data?.length
          // console.log('jumlahLaporan', this.jumlahlaporan);

          if (this.jumlahlaporan) {
            const filterdata = responseLaporan?.data?.data?.filter(
              (scan) => scan.reportDate == null
            );
            console.log('filterdata', filterdata);
            count.laporan = filterdata?.length;
            count.belumlaporan = filterdata?.length;
            count.sudahlaporan = this.jumlahlaporan - count.laporan;
            console.log('belum laporan', count.sudahlaporan);

            this.datalaporan = filterdata;
            console.log('dataLaporan', this.datalaporan)
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

      const fileToDeleted = files.filter((file) => !exceptions.includes(file as any));

      for (const file of fileToDeleted) {
        await Filesystem.deleteFile({
          path: `${type}/${file}`,
          directory: Directory.Data,
        });
      }
    } catch (error) {
      console.log(error);
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
      requests: [
        () => this.http.getParameters(assetId)
      ],
      onSuccess: async ([responseParameters]) => {
        if (![200, 201].includes(responseParameters.status)) {
          throw responseParameters;
        }

        const dataParameters: any[] = responseParameters.data?.data;
        const parametersToInsert = [];
        let storeParameters = [];

        if (dataParameters.length) {

          for (const parameter of dataParameters) {
            for (const param of parameter) {
              const data = {
                abnormal: param.abnormal,
                area: param.area,
                areaId: param.areaId,
                assetId: param.assetId,
                assetNumber: param.assetNumber,
                created_at: param.created_at,
                deleted_at: param.deleted_at,
                description: param.description,
                idx: param.index,
                inputType: param.inputType,
                max: param.max,
                min: param.min,
                normal: param.normal,
                option: param.option,
                parameterGroup: param.parameterGroup,
                parameterId: param.parameterId,
                parameterName: param.parameterName,
                schType: toLower(param.schType),
                showOn: param.show_on,
                tagId: param.tagId,
                unit: param.unit,
                unitId: param.unitId,
                uom: param.uom,
                updated_at: param.updated_at,
                work_instruction: param.work_instruction,
              };
              parametersToInsert.push(data);
            }
          }

          console.log('parametersToInsert', parametersToInsert);

          storeParameters = this.utils.chunkArray(parametersToInsert, 250);
          storeParameters?.map?.(async (val) => {
            await this.database.insert('parameter', val);
          });
        }
      },
      onError: (err) => console.error(err),
      onComplete: async () => await loader.dismiss()
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

      console.log('result di get unuploaded records ', result);


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

  private async uploadAssets(
    subscriber: Subscriber<any>,
    loader: HTMLIonPopoverElement
  ) {
    try {
      const resAssets = await this.database.select('asset', {
        column: [
          'assetId',
          'assetNumber',
          'assetForm',
          'description',
          'expireDate',
          'historyActive',
          'ipAddress',
          'lastScannedAt',
          'lastScannedBy',
          'more',
          'password',
          'photo',
          'schFrequency',
          'schManual',
          'schType',
          'supplyDate',
          'username',
          'updatedAt',
          'longitude',
          'latitude',
          'isUploaded',
        ]
      });

      const parsedAssets = this.database.parseResult(resAssets);
      const records: any[] = parsedAssets
        .filter((asset) => asset.isUploaded === 'false')
        .map(
          (asset) => ({
            assetId: asset.assetId,
            assetNumber: asset.assetNumber,
            assetForm: this.utils.parseJson(asset.assetForm),
            description: asset.description,
            expireDate: asset.expireDate,
            historyActive: asset.historyActive,
            ipAddress: asset.ipAddress,
            lastScannedAt: asset.lastScannedAt,
            lastScannedBy: asset.lastScannedBy,
            more: this.utils.parseJson(asset.more),
            password: asset.password,
            photo: this.utils.parseJson(asset.photo),
            schFrequency: asset.schFrequency,
            schManual: asset.schManual,
            schType: asset.schType,
            supplyDate: asset.supplyDate,
            username: asset.username,
            updatedAt: asset.updatedAt,
            longitude: asset.longitude,
            latitude: asset.latitude,
            isUploaded: asset.isUploaded,
          })
        );

      console.log('records', records);

      if (records.length) {
        this.syncJob.isUploading = true;
        this.syncJob.order.holdAssets.message = 'Uploading data record assets...';

        const respUploadAssetForm = this.uploadDataAssetForm(records);
        const respUploadMarkSign = this.uploadTagPemasangan(records);
        const resUploadDetailLocation = this.uploadDetailLocation(records);
        const resUploadPhoto = this.uploadAssetPhoto(records);

        const responseAll = [
          ...respUploadAssetForm,
          ...respUploadMarkSign,
          ...resUploadDetailLocation,
          ...resUploadPhoto,
        ];

        console.log('responseAll', responseAll);


        forkJoin(responseAll).pipe(
          map(async (results) => {
            console.log('results', results);

            // for (const row of results) {

            // }
          })
        ).subscribe();

        const activityLogs = {
          id: Date.now(),
          status: 'success',
          message: 'Berhasil upload detail assets'
        };

        this.syncJob.order.holdAssets.status = 'success';
        this.syncJob.order.holdAssets.message = 'Berhasil upload record assets';

        this.shared.addLogActivity({
          activity: 'User upload data ke server',
          data: activityLogs,
        });

      } else {
        delete this.syncJob.order.holdAssets;
      }
    } catch (err) {
      console.error(err);
      const activityLogs = {
        id: Date.now(),
        status: 'failed',
        message: this.http.getErrorMessage(err),
      };

      this.shared.addLogActivity({
        activity: 'User upload data ke server',
        data: activityLogs,
      });

      this.syncJob.order.holdAssets.status = 'failed';
      this.syncJob.order.holdAssets.message = 'Gagal upload record assets';
    } finally {
      subscriber.next({
        complexMessage: Object.values(this.syncJob.order),
      });

      this.onProcessFinished(subscriber, loader);
    }
  }

  private async uploadRecords(
    subscriber: Subscriber<any>,
    loader: HTMLIonPopoverElement
  ) {
    const now = this.utils.getTime();
    const syncAt = moment(now).format('YYYY-MM-DD HH:mm:ss');

    const records = (await this.getUnuploadedData('record')).map((record) => ({
      syncAt,
      userId: this.shared.user.id,
      updated_at: syncAt,
      ...record,
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
      .map((attachment) => ({ ...attachment }));

    //console.log('isi att', recordAttachments);
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
          requests: [
            () => this.http.uploadRecordAttachment(data)
          ],
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

              if (uploadedBySchedule.length) {
                const marks = this.database.marks(uploadedBySchedule.length);

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
    let groupedNotifications: Dictionary<any[]>;
    let notificationSchema: LocalNotificationSchema = null;

    return this.http.requests({
      requests: [
        () => this.http.getSchedules()
      ],
      onSuccess: async ([respSchedule]) => {
        if (![200, 201].includes(respSchedule.status)) {
          throw respSchedule;
        }

        console.log('SYNC: dataSchedule', respSchedule.data?.data);
        const dataSchedule: any[] = respSchedule.data?.data;

        if (dataSchedule.length) {
          const uploadedSchedules = [];
          const notifications = [];

          const schedules = dataSchedule.map?.(
            (dataschedule: any) => {
              if (dataschedule.syncAt !== null) {
                uploadedSchedules.push(dataschedule.scheduleTrxId);
              } else {
                notifications.push(dataschedule);
              }

              const data = {
                photo: dataschedule.photo?.path,
                schType: toLower(dataschedule.schType),
                assetForm: JSON.stringify(dataschedule.assetForm),
                ...dataschedule,
              };

              return data;
            }
          );

          console.log('schedules', schedules);
          this.schedules = schedules

          await this.scheduleShift(schedules);
          await this.getScheduleShift();

          const assetIdSchedule = [];
          const assetIdType = [];

          const assetiduniq = uniqBy(dataSchedule, 'assetId');

          assetiduniq
            ?.map?.((dataschedule: any) => {
              assetIdType.push(dataschedule.assetId);
              assetIdSchedule.push({
                assetId: dataschedule.assetId,
                categoryId: dataschedule.assetCategoryId
              });
            });

          const assetIdScheduleType = { asset: JSON.stringify(assetIdType) };

          await this.getTypeScan(assetIdScheduleType);
          await this.database.emptyTable('parameter');

          const splitAssetIdSchedule: any[] = this.utils.chunkArray(assetIdSchedule, 250);

          splitAssetIdSchedule?.map(async (val) => {
            const payload = { asset: JSON.stringify(val) };
            await this.getParameterByAssetId(payload);
          });

          await this.database.emptyTable('schedule');
          await this.database.insertbatch('schedule', schedules);

          if (this.uploadedSchedules?.length) {
            const marks = this.database
              .marks(this.uploadedSchedules.length)
              .join(',');

            const where = {
              query: `scheduleTrxId IN (${marks})`,
              params: this.uploadedSchedules,
            };

            await this.database.update('record', { isUploaded: 1 }, where);
          }

          await this.notification.cancel('Scan Asset Notification');

          groupedNotifications = groupBy(notifications, 'scheduleTo');

          for (const [key, data] of Object.entries<any>(
            groupedNotifications
          )) {
            const assetNames = data
              .map((item: any) => item.asset_number)
              .join(',');

            notificationSchema = {
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

          notificationSchema = {
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

          this.shared.addLogActivity({
            activity: 'User synchronizes schedules dari server',
            data: {
              message: 'Berhasil synchronize schedules',
              status: 'success',
            },
          });

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
      onComplete: () => {
        subscriber.next({
          complexMessage: Object.values(this.syncJob.order)
        });

        this.onProcessFinished(subscriber, loader);
      },
    });
  }

  async scheduleShift(schedules:any){
    const loader = await this.utils.presentLoader();
    const now = this.utils.getTime();
    const date = new Date(now);
    let dataShift:any[] = []
    const thisMonthDays = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();
    
   
    try{
      console.log('this month days',thisMonthDays)
      this.schedulePerDate = []
      this.scheduleIdPerDate = []
      for (let i = 1; i <= thisMonthDays; i++) {
        const label:string = moment()
          .year(date.getFullYear())
          .month(date.getMonth())
          .date(i)
          .format('YYYY-MM-DD');
        // console.log('label', label)
        // console.log('this schedule' , this.schedules)
        const schedulesPerDate = schedules
          .filter(schedule => schedule.date == label);
          //.map(schedule => console.log(schedule.date));
       
        //console.log('schedule per date' , schedulesPerDate)
        if(schedulesPerDate.length>0){
          this.schedulePerDate.push(schedulesPerDate)
          this.scheduleIdPerDate.push(schedulesPerDate[0]?.idschedule)
        }
      }

      console.log('this schedule per date', this.schedulePerDate)
      console.log('this schedule ID per date', this.scheduleIdPerDate)
      this.dataShiftPerDay = []

      for(let i = 0 ; i <this.scheduleIdPerDate.length ; i++) {
       
        
        console.log('looping ke ',i ,this.scheduleIdPerDate[i] )
        if(this.scheduleIdPerDate[i] !== undefined) {
          const response = await this.http.getSchedulesShift(this.scheduleIdPerDate[i])
          console.log('response get shift',response)

          if (![200, 201].includes(response.status)) {
            throw response;
          }

          const bodyResponse = response.data?.data;
          this.dataShiftPerDay = bodyResponse;
          console.log('dataShiftPerDay', this.dataShiftPerDay);

          const data:any = {
            idschedule : this.scheduleIdPerDate[i],
            data : JSON.stringify(this.dataShiftPerDay)
          }

          console.log('ini data sebelum di push ke sql lite' , data)

          await dataShift.push(data)
        } 
        // else if(this.scheduleIdPerDate[i] == undefined){
        //   const data:any = {
        //     idschedule : "",
        //     data : JSON.stringify(this.dataShiftPerDay)
        //   }

        //   await dataShift.push(data)

        // }
      }

    } catch (err) {
      console.log('error', err)
    } finally {

      console.log('data semua shift schedule' , dataShift)
      
      // const check = await this.database.checkTable('shift')
      // console.log('check', check)

      await this.database.emptyTable('shift').then( async ()  => 

       await this.database.insert('shift', dataShift)

      )
      
      loader.dismiss()
    }
    
  }

  async getScheduleShift() {
     const result = await this.database.select('shift' , {
        column:[
          'idschedule',
          'data'
        ],
        // where: {
        //   query: 'idschedule=?' ,
        //   params: this.scheduleIdPerDate[0]
        // }
      })

      console.log('result', result)

      const data : any= this.database.parseResult(result);
     
       console.log('this result database SQL Lite shift',data);
  }

  private async getAssets(
    subscriber: Subscriber<any>,
    loader: HTMLIonPopoverElement
  ) {
    return this.http.requests({
      requests: [
        () => this.http.getAssetTags(),
      ],
      onSuccess: async ([
        responseAssetTags,
      ]) => {
        if (![200, 201].includes(responseAssetTags.status)) {
          throw responseAssetTags;
        }

        await this.downloadCategory();
        await this.summaryAssets();
       await this.assetFormCategory();
        // await this.selectionUnit();
        // await this.selectionAreaByUnit();
        // await this.selectionTandaPemasangan();

        this.syncJob.order.assets.status = 'success';
        this.syncJob.order.assets.message = 'Berhasil mendapatkan online assets';
      },
      onError: (error) => {
        console.log('error', error);

        this.shared.addLogActivity({
          activity: 'User synchronizes lokasi dari server',
          data: {
            message: this.http.getErrorMessage(error),
            status: 'failed',
          },
        });

        this.syncJob.order.assets.status = 'failed';
        this.syncJob.order.assets.message = 'Gagal mendapat online assets';
      },
      onComplete: () => {
        this.shared.addLogActivity({
          activity: 'User mendapatkan online assets',
          data: {
            id: Date.now(),
            status: 'success',
            message: `Berhasil mendapatkan online assets`,
          },
        });

        subscriber.next({
          complexMessage: Object.values(this.syncJob.order),
        });

        this.onProcessFinished(subscriber, loader);
      }
    });
  }

  uploadDataAssetForm(records: any[]) {
    const body: FormData = new FormData();

    const requests = records
      .map(async (record) => {
        body.append('assetNumber', record.assetNumber);
        body.append('schType', record.schType);
        body.append('assetForm', JSON.stringify(record.assetForm));
        body.append('supplyDate', record.supplyDate);
        body.append('expireDate', record.expireDate);
        body.append('assetTaggingType', record.more.tagging[1].type);
        body.append('assetTaggingValue', record.more.tagging[1].value);
        body.append('mediaId', undefined);
        body.append('assetStatusId', record.more.status.id);
        body.append('merkId', undefined);
        body.append('typeId', record.more.type.id);
        body.append('capacityId', undefined);
        body.append('tagId', record.more.tag[0].id);
        body.append('historyActive', record.historyActive);
        body.append('assetCategoryId', record.more.category.id);
        body.append('ip', record.ipAddress);
        body.append('username', record.username);
        body.append('password', record.password);
        body.append('updatedAt', record.updatedAt);

        const response = await this.http.postAnyData(`${environment.url.updateDetailAsset}/${record.assetId}`, body);

        if (![200, 201].includes(response.status)) {
          return;
        }

        return response.body;
      });

    return requests;
  }

  uploadTagPemasangan(records: any[]) {
    const requests = records
      .map(async (record) => {
        const body = {
          tagId: record.more.tag[0].id
        };

        const response = await this.http.postAnyDataJson(`${environment.url.updateAssetTag}/${record.assetId}`, body);

        if (![200, 201].includes(response.status)) {
          return;
        }

        return response.body;
      });

    return requests;
  }

  uploadDetailLocation(records: any[]) {
    const requests = records
      .map(async (record) => {
        const tagId = record.more.tag[0].id;
        const body = {
          detailLocation: record.more.tag[0].detail_location, 
          latitude: record.latitude,
          longitude: record.longitude
        };

        const response = await this.http.uploadDetailLocation(tagId, body);

        if (![200, 201].includes(response.status)) {
          return;
        }

        return response.data?.data;
      });

    return requests;
  }

  uploadAssetPhoto(records: any[]) {
    const body: FormData = new FormData();
    let i = 0
    const requests = records
      .map(async (record) => {
        const resultPhoto = record.photo?.find((item) => item.assetPhotoType === 'primary');

        body.append('assetId', record.assetId);
        body.append('photo[]', await this.media.convertFileToBlob(resultPhoto.path), resultPhoto.photo);

        const response = await this.http.postFormData(`${environment.url.updateAsset}`, body);

        if (![200, 201].includes(response.status)) {
          return;
        }

        console.log('upload asset photo ke: ' ,i, response)
        i++
        return response.body;
       
      });

    return requests;
  }

  async summaryAssets() {
    const dataAssets: any[] = [];

    const responseCategory = await this.http.getCategory();

    const arrCategoryData: AssetsCategory[] = responseCategory.data?.data;

    const requests = arrCategoryData
      .map(async (category: AssetsCategory) => await this.getAssetsByCategoryId(category.id));

    forkJoin(requests).pipe(
      map(async (results: any) => {
        for (const row of results) {

          if (![200, 201].includes(row.status)) {
            throw row;
          }

          const arrAssets: AssetDetails[] = row.data?.data;

          if (arrAssets.length) {
            for (const asset of arrAssets) {
              const data = {
                assetId: asset.id,
                assetNumber: asset.asset_number,
                assetForm: JSON.stringify(asset.assetForm),
                description: asset.description,
                expireDate: asset.expireDate,
                historyActive: asset.historyActive,
                ipAddress: asset.ip,
                lastScannedAt: asset.lastScannedAt,
                lastScannedBy: asset.lastScannedBy,
                more: JSON.stringify(asset.more),
                password: asset.password,
                photo: JSON.stringify(asset.photo),
                schFrequency: asset.sch_frequency,
                schManual: asset.sch_manual,
                schType: asset.sch_type,
                supplyDate: asset.supply_date,
                username: asset.username,
                updatedAt: asset.updated_at,
                latitude: asset.latitude,
                longitude: asset.longitude,
                isUploaded: true,

              };
              dataAssets.push(data);
            }
          }
        }
      })
    ).subscribe(async () => {
      await this.database.emptyTable('asset');
      console.log('SYNC: summaryAssets', dataAssets);
      const arrAssetsToStore: any[] = this.utils.chunkArray(dataAssets, 250);

      arrAssetsToStore?.map(async (val) => {
        await this.database.insert('asset', val);
      });
    });
  }

  async getAssetsByCategoryId(categoryId: string) {
    const response = await this.http.getAssetsByCategoryId(categoryId);
    // const response = await this.http.getAllAssets(categoryId);
    return response;
  }

  async assetFormCategory() {
    const dataStatusAssets = [];

    try {
      const requests = await this.http.getAnyData(`${environment.url.formAssetCategoryAll}`);

      if (![200, 201].includes(requests.status)) {
        return;
      }

      const arrAssets: any[] = requests.data?.data;

      const assetFormCategoryAll: any[] = arrAssets
        ?.map(
          (asset) => ({
            formId: asset.formId,
            idx: asset.index,
            formLabel: asset.formLabel,
            formName: asset.formName,
            formType: asset.formType,
            formOption: asset.formOption,
            assetCategoryId: asset.assetCategoryId,
            assetCategoryCode: asset.assetCategoryCode,
            assetCategoryName: asset.assetCategoryName,
            created_at: asset.created_at,
            updated_at: asset.updated_at,
            deleted_at: asset.deleted_at
          })
        );

      await this.database.emptyTable('formAssetsCategory');
      console.log('SYNC: assetFormCategory', assetFormCategoryAll);
      await this.database.insert('formAssetsCategory', assetFormCategoryAll);

      for (const asset of arrAssets) {
        const assetCategoryId = asset.assetCategoryId;
        const response = await this.http.getAnyData(`${environment.url.statusAsset}/${assetCategoryId}`);

        if (![200, 201].includes(response.status)) {
          return;
        }

        const dataStatus = response.data?.data;
        dataStatusAssets.push(dataStatus);
      }
      console.log('dataStatusAssets', dataStatusAssets);

      if (dataStatusAssets.length) {
        await this.database.emptyTable('assetStatus');
        console.log('SYNC: assetStatus', dataStatusAssets);
        await this.database.insert('assetStatus', dataStatusAssets[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async selectionUnit() {
    const unitAll: any[] = [];

    const requests = await this.http.getAnyData(`${environment.url.selectionUnit}`);
    // console.log('requests', requests);

    if (![200, 201].includes(requests.status)) {
      throw requests;
    }

    this.idUnit = [];

    const units = requests.data.responds.results;
    if (units.length > 0) {
      for (const unit of units) {
        const data = { ...unit };
        unitAll.push(data);
        this.idUnit.push(data.id);
      }
    }

    await this.database.emptyTable('unit');
    console.log('SYNC: selectionUnit', unitAll);
    await this.database.insert('unit', unitAll);
  }

  async selectionAreaByUnit() {
    const areaAll: any[] = [];
    const idUnit = this.idUnit;

    for (const id of idUnit) {
      const requests = await this.http.getAnyData(`${environment.url.selectionArea}/${id}`);

      const dataArea: any[] = requests.data?.responds.results;

      if (dataArea.length) {
        for (const area of dataArea) {
          const data = {
            id: area.id,
            idUnit: id,
            area: area.area,
            kode: area.kode,
            deskripsi: area.deskripsi,
            updated_at: area.updated_at,
          };
          areaAll.push(data);
          this.idArea.push(data.id);
        }
      }
    }

    await this.database.emptyTable('area');
    console.log('SYNC: selectionAreaByUnit', areaAll);

    await this.database.insert('area', areaAll);
  }

  async selectionTandaPemasangan() {
    const assetAll: any[] = [];
    const idAreaTP = this.idArea;

    for (const idArea of idAreaTP) {
      const requests = await this.http.selectionTandaPemasanganId(idArea);

      const dataAssets: any[] = requests.data?.data;

      if (dataAssets.length) {
        for (const asset of dataAssets) {
          const data = {
            id: asset.id,
            idArea,
            tag_number: asset.tag_number,
            unit: asset.unit,
            area: asset.area,
            type_tag: asset.type_tag,
            location: asset.location,
            detail_location: asset.detail_location,
            latitude: asset.latitude,
            longitude: asset.longitude,
            tagCategory: asset.tagCategory,
            more: JSON.stringify(asset.more),
            photos: JSON.stringify(asset.photos),
          };
          assetAll.push(data);
        }
      }
    }

    this.database.emptyTable('markSign');
    console.log('SYNC: selectionTandaPemasangan', assetAll);

    const selectionTandaPemasanganStore: any[] = this.utils.chunkArray(assetAll, 250);

    selectionTandaPemasanganStore?.map?.(async (val) => {
      await this.database.insert('markSign', val);
    });
  }

  async selectionTandaPemasanganId(idArea: any) {
    const result = this.http.selectionTandaPemasanganId(idArea);
    console.log('selectionTandaPemasanganId', result);
    return result;
  }

  private async getTypeScan(data) {
    return this.http.requests({
      requests: [
        () => this.http.typeTag(data)
      ],
      onSuccess: async ([responseAssetTags]) => {
        if (![200, 201].includes(responseAssetTags.status)) {
          throw responseAssetTags;
        }

        const dataAssetTags: any[] = responseAssetTags.data?.data;
        console.log('SYNC: dataAssetTags', dataAssetTags);

        const assetTags = dataAssetTags?.map?.(
          (assetTag: any) => ({ ...assetTag })
        );
        console.log('assetTag', assetTags);

        await this.database.emptyTable('assetTag');
        await this.database.insert('assetTag', assetTags)

        this.shared.addLogActivity({
          activity: 'User synchronizes tanda pemasangan dari server',
          data: {
            message: 'Berhasil synchronize tanda pemasangan',
            status: 'success',
          },
        });
      },
      onError: (err) => {
        console.log(err);
        this.shared.addLogActivity({
          activity: 'User synchronizes tanda pemasangan dari server',
          data: {
            message: this.http.getErrorMessage(err),
            status: 'failed',
          },
        });
      },
    });
  }

  private async downloadCategory() {
    try {
      this.http.requests({
        requests: [
          () => this.http.getCategory()
        ],
        onSuccess: async ([responseCategory]) => {
          if (![200, 201].includes(responseCategory.status)) {
            throw responseCategory;
          }
          // console.log('responseCategory', responseCategory);

          const dataCategory: any[] = responseCategory.data?.data;
          console.log('isOfflineImages', this.shared.isOfflineImages);

          if (this.shared.isOfflineImages) {
            const previousPhotos = await this.getPreviousPhotos('asset');
            console.log('previousPhotos', previousPhotos);

            const newPhotos = dataCategory?.map((asset: any) => asset.assetCategoryIconUrl);
            console.log('newPhotos', newPhotos);


            const exceptions = Object.entries<string>(previousPhotos)
              .filter(([photo]) => newPhotos.includes(photo))
              .map(([photo, path]) => path?.split?.('/').pop());
            console.log('exceptions', exceptions);


            await this.prepareDirectory('asset', exceptions);
          }

          const kategori = [];
          for (const category of dataCategory) {
            const offlinePhoto = category.assetCategoryIconUrl ? await this.offlinePhoto('category', category.assetCategoryIconUrl) : null;

            const data = {
              assetCategoryId: category.id,
              assetCategoryName: category.asset_category_name,
              description: category.description,
              kode: category.code,
              urlImage: category.assetCategoryIconUrl,
              urlOffline: offlinePhoto,
              schType: toLower(category.schType),
              assetCategoryType: category.assetCategoryType,
            };
            kategori.push(data);
          }

          console.log('SYNC: downloadCategory', kategori);

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

  private async uploadActivityLogs(
    subscriber: Subscriber<any>,
    loader: HTMLIonPopoverElement
  ) {
    const activityLogs = (await this.getUnuploadedData('activityLog')).map(
      (activityLog) => {
        const data = {
          ip: null,
          assetId: null,
          ...activityLog,
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

      return this.http.requests({
        requests: [
          () => this.http.uploadActivityLogs(activityLogs)
        ],
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
    // const data = JSON.stringify({
    //   type: 'qr',
    //   data: 'https://cctv.chimney.id/#/assets/detail/42337cd5-dc65-4b6b-9750-1e4c50afe6d5/33d63f74-ab08-4c29-b86b-63f6e99d6c48',
    // });

    // this.router.navigate(['asset-detail', { data }]);

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
          const assetId = /[^/]*$/.exec(result.content)[0];

          const data = JSON.stringify({
            type: 'qr',
            data: assetId,
          });

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
