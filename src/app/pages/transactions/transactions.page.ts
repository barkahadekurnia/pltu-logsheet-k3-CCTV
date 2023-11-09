import { Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, LoadingController, MenuController, ToastController, ModalController, PopoverController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
// import { StatusBar, Style } from '@capacitor/status-bar';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { intersection, unionBy, uniq, zip, uniqBy, groupBy, orderBy } from 'lodash';
import { point } from '@turf/helpers';
import turf_distance from '@turf/distance';
import * as moment from 'moment';
import { StatusBar, Style } from '@capacitor/status-bar';
import { HttpService } from 'src/app/services/http/http.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { SynchronizeCardComponent } from 'src/app/components/synchronize-card/synchronize-card.component';
import { Observable, Subscriber } from 'rxjs';
import { MediaService } from 'src/app/services/media/media.service';
import { environment } from 'src/environments/environment';

import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';

type QuerySet = {
  query: string;
  params: any[];
};

type RequestOrder = {
  [key: string]: {
    label: string;
    message: string;
    status: string;
    request?: () => any | void;
  };
};
@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
})
export class TransactionsPage {

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
  segment: 'unuploaded' | 'uploaded';

  isHeaderVisible: boolean;
  loaded: number;
  loading: boolean;
  isFirstEnter: boolean;

  schedules: any[];
  filteredSchedules: any[];
  sourceSchedules: any[];
  sourceSchedulesSudah: any[];
  sourceSchedulesBelum: any[];

  schedulesUnuploaded:any[];
  private syncJob: {
    counter: number;
    order: RequestOrder;
    isUploading: boolean;
  };
  dataBelum: any[];
  dataSudah: any[];

  jumlahUploaded:number;
  jumlahUnuploaded:number;

  constructor(
    private router: Router,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private menuCtrl: MenuController,
    private toastCtrl: ToastController,
    private database: DatabaseService,
    private shared: SharedService,
    private utils: UtilsService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private http: HttpService,
    private notification: NotificationService,
    private injector: Injector,
    private media: MediaService,
  ) {
    this.segment = 'unuploaded';
    this.dataBelum= [];
    this.dataSudah= [];
    this.isHeaderVisible = false;
    this.loaded = 10;
    this.loading = true;
    this.isFirstEnter = true;

    this.schedules = [];
    this.filteredSchedules = [];
    this.sourceSchedules = [];
    this.sourceSchedulesSudah = [];
    this.sourceSchedulesBelum = [];

    this.schedulesUnuploaded = [];

    this.syncJob = {
      counter: 0,
      order: {},
      isUploading: false,
    };

    this.jumlahUnuploaded=0;
    this.jumlahUploaded=0;
  }

  ionViewWillEnter() {
    this.platform.ready().then(() => {
      this.getSchedules().finally(() => {
      });
    });
  }

  
  ionViewWillLeave() {

  }

  onSegmentChanged(event: any) {
    // this.segment = event.detail.value;
    // this.onSearch();
    this.segment = event.detail.value;
    console.log('segmen', this.segment )
    if (this.segment === 'unuploaded') {
      this.schedules = this.dataSudah;
      console.log('segmen unuploaded this.dataSudah', this.dataSudah)

    } else if (this.segment === 'uploaded') {
      this.schedules = this.dataBelum;
      console.log('segmen uploaded this.dataBelum', this.dataBelum)
    }
    this.onSearch();
  }

  doRefresh(e: any) {
   this.getSchedules().finally(() => e.target.complete());
  }

  onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

  pushData(event: any) {
    setTimeout(async () => {
      const start = this.schedules.length;
      console.log('cek isi this schedules',this.schedules);
      
      if (start < this.filteredSchedules.length) {
        let end = start + 20;

        end = end > this.filteredSchedules.length
          ? this.filteredSchedules.length
          : end;

        this.schedules.push(
          ...this.filteredSchedules.slice(start, end)
        );

        if (this.loaded < this.schedules.length) {
          this.loaded = this.schedules.length;
        }
      }
      // else {
      //   const toast = await this.toastCtrl.create({
      //     message: 'All data has been loaded',
      //     duration: 3000,
      //     color: 'dark',
      //     mode: 'ios',
      //     position: 'bottom',
      //   });

      //   toast.present();
      // }

      event.target.complete();
    }, 500);
  }
  async uploadData() {
    // this.http.refreshToken();
    this.syncJob.counter = 0;
    this.syncJob.isUploading = false;
    this.syncJob.order = {
      records: {
        label: 'Records',
        status: 'loading',
        message: 'Periksa data records...',
      },
      recordAttachments: {
        label: 'Record Attachments',
        status: 'loading',
        message: 'Periksa record attachments...',
      },
      recordAttachmentsApar: {
        label: 'Record Attachments Apar',
        status: 'loading',
        message: 'Periksa record attachments apar...',
      },
    };

    const loader = await this.popoverCtrl.create({
      component: SynchronizeCardComponent,
      cssClass: 'alert-popover center-popover',
      backdropDismiss: true,
      mode: 'ios',
      componentProps: {
        options: {
          complexMessage: Object.values(this.syncJob.order),
          observable: new Observable((subscriber) => {
            // this.syncJob.order.records.request = () =>
            //   this.uploadRecords(subscriber, loader);

            this.syncJob.order.recordAttachments.request = () =>
              this.uploadRecordAttachments(subscriber, loader);

            this.syncJob.order.recordAttachmentsApar.request = () =>
              this.uploadRecordAttachmentsApar(subscriber, loader);
          }),
        },
      }
    });

    //try to hide 
    await loader.present();
    const orders = Object.values(this.syncJob.order);

    for (const item of orders) {
      await item.request?.();
    }

    const now = this.utils.getTime();
    this.getSchedules();
    // this.application.bgSyncButton = 'btn-success';
  }

  private async uploadRecords(subscriber: Subscriber<any>, loader: HTMLIonPopoverElement) {
    const now = this.utils.getTime();
    const syncAt = moment(now).format('YYYY-MM-DD HH:mm:ss');

    const records = (await this.getUnuploadedData('record'))
      .map((record) => ({
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

    // console.log('records', records);

    if (records.length) {
      this.syncJob.isUploading = true;
      this.syncJob.order.records.message = 'Uploading data records...';

      const scheduleTrxIds = uniq(
        records.map(record => record.scheduleTrxId)
      );

      if (scheduleTrxIds.length > 1) {
        this.syncJob.order.records.message += ` (${scheduleTrxIds.length})`;
      }

      subscriber.next({
        complexMessage: Object.values(this.syncJob.order)
      });

      return this.http.requests({
        requests: [() => this.http.uploadRecords(records)],
        onSuccess: async ([response]) => {
          if (response.status >= 400) {
            throw response;
          }

          let uploaded = response?.data?.dataSchedule
            ?.map?.((schedule: any) => schedule); 
          
         // uploaded = uniq(uploaded.map(record => record.scheduleTrxId))
          uploaded = uniq(uploaded)

          console.log('sch200', response?.data?.dataSchedule?.sch200)
          console.log('sch', response?.data?.dataSchedule)
          const activityLogs = response?.data?.dataSchedule
            ?.map?.((schedule: any) => ({
              scheduleTrxId: schedule.scheduleId,
              status: 'success',
              message: 'Success add data',
            }))
            || [];

          activityLogs.push(...(
            response?.data?.data?.sch404
              ?.map?.((schedule: any) => ({
                scheduleTrxId: schedule.scheduleId,
                status: 'success',
                message: 'Success add data',
              }))
            || []
          ));
          console.log('uploaded?.length', uploaded);
          if (uploaded?.length) {
            const marks = this.database.marks(uploaded.length).join(',');
            console.log('mark', marks);
            console.log('mark2', uploaded);
            const where = {
              query: `scheduleTrxId IN (${marks})`,
              params: uploaded
            };

            this.database.update('schedule', { syncAt }, where);
            this.database.update('record', { isUploaded: 1 }, where);
          }

          if (uploaded?.length === scheduleTrxIds.length) {
            this.syncJob.order.records.status = 'success';
            this.syncJob.order.records.message = 'Success upload data records';

            console.log('this data uploaded' , uploaded); //7
            console.log('this schedule trx id' , scheduleTrxIds); //2
            

            if (uploaded.length > 1) {
              this.syncJob.order.records.message += ` (${uploaded.length})`;
            }
            
            //kasi jeda sebelum ngeclose
            await setTimeout(() => {
              loader.dismiss()
              }, 1500)
           // await loader.dismiss()
          } else {
            this.syncJob.order.records.status = 'failed';
            this.syncJob.order.records.message = 'Failed to upload data records';
            const failureCount = scheduleTrxIds.length - (uploaded?.length || 0);

            if (failureCount > 0) {
              this.syncJob.order.records.message += ` (${failureCount})`;
            }

            //dismissing error but no error
            //await loader.dismiss()
          }

          this.shared.addLogActivity({
            activity: 'User upload data ke server',
            data: activityLogs
          });
        },
        onError: (error) => {
          const activityLogs = scheduleTrxIds
            .map(scheduleTrxId => ({
              scheduleTrxId,
              status: 'failed',
              message: this.http.getErrorMessage(error)
            }));

          this.shared.addLogActivity({
            activity: 'User upload data ke server',
            data: activityLogs
          });

          this.syncJob.order.records.status = 'failed';
          this.syncJob.order.records.message = 'gagal upload data';
        },
        onComplete: () => this.onProcessFinished(subscriber, loader),
      });
    } else {
      delete this.syncJob.order.records;

      subscriber.next({
        complexMessage: Object.values(this.syncJob.order)
      });
    }
  }
  private async getUnuploadedData(table: string) {
    const data: any[] = [];

    try {
      const result = await this.database.select(table, {
        where: {
          query: 'isUploaded=?',
          params: [0]
        }
      });

      data.push(
        ...this.database.parseResult(result)
      );
    } catch (error) {
      console.error(error);
    }
    console.log('this unuploaded data' , data)
    return data;
  }
  private onProcessFinished(subscriber: Subscriber<any>, loader: HTMLIonPopoverElement) {
    this.syncJob.counter++;
    const maxCount = Object.keys(this.syncJob.order).length;
    // console.log('jumlah syc', this.syncJob.counter);

    if (this.syncJob.counter < maxCount) {
      subscriber.next({
        complexMessage: Object.values(this.syncJob.order)
      });
    } else {
      const data: any = {
        complexMessage: Object.values(this.syncJob.order),
        buttons: [{
          text: 'Tutup',
          handler: () => loader.dismiss()
        }]
      };
      loader.dismiss()
      const hasFailedSync = Object.values(this.syncJob.order)
        .find(item => item.status === 'failed');

      if (hasFailedSync) {
        data.buttons.push({
          text: 'See Details',
          handler: () => {
            loader.dismiss();
            this.router.navigate(['activity-logs']);
          }
        });
      }

      subscriber.next(data);
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
     console.log('isi att', recordAttachments);
    if (recordAttachments.length) {
      console.log('recordAttachments', recordAttachments)
      const uploaded = [];
      const activityLogs = [];
      this.syncJob.isUploading = true;
      this.syncJob.order.recordAttachments.message = 'Upload file attachments...';

      //upload attachment
      try {
        for (let file of recordAttachments) {
          const body = new FormData();
          body.append('scheduleTrxId', file.scheduleTrxId);
          body.append('trxId', file.trxId);
          body.append('notes', file.notes);
          body.append('timestamp',file.timestamp);
          body.append('filePath', await this.media.convertFileToBlob(file.filePath));
          body.append('parameterId',file.parameterId);
       

            console.log('isi body', ...<[]><unknown>body);
            
           const response = await this.http.postFormData(`${environment.url.recordAttachment}`, body);
          if (![200, 201].includes(response!.status)) {
            throw response;
          }
          activityLogs.push({
            scheduleTrxId: file.scheduleTrxId,
            status: 'success',
            message: `berhasil upload file attachment`,
          });

        }
          this.syncJob.order.recordAttachments.status = 'success';
          this.syncJob.order.recordAttachments.message = 'Berhasil mengupload draft lampiran';

       
          // for (const [i, item] of recordAttachments.entries()) {
          //       const { recordAttachmentId, ...data } = item;
        
          // uploaded.push(recordAttachmentId);
          // const attachmentBySchedule:any = {}

          // attachmentBySchedule[item.scheduleTrxId].uploadedAttachmentIds
          //     .push(recordAttachmentId);
          //   const uploadedBySchedule = Object.entries<any>(attachmentBySchedule)
          //     .filter(([key, value]) =>
          //       value.attachmentIds?.length === value.uploadedAttachmentIds?.length
          //     )
          //     .map(([scheduleTrxId]) => scheduleTrxId);
          //   console.log('uploadedBySchedule ', uploadedBySchedule);

          //   if (uploadedBySchedule.length) {
          //     const marks = this.database.marks(uploadedBySchedule.length);
          //     // console.log('marks', marks);

          //     const where = {
          //       query: `trxId IN (${marks})`,
          //       params: uploadedBySchedule
          //     };
          //     console.log(where)
          //     this.database.update('recordAttachment', { isUploaded: 1 }, where);
          //   }
          // }

          this.shared.addLogActivity({
            activity: 'User upload file attachments ke server',
            data: activityLogs
          });
          this.onProcessFinished(subscriber, loader);

      } catch (err) {
        console.error(err);
        this.syncJob.order.recordAttachments.status= 'failed';
        this.syncJob.order.recordAttachments.message = 'Gagal mengupload draft lampiran';
      } 
    } 
    else { 
    //delete this.syncJob.order.recordAttachmentsApar;

    // subscriber.next({
    //   complexMessage: Object.values(this.syncJob.order)
    // });

    }

    this.syncJob.order.recordAttachments.status = 'success';
    this.syncJob.order.recordAttachments.message = 'Berhasil mengupload draft lampiran';

    console.log('record attachment done')
  }

    private async uploadRecordAttachmentsApar(subscriber: Subscriber<any>, loader: HTMLIonPopoverElement) {
      const recordAttachmentsApar = (await this.getUnuploadedData('recordAttachmentPemadam'))
        .map((attachment) => ({
          recordAttachmentId: attachment.recordAttachmentId,
          scheduleTrxId: attachment.scheduleTrxId,
          trxId: attachment.trxId,
          notes: attachment.notes,
          type: attachment.type,
          filePath: attachment.filePath,
          timestamp: attachment.timestamp
        }));
      console.log('isi att', recordAttachmentsApar);
      if (recordAttachmentsApar.length) {
        const uploaded = [];
        const activityLogs = [];
        this.syncJob.isUploading = true;
        this.syncJob.order.recordAttachmentsApar.message = 'Upload file attachments...';
  
        if (recordAttachmentsApar.length > 1) {
          this.syncJob.order.recordAttachmentsApar.message += `(${recordAttachmentsApar.length})`;
        }
  
        const attachmentBySchedule: any = {};
  
        Object.entries(groupBy(recordAttachmentsApar, 'scheduleTrxId'))
          .forEach(([scheduleTrxId, attachments]) => {
            attachmentBySchedule[scheduleTrxId] = {
              attachmentIds: attachments
                .map(attachment => attachment.recordAttachmentId),
              uploadedAttachmentIds: [],
            };
          });
  
        subscriber.next({
          complexMessage: Object.values(this.syncJob.order)
        });
  
        for (const [i, item] of recordAttachmentsApar.entries()) {
          const { recordAttachmentId, ...data } = item;
  
          const leftover = recordAttachmentsApar.length - (i + 1);
           const body = new FormData();
          body.append('scheduleTrxId', item.scheduleTrxId);
          body.append('trxId', item.trxId);
          body.append('notes', item.notes);
          body.append('timestamp',item.timestamp);
          body.append('filePath', await this.media.convertFileToBlob(item.filePath));
        // body.append('parameterId',item.parameterId);
       

            console.log('isi body', ...<[]><unknown>body);

          await this.http.requests({
            requests: [() => this.http.postFormData(`${environment.url.attach}`, body)],
            onSuccess: ([response]) => {
              if (response.status >= 400) {
                throw response;
              }
              console.log('recordAttachmentId', response)
              uploaded.push(recordAttachmentId);
  
              attachmentBySchedule[item.scheduleTrxId].uploadedAttachmentIds
                .push(recordAttachmentId);
  
              activityLogs.push({
                scheduleTrxId: item.scheduleTrxId,
                status: 'success',
                message: `berhasil upload file attachment`,
              });
            },
            onError: (error) => {
              console.log(error)
              activityLogs.push({
                scheduleTrxId: item.scheduleTrxId,
                status: 'failed',
                message: error?.data
                  ? this.http.getErrorMessage(error.data)
                  : this.http.getErrorMessage(error)
              });
            },
            onComplete: () => {
              if (leftover) {
                this.syncJob.order.recordAttachmentsApar.message = 'Upload file attachments...';
  
                if (leftover > 1) {
                  this.syncJob.order.recordAttachmentsApar.message += ` (${leftover})`;
                }
  
                subscriber.next({
                  complexMessage: Object.values(this.syncJob.order)
                });
              } else {
                const uploadedBySchedule = Object.entries<any>(attachmentBySchedule)
                  .filter(([key, value]) =>
                    value.attachmentIds?.length === value.uploadedAttachmentIds?.length
                  )
                  .map(([scheduleTrxId]) => scheduleTrxId);
                // console.log('uploadedBySchedule', uploadedBySchedule);
  
                if (uploadedBySchedule.length) {
                  const marks = this.database.marks(uploadedBySchedule.length);
                  // console.log('marks', marks);
  
                  const where = {
                    query: `trxId IN (${marks})`,
                    params: uploadedBySchedule
                  };
                  console.log(where)
                  this.database.update('recordAttachmentPemadam', { isUploaded: 1 }, where).then((res)=> console.log('update sqllite attachment', res));
                }
  
                if (uploaded.length === recordAttachmentsApar.length) {
                  this.syncJob.order.recordAttachmentsApar.status = 'success';
                  this.syncJob.order.recordAttachmentsApar.message = 'Berhasil upload file attachment';
  
                  if (uploaded.length > 1) {
                    this.syncJob.order.recordAttachmentsApar.message += `s (${uploaded.length})`;
                  }
                } else {
                  const failureCount = recordAttachmentsApar.length - uploaded.length;
                  this.syncJob.order.recordAttachmentsApar.status = 'failed';
                  this.syncJob.order.recordAttachmentsApar.message = 'Gagal upload file attachment';
  
                  if (failureCount > 0) {
                    this.syncJob.order.recordAttachmentsApar.message += ` (${failureCount})`;
                  }
                }
  
                this.shared.addLogActivity({
                  activity: 'User upload file attachments ke server',
                  data: activityLogs
                });
  
                this.onProcessFinished(subscriber, loader);
              }
            },
          });
        }
      } else {
        delete this.syncJob.order.recordAttachmentsApar;
  
        subscriber.next({
          complexMessage: Object.values(this.syncJob.order)
        });
      }
    }
  

  openPreview(scheduleTrxId: string) {
    const data = JSON.stringify({ scheduleTrxId });
    return this.router.navigate(['form-preview', { data }]);
  }

  async openForm(asset: any, type: string = 'data-hold') {
    if (type === 'data-hold') {
      const data = JSON.stringify({
        data: asset.assetId,
        offset: -1,
      });

      this.router.navigate(['scan-form', { data }]);
    }

    if (type === 'coordinat') {
      const loader = await this.loadingCtrl.create({
        message: 'Get location ...',
        mode: 'ios',
      });

      loader.present();

      try {
        const { coords } = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 2000
        });

        const assetTag = asset.assetTags
          .find((tag: any) => tag.assetTaggingType === 'coordinat');

        const [latitude, longitude] = assetTag?.assetTaggingValue
          ?.split?.(',')
          .map((coord: string) => coord.trim())
          .map((coord: string) => this.utils.parseFloat(coord))
          || [0, 0];

        const from = point([coords.latitude, coords.longitude]);
        const to = point([latitude, longitude]);
        const units = 'kilometers';

        const distance = turf_distance(from, to, { units }) * 1000;

        if (distance <= 50) {
          const data = JSON.stringify({
            type: 'coordinat',
            data: asset.assetId,
            offset: -1,
          });

          this.router.navigate(['scan-form', { data }]);
        } else {
          const alert = await this.utils.createCustomAlert({
            type: 'warning',
            header: 'Oops',
            message:
              'Your location is too far from the asset, try to get closer and try again!',
            buttons: [{
              text: 'Close',
              handler: () => alert.dismiss()
            }],
          });
        }
      } catch (error) {
        const alert = await this.utils.createCustomAlert({
          type: 'error',
          header: 'Error',
          message: error.message
            || 'An error occurred while getting the location',
          buttons: [{
            text: 'Close',
            handler: () => alert.dismiss()
          }],
        });
      } finally {
        loader.dismiss();
      }
    }
  }

  openFilter() {
    return this.menuCtrl.open('filter-assets');
  }

  onSearch(event?: any) {
    if (event) {
      this.shared.filterOptions.keyword = event.detail.value;
    }

    this.filteredSchedules = this.sourceSchedules.filter((schedule) => {
      let condition = {
        uploaded: schedule.isUploaded,
        unuploaded: schedule.isUnuploaded,
        holded: schedule.hasRecordHold
      }[this.segment];

      condition = condition && schedule.assetNumber?.toLowerCase?.()
        .includes(this.shared.filterOptions.keyword.toLowerCase());

      const filteredData = this.shared.filterOptions.data
        .map(filter => {
          const values = filter.values
            .filter((value) => value.selected)
            .map((value) => value.value);

          return { ...filter, values };
        })
        .filter(filter => filter.values.length);

      if (filteredData.length) {
        condition =
          condition &&
          !Boolean(
            filteredData
              .map(({ key, values }) =>
                intersection(
                  schedule[key]?.map?.((item: any) => item.id),
                  values
                )
              )
              .find((data) => data.length === 0)
          );
      }

      return condition;
    });

    this.schedules = this.filteredSchedules.slice(0, this.loaded);
    console.log('schedules', this.schedules);
  }

  async getSchedules() {
    try {
      const resultSchedules = await this.database.select(
        'schedule',
        {
          column: [
            'scheduleTrxId',
            'abbreviation',
            'adviceDate',
            'approvedAt',
            'approvedBy',
            'approvedNotes',
            'assetId',
            'assetNumber',
            'assetStatusId',
            'assetStatusName',
            'condition',
            'merk',
            'capacityValue',
            'detailLocation',
            'unitCapacity',
            'supplyDate',
            'reportPhoto',
            'scannedAccuration',
            'scannedAt',
            'scannedBy',
            'scannedEnd',
            'scannedNotes',
            'scannedWith',
            'schDays',
            'schFrequency',
            'schManual',
            'schType',
            'schWeekDays',
            'schWeeks',
            'scheduleFrom',
            'scheduleTo',
            'syncAt',
            'tagId',
            'tagNumber',
            'unit',
            'unitId',
            'area',
            'areaId',
            'latitude',
            'longitude',
            'created_at',
            'deleted_at',
            'date',
            'photo',
            'assetCategoryId',
            'assetCategoryName'
          ],
          // join:
        }
      );
      const schedules = this.database.parseResult(resultSchedules);
      console.log('schedule', schedules)

      const resultRecord = await this.database.select(
        'record',
        {
          column: [
          'recordId' ,
          'condition',
          'parameterId',
          'scannedAt',
          'scannedBy',
          'scannedEnd',
          'scannedNotes',
          'scannedWith',
          'scheduleTrxId',
          'syncAt',
          'trxId',
          'value',
          'isUploaded',
          ],
          // join:
          groupBy: ['scheduleTrxId']
        }
      );
      const record = this.database.parseResult(resultRecord);
      console.log('record', record)

      const scheduleTrxIds = record.map((schedule) => schedule.scheduleTrxId);
      console.log('scheduleTrxIds', scheduleTrxIds)
      // const assetIds = uniqBy(scheduleTrxIds);
      // uniq(scheduleTrxIds.map((schedule) => schedule, console.log(schedule)));
      // console.log('assetIds', assetIds)
      const uploadedRecords = await this.getUploadedRecords(scheduleTrxIds);
      console.log('uploadedRecords', uploadedRecords)
      const unuploadedRecords = await this.getUnuploadedRecords();
      console.log('unusploadedRecords', unuploadedRecords)




      const now = this.utils.getTime();
      // const dateInThisMonth = this.getDateInThisMonth(now);
      // const lastWeek = Math.max(...dateInThisMonth.map(item => item.week));
      // const schedules = this.database.parseResult(resultSchedules)
      //   .filter(schedule => this.filterSchedule(schedule, now, dateInThisMonth, lastWeek));

      const assetIds = uniq(schedules.map((schedule) => schedule.assetId));
      const assetTags = await this.getAssetTags(assetIds);
      const holdedRecords = await this.getHoldedRecords(assetIds);

      // const scheduleTrxIds = schedules.map((schedule) => schedule.scheduleTrxId);
      //  const uploadedRecords = await this.getUploadedRecords(scheduleTrxIds);
      // const unuploadedRecords = await this.getUnuploadedRecords();

      // console.log('uploadedRecords',uploadedRecords);
      // console.log('unuploadedRecords',unuploadedRecords);
      


      // this.sourceSchedules
      this.sourceSchedules = schedules.map((schedule) => {
          const tagIds = schedule?.tagId?.length
            ? schedule?.tagId?.split?.(',')
            : [];

          const tagNumber = schedule?.tagNumber;
          const data = {
            scheduleTrxId: schedule.scheduleTrxId,
            assetId: schedule.assetId,
            assetNumber: schedule.assetNumber,
            assetStatusId: schedule.assetStatusId,
            assetStatusName: schedule.assetStatusName,
            assetTags: assetTags
              .filter(assetTag => assetTag.assetId === schedule.assetId),
            shift: null,
            scheduleType: 'Manual',
            scheduleFrom: moment(schedule.scheduleFrom)
              .format('D MMMM YYYY HH:mm'),
            scheduleTo: moment(schedule.scheduleTo)
              .format('D MMMM YYYY HH:mm'),
            uploadedOn: schedule.syncAt != null
              ? moment(schedule.syncAt).format('D MMMM YYYY HH:mm')
              : '-',
            scannedEnd: schedule.scannedEnd,
            tags: zip(tagIds, tagNumber).map(([id, name]) => ({ id, name })),
            isUploaded: false,
            isUnuploaded: false,
            hasPreview: false,
            hasRecordHold: false,
            abbreviation: schedule.abbreviation,
            adviceDate: schedule.adviceDate,
            approvedAt: schedule.approvedAt,
            approvedBy: schedule.approvedBy,
            approvedNotes: schedule.approvedNotes,
            condition: schedule.condition,
            capacityValue: schedule.capacityValue,
            detailLocation: schedule?.detailLocation,
            unitCapacity: schedule.unitCapacity,
            supplyDate: moment(schedule.supplyDate).format('D MMMM YYYY'),
            reportPhoto: schedule.reportPhoto,
            scannedAccuration: schedule.scannedAccuration,
            scannedAt: schedule.scannedAt,
            scannedBy: schedule.scannedBy,
            scannedNotes: schedule.scannedNotes,
            scannedWith: schedule.scannedWith,
            schDays: schedule.schDays,
            schFrequency: schedule.schFrequency,
            schManual: schedule.schManual,
            schType: schedule.schType,
            schWeekDays: schedule.schWeekDays,
            schWeeks: schedule.schWeeks,
            tagId: schedule.tagId,
            photo: schedule.photo,
            unit: schedule.unit,
            unitId: schedule.unitId,
            area: schedule.area,
            areaId: schedule.areaId,
            latitude: schedule.latitude,
            longitude: schedule.longitude,
            created_at: schedule.created_at,
            deleted_at: schedule.deleted_at,
            date: schedule.schedule,
            assetCategoryId: schedule.assetCategoryId,
            assetCategoryName: schedule.assetCategoryName
          };


          if (!schedule.scheduleManual) {
            let shiftFormat = 'HH:mm';

            if (schedule.schType?.toLowerCase() === 'weekly') {
              shiftFormat = '[W]-w';
            } else if (schedule.schType?.toLowerCase() === 'monthly') {
              shiftFormat = 'MMMM';
            }

            data.shift = moment(schedule.scheduleFrom).format(shiftFormat);
            data.scheduleType = 'Automatic';
          }

          if (schedule.syncAt != null) { // Uploaded
            data.isUploaded = true;
            data.hasPreview = uploadedRecords.includes(schedule.scheduleTrxId);
            data.scannedEnd = moment(schedule.scannedEnd, 'YYYY-MM-DD HH:mm:ss')
              .format('D MMMM YYYY HH:mm');
          } else if (schedule.scheduleTrxId in unuploadedRecords) { // Unuploaded
            data.isUnuploaded = true;
            data.hasPreview = true;
            const scannedEnd = unuploadedRecords[schedule.scheduleTrxId];

            if (scannedEnd) {
              data.scannedEnd = moment(scannedEnd, 'YYYY-MM-DD HH:mm:ss')
                .format('D MMMM YYYY HH:mm');
            }
          } else if (holdedRecords.includes(schedule.assetId)) { // Holded
            const start = new Date(schedule.scheduleFrom).getTime();
            const end = new Date(schedule.scheduleTo).getTime();
            data.hasRecordHold = moment(now).isBetween(start, end);
          }

          if (!data.scannedEnd) {
            data.scannedEnd = '-';
          }

          return data;
        })
        .filter(schedule => schedule.isUploaded || schedule.isUnuploaded || schedule.hasRecordHold);
       //.filter(schedule => schedule.isUnuploaded);

        console.log('cek semua', this.sourceSchedules);

       

        this.jumlahUnuploaded = 0 ; 
        this.jumlahUploaded = 0 ; 

        for( const transaksi of this.sourceSchedules) {

          if (transaksi.isUploaded === true){
            this.jumlahUploaded++
          } else if ( transaksi.isUnuploaded ===true) {
            this.jumlahUnuploaded++
          }

        }

        console.log('jumlah Unuploaded' , this.jumlahUnuploaded);
        console.log('jumlah Uploaded' , this.jumlahUploaded);
        
        this.dataSudah = [];

        this.dataBelum=this.sourceSchedules;
          } catch (error) {
            console.error(error);
          } finally {
            this.onSearch();
            this.loading = false;
          }
                  //lodash disini

          const res = orderBy(this.sourceSchedules, [(o) => new Date(o.uploadedOn)], ["desc"]);
          this.sourceSchedules = res
          // [{date:"2022-09-01"},{date:"2022-05-03"},{date:"2021-05-01"}]
          console.log('ini transaksi schedule sorting',res);
    }

  private async getUploadedRecords(scheduleTrxIds: string[]) {
    const records: string[] = [];

    try {
      const marks = this.database.marks(scheduleTrxIds.length).join(',');

      const result = await this.database.select('record', {
        column: ['scheduleTrxId'],
        where: {
          query: `isUploaded=? AND scheduleTrxId IN (${marks})`,
          params: [1, ...scheduleTrxIds],
        },
        groupBy: ['scheduleTrxId'],
      });

      records.push(
        ...this.database.parseResult(result).map(record => record.scheduleTrxId)
      );
    } catch (error) {
      console.error(error);
    }

    return records;
  }

  private async getUnuploadedRecords() {
    const unuploadedRecords: any = {};

    try {
      const result = await this.database.select('record', {
        column: [
          'scheduleTrxId',
          'scannedEnd'
        ],
        where: {
          query: `isUploaded=?`,
          params: [0]
        },
        groupBy: ['scheduleTrxId'],
      });

      this.database.parseResult(result).forEach(schedule => {
        unuploadedRecords[schedule.scheduleTrxId] = schedule.scannedEnd;
      });
    } catch (error) {
      console.error(error);
    }

    console.log('unuploadedRecords',unuploadedRecords);
    

    return unuploadedRecords;
  }

  private async getHoldedRecords(assetIds: string[]) {
    const records: string[] = [];

    try {
      const marks = this.database.marks(assetIds.length).join(',');

      const recordHold = await this.database.select('recordHold', {
        column: ['assetId'],
        where: {
          query: `assetId IN (${marks})`,
          params: assetIds,
        },
        groupBy: ['assetId'],
      });

      const recordAtachmentHold = await this.database.select('recordAttachment', {
        column: ['trxId'],
        where: {
          query: `isUploaded=? AND trxId IN (${marks})`,
          params: [-1, ...assetIds],
        },
        groupBy: ['trxId'],
      });

      records.push(...uniq([
        ...this.database.parseResult(recordHold).map((record) => record.assetId),
        ...this.database.parseResult(recordAtachmentHold).map((attachment) => attachment.key),
      ]));
    } catch (error) {
      console.error(error);
    }

    return records;
  }

  private async getAssetTags(assetIds: string[]) {
    const assetTags: any[] = [];

    try {
      const marks = this.database.marks(assetIds.length).join(',');

      const result = await this.database.select('assetTag', {
        column: [
          'assetId',
          'assetTaggingType',
          'assetTaggingValue'
        ],
        where: {
          query: `assetId IN (${marks})`,
          params: assetIds,
        },
      });

      assetTags.push(
        ...this.database.parseResult(result)
      );
    } catch (error) {
      console.error(error);
    }

    return assetTags;
  }

  private generateFilterAssetOptions() {
    this.shared.filterOptions = {
      data: [
        {
          label: 'Tag',
          key: 'tags',
          values: []
        },
        {
          label: 'Tag Location',
          key: 'tagLocations',
          values: []
        },
      ],
      keyword: '',
      onReset: () => {
        this.shared.filterOptions.data.forEach((group) => {
          group.values.forEach(value => value.selected = false);
        });

        this.onSearch();
      },
      onApply: () => this.onSearch(),
      onCancel: () => this.menuCtrl.close('filter-assets'),
    };

    // this.sourceSchedules.forEach((asset) => {
    //   this.shared.filterOptions.data
    //     .forEach((filter) => {
    //       filter.values = unionBy(
    //         filter.values,
    //         asset[filter.key]
    //           .map(({ id, name }) => ({
    //             text: name,
    //             value: id,
    //             selected: false,
    //           })),
    //         'value'
    //       );
    //     });
    // });
  }

  private filterSchedule(schedule: any, now: number, dateInThisMonth: any[], lastWeek: number) {
    const schType = schedule.schType?.toLowerCase?.();
    const weekdays = schedule?.schWeekDays ? schedule.schWeekDays?.toLowerCase?.().split(',') : [];

    if (schType === 'weekly') {
      const dateNow = dateInThisMonth.find(item => item.date === moment(now).date());
      const isWeekNow = moment(now).week() === moment(schedule.scheduleFrom, 'YYYY-MM-DD HH:mm:ss').week();
      return isWeekNow && weekdays.includes(dateNow?.day);
    }

    if (schType === 'monthly') {
      let isIncluded = true;

      const isMonthNow =
        moment(now).month() ===
        moment(schedule.scheduleFrom, 'YYYY-MM-DD HH:mm:ss').month();

      if (schedule.schWeeks || schedule.schWeekDays) {
        const weeks = this.getSchWeeksAndDays(schedule.schWeeks, lastWeek);
        const dateNow = dateInThisMonth.find(item => item.date === moment(now).date());
        const matchWeek = weeks.includes(dateNow?.week);
        const matchWeekDay = weekdays.includes(dateNow?.day);

        isIncluded = matchWeek && matchWeekDay;
      }

      if (schedule.schDays) {
        const schDays = schedule.schDays
          ? schedule.schDays?.toLowerCase?.().split(',')
          : [];

        const checkLast = schDays?.includes?.('last');
        isIncluded = schDays?.includes?.(moment(now).date().toString());

        if (checkLast) {
          const lastDateInThisMonth = moment(now)
            .month(moment(now).month() + 1)
            .date(0)
            .date();

          isIncluded = isIncluded || moment(now).date() === lastDateInThisMonth;
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

    const dateInThisMonth = this.utils.generateArray(end)
      .map(item => {
        const date = moment(now).date(item);
        const day = date.format('dd').toLowerCase();
        const week = date.week();

        return { date: item, day, week };
      });

    const [firstDay] = dateInThisMonth;
    const firstWeek = firstDay.week;
    const maxWeek = Math.max(...dateInThisMonth.map(item => item.week));

    return dateInThisMonth.map(item => {
      item.week = item.week - (firstWeek - 1);

      if (item.week < 1) {
        item.week = item.week + maxWeek;
      }

      return item;
    });
  }

  private getSchWeeksAndDays(schWeeks: string, lastWeek: number) {
    let weeks: any[] = schWeeks ? schWeeks?.toLowerCase?.().split(',') : [];

    weeks = weeks.map(item => {
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


  async openDetail(item){
    console.log('cek detail', item)
    const data = JSON.stringify({
      data: item,
      scheduleId: item.scheduleTrxId,
    })
    console.log('data json :', JSON.parse(data));
    return this.router.navigate(['transaction-detail', { data }]);
  }
  async uploadDetail(item){
    console.log('cek detail', item)
  }
}
