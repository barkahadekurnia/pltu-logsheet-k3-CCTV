/* eslint-disable @typescript-eslint/naming-convention */
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActionSheetOptions } from '@ionic/core';

import {
  Platform,
  ActionSheetController,
  AlertController,
  LoadingController,
  MenuController,
  PopoverController,
  NavController
} from '@ionic/angular';

import { Capacitor } from '@capacitor/core';
import { LocalNotificationSchema } from '@capacitor/local-notifications';
import { DatabaseService } from 'src/app/services/database/database.service';
import { MediaService } from 'src/app/services/media/media.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { groupBy, zip } from 'lodash';
import { v4 as uuid } from 'uuid';
import Viewer from 'viewerjs';
import * as moment from 'moment';

import { SaveOptionsComponent } from 'src/app/components/save-options/save-options.component';
import { UploadRecordsComponent } from 'src/app/components/upload-records/upload-records.component';

@Component({
  selector: 'app-form-preview',
  templateUrl: './form-preview.page.html',
  styleUrls: ['./form-preview.page.scss'],
})
export class FormPreviewPage {
  record: {
    scannedAt: string;
    scannedEnd: string;
    scannedBy: string;
    scannedWith: string;
    scannedNotes: string;
  };

  schedule: {
    scheduleTrxId: string;
    abbreviation: string;
    adviceDate: string;
    approvedAt: string;
    approvedBy: string;
    approvedNotes: string;
    assetId: string;
    photo: string;
    offlinePhoto: string;
    assetNumber: string;
    assetStatusId: string;
    assetStatusName: string;
    condition: string;
    merk: string;
    capacityValue: string;
    detailLocation: string;
    unitCapacity: string;
    supplyDate: string;
    reportPhoto: string;
    scannedAccuration: string;
    scannedAt: string;
    scannedBy: string;
    scannedEnd: string;
    scannedNotes: string;
    scannedWith: string;
    schDays: string;
    schFrequency: string;
    schManual: string;
    schType: string;
    schWeekDays: string;
    schWeeks: string;
    scheduleFrom: string;
    scheduleTo: string;
    syncAt: string;
    tagId: string;
    tagNumber: string;
    unit: string;
    unitId: string;
    area: string;
    areaId: string;
    latitude: string;
    longitude: string;
    created_at: string;
    deleted_at: string;
    date: string;
    assetForm: string;
  };

  attachments: any[];
  datasc: any;
  loading: boolean;
  offset: number;
  readonly: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private actionSheetCtrl: ActionSheetController,
    private platform: Platform,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private menuCtrl: MenuController,
    private popoverCtrl: PopoverController,
    private database: DatabaseService,
    private media: MediaService,
    private notification: NotificationService,
    private shared: SharedService,
    private utils: UtilsService,
    private navCtrl: NavController,

  ) {
    this.record = {
      scannedAt: '',
      scannedEnd: '',
      scannedBy: '',
      scannedWith: '',
      scannedNotes: '',
    };

    this.schedule = {
      scheduleTrxId: '',
      abbreviation: '',
      adviceDate: '',
      approvedAt: '',
      approvedBy: '',
      approvedNotes: '',
      assetId: '',
      photo: '',
      offlinePhoto: '',
      assetNumber: '',
      assetStatusId: '',
      assetStatusName: '',
      condition: '',
      merk: '',
      capacityValue: '',
      detailLocation: '',
      unitCapacity: '',
      supplyDate: '',
      reportPhoto: '',
      scannedAccuration: '',
      scannedAt: '',
      scannedBy: '',
      scannedEnd: '',
      scannedNotes: '',
      scannedWith: '',
      schDays: '',
      schFrequency: '',
      schManual: '',
      schType: '',
      schWeekDays: '',
      schWeeks: '',
      scheduleFrom: '',
      scheduleTo: '',
      syncAt: '',
      tagId: '',
      tagNumber: '',
      unit: '',
      unitId: '',
      area: '',
      areaId: '',
      latitude: '',
      longitude: '',
      created_at: '',
      deleted_at: '',
      date: '',
      assetForm: '',

    };

    this.attachments = [];
    this.loading = true;
    this.offset = 0;
    this.readonly = false;
    this.datasc = {};
  }

  ionViewWillEnter() {
    const transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );
    this.datasc = transitionData;
    if (!transitionData) {
      return this.utils.back();
    }
    console.log('datasc :', this.datasc)
    this.platform.ready().then(() => {
      this.offset = transitionData.offset || 0;

      if (transitionData.scheduleTrxId) {
        this.getRecords(transitionData.scheduleTrxId)
          .finally(() => {
            if (this.schedule.assetId) {
              this.shared.asset = this.schedule;

              this.menuCtrl.enable(true, 'asset-information')
                .then(() => this.menuCtrl.swipeGesture(true, 'asset-information'));
            }
          });
      } else {
        this.schedule = transitionData.asset;
        this.record = transitionData.record;
        this.record.scannedBy = this.shared.user.name;
        this.schedule = transitionData.schedule;
        this.attachments = transitionData.attachments;
        this.shared.asset = this.schedule;
        this.loading = false;

        this.menuCtrl.enable(true, 'asset-information')
          .then(() => this.menuCtrl.swipeGesture(true, 'asset-information'));
      }
    });
  }

  async ionViewWillLeave() {
    await this.menuCtrl.enable(false, 'asset-information');
    await this.menuCtrl.swipeGesture(false, 'asset-information');
  }

  showAssetInfo() {
    return this.menuCtrl.open('asset-information');
  }

  back() {
    return this.utils.back();
  }

  async onMediaSelected(media: any, parameter?: any) {
    const options: ActionSheetOptions = {
      animated: true,
      backdropDismiss: true,
      header: media?.name,
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [
        {
          icon: 'trash-outline',
          text: 'Delete',
          role: 'destructive',
          handler: () => this.confirmDeleteAttachment(media, parameter)
        }
      ]
    };

    if (media.type.startsWith('image')) {
      options.buttons.unshift({
        icon: 'image-outline',
        text: 'View Photo',
        handler: () => this.media.showPicture(media?.filePath)
      });
    } else if (media.type.startsWith('audio')) {
      options.buttons.unshift({
        icon: 'volume-high-outline',
        text: 'Play Audio',
        handler: () => this.media.playAudio(media?.filePath)
      });
    } else if (media.type.startsWith('video')) {
      options.buttons.unshift({
        icon: 'play-circle-outline',
        text: 'Play Video',
        handler: () => this.media.playVideo(media?.filePath)
      });
    }

    const actionSheet = await this.actionSheetCtrl.create(options);
    actionSheet.present();



    // const options: ActionSheetOptions = {
    //   mode: 'md',
    //   animated: true,
    //   backdropDismiss: true,
    //   header: media?.name,
    //   cssClass: 'dark:ion-bg-gray-800',
    //   buttons: [{
    //     icon: 'close-outline',
    //     text: 'Cancel',
    //     role: 'cancel'
    //   }]
    // };

    // if (media?.notes) {
    //   options.buttons.unshift({
    //     icon: 'pencil-outline',
    //     text: 'View Notes',
    //     handler: () => this.showMediaNotes(media),
    //   });
    // }

    // if (media.type.startsWith('image')) {
    //   options.buttons.unshift({
    //     icon: 'image-outline',
    //     text: 'View Photo',
    //     handler: () => this.media.showPicture(media?.filePath),
    //   });
    // } else if (media.type.startsWith('audio')) {
    //   options.buttons.unshift({
    //     icon: 'volume-high-outline',
    //     text: 'Play Audio',
    //     handler: () => this.media.playAudio(media?.filePath),
    //   });
    // } else if (media.type.startsWith('video')) {
    //   options.buttons.unshift({
    //     icon: 'play-circle-outline',
    //     text: 'Play Video',
    //     handler: () => this.media.playVideo(media?.filePath),
    //   });
    // }

    // const actionSheet = await this.actionSheetCtrl.create(options);
    // actionSheet.present();
  }

  showImageViewer({ target }: Event) {
    const viewer = new Viewer(target as HTMLElement, {
      navbar: false,
      toolbar: false,
      button: false
    });

    viewer.show();
  }

  async saveRecords() {
    if (!this.readonly) {
      const loader = await this.loadingCtrl.create({
        spinner: 'dots',
        message: 'Saving data...',
        cssClass: 'dark:ion-bg-gray-800',
        mode: 'ios',
      });
      const trxid = uuid();
      loader.present();
      console.log('data', this.datasc);
      try {

        const now = this.utils.getTimeNow();
        const scan = moment(now).format('YYYY-MM-DD HH:mm:ss');
        const current = new Date();

        // // if (schedule) {

        const scannedEnd = moment(current).format('YYYY-MM-DD HH:mm:ss');

        const attachments = [];
        const attachmentsapar = [];
        const reco = [];

        this.datasc.data?.map((parameter, k) => {
          reco.push({
            condition: parameter.isDeviation ? 'Finding' : 'Normal',
            parameterId: parameter.parameterId,
            scannedAt: scan,
            scannedBy: this.datasc.record.scannedBy,
            scannedEnd,
            scannedNotes: parameter.notes,
            scannedWith: this.datasc.record.scannedWith,
            scheduleTrxId: this.datasc.asset.scheduleTrxId,
            syncAt: scan,
            trxId: uuid(),
            value: parameter.value ? parameter.value : false,
            isUploaded: 0,
          });
          parameter.attachments?.map((attachment: any) => {
            attachments.push({
              scheduleTrxId: this.datasc.asset.scheduleTrxId,
              trxId: parameter.parameterId,
              notes: parameter.notes,
              type: attachment.type,
              filePath: attachment.filePath,
              timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
              isUploaded: 0
            });
          });
          // console.log('datasc :', record);
        });

        if (this.datasc.attachments.length) {
          this.datasc.attachments?.map(att => {
            attachments.push({
              scheduleTrxId: this.datasc.asset.scheduleTrxId,
              trxId: uuid(),
              notes: att.notes,
              type: att.type,
              filePath: att.filePath,
              parameterId: att.parameterId,
              timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
              isUploaded: 0
            });
          });
        }

        if (this.datasc.attachmentsapar.length) {
          this.datasc.attachmentsapar?.map(att => {
            attachmentsapar.push({
              scheduleTrxId: this.datasc.asset.scheduleTrxId,
              trxId: uuid(),
              notes: this.datasc.record?.scannedNotes,
              type: att.type,
              filePath: att.filePath,
              timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
              isUploaded: 0
            });
          });
        }

        // let dataRes = [{
        //   records: data,
        //   attachments: attachments
        // }]
        console.log('datasc', this.datasc);
        console.log('data reco', reco);
        console.log('data att', attachments);

        console.log('nite', this.datasc.record.scannedNotes);

        console.log('assetid', this.datasc.schedule[0].assetId);

        if (reco.length) {
          const parameterIds = reco.map(item => item.parameterId);
          const marks = this.database.marks(parameterIds.length).join(',');
          console.log('parameterIds', parameterIds);
          await this.database.delete('record', {
            query: `scheduleTrxId=? AND parameterId IN (${marks})`,
            params: [this.datasc.asset.scheduleTrxId, ...parameterIds],
          });
          await this.database.insert('record', reco);

          await this.database.update(
            'schedule',
            {
              scannedEnd,
              scannedNotes: this.datasc.record.scannedNotes,
            },
            {
              query: 'scheduleTrxId=?',
              params: [this.datasc.asset.scheduleTrxId],
            }
          );

          await this.database.delete('recordHold', {
            query: 'assetId=?',
            params: [this.datasc.schedule[0].assetId],
          });

          // attachments.push(
          //   ...this.attachments.map(attachment => ({
          //     ...attachment,
          //     key: this.datasc.asset.scheduleTrxId,
          //     timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
          //     isUploaded: 0
          //   }))
          // );
          console.log('attachments', attachments);
          console.log('attachmentsapar', attachmentsapar);

          if (attachments.length) {
            await this.database.delete('recordAttachment', {
              query: 'scheduleTrxId=?',
              params: [this.datasc.asset.scheduleTrxId],
            });
            await this.database.insert('recordAttachment', attachments);
          }

          if (attachmentsapar.length) {
            await this.database.delete('recordAttachmentPemadam', {
              query: 'scheduleTrxId=?',
              params: [this.datasc.asset.scheduleTrxId],
            });
            await this.database.insert('recordAttachmentPemadam', attachmentsapar);
          }

          await this.shared.addLogActivity({
            activity: 'User save recording data',
            data: {
              scheduleTrxId: this.datasc.asset.scheduleTrxId,
              asset: this.datasc.schedule[0].assetId,
              scannedWith: this.record.scannedWith,
              message: 'Success save recording data',
              status: 'success',
            },
          });

          await this.updateNotification();

          await this.afterSaveOptions({
            scheduleTrxId: this.datasc.asset.scheduleTrxId,
            assetId: this.datasc.schedule[0].assetId,
            assetName: this.datasc.schedule[0].assetNumber,
            asset: this.datasc.asset,
            attachments: this.datasc.attachments,
            data: this.datasc.data,
            record: this.datasc.record,
            schedule: this.datasc.schedule


          });

          this.utils.back(3 + this.offset);
        } else {
          const alert = await this.utils.createCustomAlert({
            type: 'warning',
            header: 'Warning',
            message: 'You must fill in at least 1 parameter to save data',
            buttons: [{
              text: 'Close',
              handler: () => alert.dismiss()
            }],
          });

          alert.present();
        }

        //   } else {
        //     const alert = await this.utils.createCustomAlert({
        //       type: 'warning',
        //       header: 'Warning',
        //       message: 'There is no schedule at this time',
        //       buttons: [{
        //         text: 'Close',
        //         handler: () => alert.dismiss()
        //       }],
        //     });

        //     alert.present();
        //   }
      } catch (error) {
        console.log('error', error);
        const alert = await this.utils.createCustomAlert({
          type: 'error',
          header: 'Failed',
          message: 'An error occurred while saving data',
          buttons: [{
            text: 'Close',
            handler: () => alert.dismiss()
          }],
        });

        alert.present();
      } finally {
        loader.dismiss();
      }
    }
  }

  private async editMediaNotes(media: any) {
    const alert = await this.alertCtrl.create({
      header: 'Notes',
      inputs: [{
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Enter notes here',
        value: media.notes
      }],
      mode: 'ios',
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: alertData => media.notes = alertData.notes
        }
      ]
    });

    alert.present();
  }

  private async confirmDeleteAttachment(media: any, parameter?: any) {
    const confirm = await this.utils.createCustomAlert({
      color: 'danger',
      header: 'Confirm',
      message: 'Are you sure want to delete this attachment?',
      buttons: [
        {
          text: 'Delete',
          handler: () => {
            console.log('media val:', media);
            console.log('parameter val:', parameter);

            const mediaIndex = parameter
              ? parameter?.attachments
                ?.findIndex?.((attachment: any) => attachment.name === media.name)
              : this.attachments
                .findIndex(attachment => attachment.name === media.name);

            if (mediaIndex >= 0 && parameter) {
              parameter.attachments = [
                ...parameter.attachments.slice(0, mediaIndex),
                ...parameter.attachments.slice(mediaIndex + 1)
              ];
            } else if (mediaIndex >= 0) {
              this.attachments = [
                ...this.attachments.slice(0, mediaIndex),
                ...this.attachments.slice(mediaIndex + 1)
              ];
            }

            confirm.dismiss();
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

  private async getSchedule(timestamp: number) {
    let schedule: any;

    try {
      const result = await this.database.select('schedule', {
        where: {
          query: `assetId=?`,
          params: [this.schedule.assetId],
        }
      });

      schedule = this.database.parseResult(result);
      // .find(item => {
      //   const start = moment(item.scheduleFrom).valueOf();
      //   const end = moment(item.scheduleTo).valueOf();

      //   return moment(timestamp).isBetween(start, end);
      // });
      console.log('scd :', schedule);
    } catch (error) {
      console.error(error);
    }

    return schedule;
  }

  private async updateNotification() {
    try {
      await this.notification.cancel('Hold Record Notification', this.datasc.schedule[0].assetId);

      const schedules = await this.database.select('schedule', {
        column: [
          'scheduleTrxId',
          'scheduleTo',
          'assetNumber'
        ],
        where: {
          query: 'syncAt IS NULL',
          params: []
        },
        groupBy: ['scheduleTrxId'],
      }
      );

      const records = await this.database.select('record', {
        column: ['scheduleTrxId'],
        groupBy: ['scheduleTrxId']
      });

      const savedRecords = this.database.parseResult(records)
        .map((record) => record.scheduleTrxId);

      const unscannedSchedules = this.database.parseResult(schedules)
        .filter((schedule) => !savedRecords.includes(schedule.scheduleTrxId));

      await this.notification.cancel('Scan Asset Notification');
      const groupedNotificatons = groupBy(unscannedSchedules, 'scheduleTo');

      // for (const [key, data] of Object.entries<any>(groupedNotificatons)) {
      //   const assetNames = data.map((item: any) => item.assetName).join(',');
      const tgl = new Date();
      const notificationSchema: LocalNotificationSchema = {
        id: 0, // ID akan otomatis ditimpa oleh service
        title: 'Scan Asset Notification',
        body: `Time to scan ${this.datasc.schedule[0].assetNumber}`,
        schedule: {
          at: new Date(),
          allowWhileIdle: true
        },
        smallIcon: 'ic_notification_schedule',
        largeIcon: 'ic_notification_schedule'
      };

      notificationSchema.schedule.at.setHours(
        notificationSchema.schedule.at.getHours() - 1
      );

      await this.notification.schedule(tgl.toDateString(), notificationSchema);
      // }
    } catch (error) {
      console.error(error);
    }
  }

  private async getRecords(scheduleTrxId: string) {
    try {
      this.readonly = true;

      const resultSchedule = await this.database.select('schedule', {
        where: {
          query: `scheduleTrxId=?`,
          params: [scheduleTrxId],
        }
      });

      const [schedule] = this.database.parseResult(resultSchedule);
      console.log('schedule--', schedule);


      if (schedule) {
        this.setDataSchedule(schedule);

        const resultAsset = await this.database.select('asset', {
          where: {
            query: `assetId=?`,
            params: [schedule.assetId],
          }
        });

        const [asset] = this.database.parseResult(resultAsset);
        console.log('asset--', asset);

        if (asset) {
          this.setDataAsset(asset);

          const resultRecords = await this.database.select(
            'record JOIN parameter ON record.parameterId = parameter.parameterId',
            {
              column: [
                'record.parameterId as parameterId',
                'parameterName',
                'description',
                'sortId',
                'photo',
                'uom',
                'min',
                'max',
                'normal',
                'abnormal',
                'option',
                'inputType',
                'showOn',
                'trxId',
                'value',
                'scannedAt',
                'scannedEnd',
                'scannedBy',
                'scannedWith',
                'scannedNotes',
                'condition',
              ],
              groupBy: ['record.parameterId'],
              where: {
                query: 'scheduleTrxId=?',
                params: [scheduleTrxId],
              },
            }
          );

          // this.schedule.parameters = this.database.parseResult(resultRecords)
          //   .map((parameter, i) => {
          //     if (i === 0) {
          //       this.setDataRecord(parameter);
          //     }

          //     return this.getDataParameter(parameter);
          //   })
          //   // .filter(parameter =>
          //   //   parameter.showOn?.includes(this.asset.assetStatusId)
          //   // )
          //   .sort((a, b) => {
          //     if (a.sortId === b.sortId) {
          //       return 0;
          //     }

          //     return a.sortId < b.sortId ? -1 : 1;
          //   });
        }
      }

      console.log(this.schedule.scheduleTrxId);

      // await this.getAttachments();
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  private async getAttachments() {
    try {
      const result = await this.database.select('recordAttachment', {
        column: [
          'parameterId',
          'name',
          'filePath',
          'notes',
          'type'
        ],
        where: {
          query: `key=?`,
          params: [this.schedule.scheduleTrxId],
        },
      });

      this.database.parseResult(result)
        .forEach(({ parameterId, ...attachment }) => {
          if (parameterId) {
            // this.schedule.parameters
            //   .find(parameter => parameter.parameterId === parameterId)
            //   ?.attachments?.push?.({ ...attachment, parameterId });
          } else {
            this.attachments.push(attachment);
          }
        });
    } catch (error) {
      console.error(error);
    }
  }

  private async afterSaveOptions(data: any) {
    const state = this.shared.actionAfterSave || 'unset';
    console.log('aftersave', state)
    console.log('aftersave data', data)
    if (state === 'unset') {
      const id = uuid();

      const saveOptions = await this.popoverCtrl.create({
        id,
        component: SaveOptionsComponent,
        cssClass: 'alert-popover center-popover',
        componentProps: {
          id,
          state
        },
        mode: 'ios'
      });

      saveOptions.present();

      saveOptions.onDidDismiss().then(detail => {
        if (detail?.data?.remember) {
          this.shared.setActionAfterSave(detail?.data?.type);
        }

        if (detail?.data?.type === 'upload') {
          this.uploadRecords(data);
        }
      });
    }

    if (state === 'local') {
      const alert = await this.utils.createCustomAlert({
        type: 'success',
        header: 'Success',
        message: `Success save asset ${data.assetName}`,
        buttons: [{
          text: 'Close',
          handler: () => alert.dismiss()
        }]
      });

      alert.present();
    }

    if (state === 'upload') {
      this.uploadRecords(data);
    }
    this.navCtrl.navigateRoot('tabs');
  }

  private async uploadRecords(data: any) {
    const id = uuid();
    console.log(data);
    const popover = await this.popoverCtrl.create({
      id,
      component: UploadRecordsComponent,
      cssClass: 'alert-popover center-popover',
      backdropDismiss: false,
      componentProps: {
        id,
        data
      },
      mode: 'ios',
    });

    popover.present();
  }

  private setDataAsset(asset: any) {
    const tagIds: string[] = asset?.tagId?.length
      ? asset?.tagId?.split?.(',')
      : [];

    const tagNumbers = asset?.tagNumber?.length
      ? asset?.tagNumber?.split?.(',')
      : [];

    const tagLocationIds = asset?.tagLocationId?.length
      ? asset?.tagLocationId?.split?.(',')
      : [];

    const tagLocationNames = asset?.tagLocationName?.length
      ? asset?.tagLocationName?.split?.(',')
      : [];

    this.schedule.scheduleTrxId = asset?.scheduleTrxId;
    this.schedule.abbreviation = asset?.abbreviation;
    this.schedule.adviceDate = asset?.adviceDate;
    this.schedule.approvedAt = asset?.approvedAt;
    this.schedule.approvedBy = asset?.approvedBy;
    this.schedule.approvedNotes = asset?.approvedNotes;
    this.schedule.assetId = asset?.assetId;
    this.schedule.photo = asset?.photo;
    this.schedule.offlinePhoto = asset?.offlinePhoto;
    this.schedule.assetNumber = asset?.assetNumber;
    this.schedule.assetStatusId = asset?.assetStatusId;
    this.schedule.assetStatusName = asset?.assetStatusName;
    this.schedule.condition = asset?.condition;
    this.schedule.merk = asset?.merk;
    this.schedule.capacityValue = asset?.capacityValue;
    this.schedule.detailLocation = asset?.detailLocation;
    this.schedule.unitCapacity = asset?.unitCapacity;
    this.schedule.supplyDate = asset?.supplyDate;
    this.schedule.reportPhoto = asset?.reportPhoto;
    this.schedule.scannedAccuration = asset?.scannedAccuration;
    this.schedule.scannedAt = asset?.scannedAt;
    this.schedule.scannedBy = asset?.scannedBy;
    this.schedule.scannedEnd = asset?.scannedEnd;
    this.schedule.scannedNotes = asset?.scannedNotes;
    this.schedule.scannedWith = asset?.scannedWith;
    this.schedule.schDays = asset?.schDays;
    this.schedule.schFrequency = asset?.schFrequency;
    this.schedule.schManual = asset?.schManual;
    this.schedule.schType = asset?.schType;
    this.schedule.schWeekDays = asset?.schWeekDays;
    this.schedule.schWeeks = asset?.schWeeks;
    this.schedule.scheduleFrom = asset?.scheduleFrom;
    this.schedule.scheduleTo = asset?.scheduleTo;
    this.schedule.syncAt = asset?.syncAt;
    this.schedule.tagId = asset?.tagId;
    this.schedule.tagNumber = asset?.tagNumber;
    this.schedule.unit = asset?.unit;
    this.schedule.unitId = asset?.unitId;
    this.schedule.area = asset?.area;
    this.schedule.areaId = asset?.areaId;
    this.schedule.latitude = asset?.latitude;
    this.schedule.longitude = asset?.longitude;
    this.schedule.created_at = asset?.created_at;
    this.schedule.deleted_at = asset?.deleted_at;
    this.schedule.date = asset?.date;

    if (asset.offlinePhoto) {
      this.schedule.offlinePhoto = Capacitor.convertFileSrc(asset.offlinePhoto);
    }

    // this.asset.tags = zip(tagIds, tagNames)
    //   .map(([id, name]) => ({ id, name }));

    // this.asset.tagLocations = zip(tagLocationIds, tagLocationNames)
    //   .map(([id, name]) => ({ id, name }));

    // console.log('asset', this.asset);
  }

  private setDataRecord(record: any) {
    this.record.scannedAt = record?.scannedAt;
    this.record.scannedEnd = record?.scannedEnd;
    this.record.scannedBy = record?.scannedBy;
    this.record.scannedWith = record?.scannedWith;
    this.record.scannedNotes = record?.scannedNotes;

    console.log('record', this.record);

  }

  private setDataSchedule(schedule: any) {
    this.schedule.scheduleTrxId = schedule?.scheduleTrxId;
    this.schedule.scheduleTo = schedule?.scheduleTo;
    this.schedule.schType = schedule?.schType;
    this.schedule.schFrequency = schedule?.schFrequency;
    this.schedule.schWeeks = schedule?.schWeeks;
    this.schedule.schWeekDays = schedule?.schWeekDays;
    this.schedule.schDays = schedule?.schDays;
  }

  private getDataParameter(parameter: any) {
    return {
      parameterId: parameter?.parameterId,
      parameterName: parameter?.parameterName,
      description: parameter?.description,
      sortId: parameter?.sortId,
      photo: parameter?.photo,
      offlinePhoto: parameter?.offlinePhoto
        ? Capacitor.convertFileSrc(parameter.offlinePhoto)
        : parameter?.offlinePhoto,
      uom: parameter?.uom,
      min: parameter?.min,
      max: parameter?.max,
      normal: parameter?.normal?.length > 0 ? parameter.normal?.split(',') : [],
      abnormal: parameter?.abnormal?.length > 0 ? parameter.abnormal?.split(',') : [],
      option: parameter?.option?.length > 0 ? parameter.option?.split(',') : [],
      inputType: parameter?.inputType,
      showOn: parameter?.showOn?.length > 0 ? parameter.showOn?.split(',') : [],
      attachments: [],
      value: parameter.value,
      isDeviation: parameter.condition === 'Finding',
    };
  }

  private async showMediaNotes(media: any) {
    const alert = await this.alertCtrl.create({
      header: 'Notes',
      inputs: [{
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        value: media.notes,
        disabled: true,
      }],
      mode: 'ios',
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [{
        text: 'Close',
        role: 'cancel'
      }]
    });

    alert.present();
  }
}
// /* eslint-disable @typescript-eslint/naming-convention */
// import { Component } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { ActionSheetOptions } from '@ionic/core';

// import {
//   Platform,
//   ActionSheetController,
//   AlertController,
//   LoadingController,
//   MenuController,
//   PopoverController,
//   NavController
// } from '@ionic/angular';

// import { Capacitor } from '@capacitor/core';
// import { LocalNotificationSchema } from '@capacitor/local-notifications';
// import { DatabaseService } from 'src/app/services/database/database.service';
// import { MediaService } from 'src/app/services/media/media.service';
// import { NotificationService } from 'src/app/services/notification/notification.service';
// import { SharedService } from 'src/app/services/shared/shared.service';
// import { UtilsService } from 'src/app/services/utils/utils.service';
// import { groupBy, zip } from 'lodash';
// import { v4 as uuid } from 'uuid';
// import Viewer from 'viewerjs';
// import * as moment from 'moment';

// import { SaveOptionsComponent } from 'src/app/components/save-options/save-options.component';
// import { UploadRecordsComponent } from 'src/app/components/upload-records/upload-records.component';

// @Component({
//   selector: 'app-form-preview',
//   templateUrl: './form-preview.page.html',
//   styleUrls: ['./form-preview.page.scss'],
// })
// export class FormPreviewPage {
//   record: {
//     scannedAt: string;
//     scannedEnd: string;
//     scannedBy: string;
//     scannedWith: string;
//     scannedNotes: string;
//   };

//   schedule: {
//     scheduleTrxId: string;
//     abbreviation: string;
//     adviceDate: string;
//     approvedAt: string;
//     approvedBy: string;
//     approvedNotes: string;
//     assetId: string;
//     photo: string;
//     offlinePhoto: string;
//     assetNumber: string;
//     assetStatusId: string;
//     assetStatusName: string;
//     condition: string;
//     merk: string;
//     capacityValue: string;
//     unitCapacity: string;
//     supplyDate: string;
//     reportPhoto: string;
//     scannedAccuration: string;
//     scannedAt: string;
//     scannedBy: string;
//     scannedEnd: string;
//     scannedNotes: string;
//     scannedWith: string;
//     schDays: string;
//     schFrequency: string;
//     schManual: string;
//     schType: string;
//     schWeekDays: string;
//     schWeeks: string;
//     scheduleFrom: string;
//     scheduleTo: string;
//     syncAt: string;
//     tagId: string;
//     tagNumber: string;
//     unit: string;
//     unitId: string;
//     area: string;
//     areaId: string;
//     latitude: string;
//     longitude: string;
//     created_at: string;
//     deleted_at: string;
//     date: string;
//     assetForm: string;

//   };

//   attachments: any[];
//   datasc: any;
//   loading: boolean;
//   offset: number;
//   readonly: boolean;

//   constructor(
//     private activatedRoute: ActivatedRoute,
//     private actionSheetCtrl: ActionSheetController,
//     private platform: Platform,
//     private alertCtrl: AlertController,
//     private loadingCtrl: LoadingController,
//     private menuCtrl: MenuController,
//     private popoverCtrl: PopoverController,
//     private database: DatabaseService,
//     private media: MediaService,
//     private notification: NotificationService,
//     private shared: SharedService,
//     private utils: UtilsService,
//     private navCtrl: NavController,

//   ) {
//     this.record = {
//       scannedAt: '',
//       scannedEnd: '',
//       scannedBy: '',
//       scannedWith: '',
//       scannedNotes: '',
//     };

//     this.schedule = {
//       scheduleTrxId: '',
//       abbreviation: '',
//       adviceDate: '',
//       approvedAt: '',
//       approvedBy: '',
//       approvedNotes: '',
//       assetId: '',
//       photo: '',
//       offlinePhoto: '',
//       assetNumber: '',
//       assetStatusId: '',
//       assetStatusName: '',
//       condition: '',
//       merk: '',
//       capacityValue: '',
//       unitCapacity: '',
//       supplyDate: '',
//       reportPhoto: '',
//       scannedAccuration: '',
//       scannedAt: '',
//       scannedBy: '',
//       scannedEnd: '',
//       scannedNotes: '',
//       scannedWith: '',
//       schDays: '',
//       schFrequency: '',
//       schManual: '',
//       schType: '',
//       schWeekDays: '',
//       schWeeks: '',
//       scheduleFrom: '',
//       scheduleTo: '',
//       syncAt: '',
//       tagId: '',
//       tagNumber: '',
//       unit: '',
//       unitId: '',
//       area: '',
//       areaId: '',
//       latitude: '',
//       longitude: '',
//       created_at: '',
//       deleted_at: '',
//       date: '',
//     assetForm: ''

//     };

//     this.attachments = [];
//     this.loading = true;
//     this.offset = 0;
//     this.readonly = false;
//     this.datasc = {};
//   }

//   ionViewWillEnter() {
//     const transitionData = this.utils.parseJson(
//       this.activatedRoute.snapshot.paramMap.get('data')
//     );
//     this.datasc = transitionData;
//     if (!transitionData) {
//       return this.utils.back();
//     }
//     console.log('datasc :', this.datasc)
//     this.platform.ready().then(() => {
//       this.offset = transitionData.offset || 0;

//       if (transitionData.scheduleTrxId) {
//         this.getRecords(transitionData.scheduleTrxId)
//           .finally(() => {
//             if (this.schedule.assetId) {
//               this.shared.asset = this.schedule;

//               this.menuCtrl.enable(true, 'asset-information')
//                 .then(() => this.menuCtrl.swipeGesture(true, 'asset-information'));
//             }
//           });
//       } else {
//         this.schedule = transitionData.asset;
//         this.record = transitionData.record;
//         this.record.scannedBy = this.shared.user.name;
//         this.schedule = transitionData.schedule;
//         this.attachments = transitionData.attachments;
//         this.shared.asset = this.schedule;
//         this.loading = false;

//         this.menuCtrl.enable(true, 'asset-information')
//           .then(() => this.menuCtrl.swipeGesture(true, 'asset-information'));
//       }
//     });
//   }

//   async ionViewWillLeave() {
//     await this.menuCtrl.enable(false, 'asset-information');
//     await this.menuCtrl.swipeGesture(false, 'asset-information');
//   }

//   showAssetInfo() {
//     return this.menuCtrl.open('asset-information');
//   }

//   back() {
//     return this.utils.back();
//   }

//   async onMediaSelected(media: any, parameter?: any) {
//     const options: ActionSheetOptions = {
//       animated: true,
//       backdropDismiss: true,
//       header: media?.name,
//       cssClass: 'dark:ion-bg-gray-800',
//       buttons: [
//         {
//           icon: 'trash-outline',
//           text: 'Delete',
//           role: 'destructive',
//           handler: () => this.confirmDeleteAttachment(media, parameter)
//         }
//       ]
//     };


//     if (media.type.startsWith('image')) {
//       options.buttons.unshift({
//         icon: 'image-outline',
//         text: 'View Photo',
//         handler: () => this.media.showPicture(media?.filePath)
//       });
//     } else if (media.type.startsWith('audio')) {
//       options.buttons.unshift({
//         icon: 'volume-high-outline',
//         text: 'Play Audio',
//         handler: () => this.media.playAudio(media?.filePath)
//       });
//     } else if (media.type.startsWith('video')) {
//       options.buttons.unshift({
//         icon: 'play-circle-outline',
//         text: 'Play Video',
//         handler: () => this.media.playVideo(media?.filePath)
//       });
//     }

//     const actionSheet = await this.actionSheetCtrl.create(options);
//     actionSheet.present();



//     // const options: ActionSheetOptions = {
//     //   mode: 'md',
//     //   animated: true,
//     //   backdropDismiss: true,
//     //   header: media?.name,
//     //   cssClass: 'dark:ion-bg-gray-800',
//     //   buttons: [{
//     //     icon: 'close-outline',
//     //     text: 'Cancel',
//     //     role: 'cancel'
//     //   }]
//     // };

//     // if (media?.notes) {
//     //   options.buttons.unshift({
//     //     icon: 'pencil-outline',
//     //     text: 'View Notes',
//     //     handler: () => this.showMediaNotes(media),
//     //   });
//     // }

//     // if (media.type.startsWith('image')) {
//     //   options.buttons.unshift({
//     //     icon: 'image-outline',
//     //     text: 'View Photo',
//     //     handler: () => this.media.showPicture(media?.filePath),
//     //   });
//     // } else if (media.type.startsWith('audio')) {
//     //   options.buttons.unshift({
//     //     icon: 'volume-high-outline',
//     //     text: 'Play Audio',
//     //     handler: () => this.media.playAudio(media?.filePath),
//     //   });
//     // } else if (media.type.startsWith('video')) {
//     //   options.buttons.unshift({
//     //     icon: 'play-circle-outline',
//     //     text: 'Play Video',
//     //     handler: () => this.media.playVideo(media?.filePath),
//     //   });
//     // }

//     // const actionSheet = await this.actionSheetCtrl.create(options);
//     // actionSheet.present();
//   }
//   private async editMediaNotes(media: any) {
//     const alert = await this.alertCtrl.create({
//       header: 'Notes',
//       inputs: [{
//         name: 'notes',
//         label: 'Notes',
//         type: 'textarea',
//         placeholder: 'Enter notes here',
//         value: media.notes
//       }],
//       mode: 'ios',
//       cssClass: 'dark:ion-bg-gray-800',
//       buttons: [
//         {
//           text: 'Cancel',
//           role: 'cancel'
//         },
//         {
//           text: 'Save',
//           handler: alertData => media.notes = alertData.notes
//         }
//       ]
//     });

//     alert.present();
//   }

//   private async confirmDeleteAttachment(media: any, parameter?: any) {
//     const confirm = await this.utils.createCustomAlert({
//       color: 'danger',
//       header: 'Confirm',
//       message: 'Are you sure want to delete this attachment?',
//       buttons: [
//         {
//           text: 'Delete',
//           handler: () => {
//             console.log('media val:', media);
//             console.log('parameter val:', parameter);

//             const mediaIndex = parameter
//               ? parameter?.attachments
//                 ?.findIndex?.((attachment: any) => attachment.name === media.name)
//               : this.attachments
//                 .findIndex(attachment => attachment.name === media.name);

//             if (mediaIndex >= 0 && parameter) {
//               parameter.attachments = [
//                 ...parameter.attachments.slice(0, mediaIndex),
//                 ...parameter.attachments.slice(mediaIndex + 1)
//               ];
//             } else if (mediaIndex >= 0) {
//               this.attachments = [
//                 ...this.attachments.slice(0, mediaIndex),
//                 ...this.attachments.slice(mediaIndex + 1)
//               ];
//             }

//             confirm.dismiss();
//           }
//         },
//         {
//           text: 'Cancel',
//           handler: () => confirm.dismiss()
//         }
//       ],
//     });

//     confirm.present();
//   }
//   showImageViewer({ target }: Event) {
//     const viewer = new Viewer(target as HTMLElement, {
//       navbar: false,
//       toolbar: false,
//       button: false
//     });

//     viewer.show();
//   }

//   async saveRecords() {
//     if (!this.readonly) {
//       const loader = await this.loadingCtrl.create({
//         spinner: 'dots',
//         message: 'Saving data...',
//         cssClass: 'dark:ion-bg-gray-800',
//         mode: 'ios',
//       });
//       const trxid = uuid();
//       loader.present();
//       console.log('data', this.datasc)
//       try {

//         const now = this.utils.getTimeNow();
//         const scan = moment(now).format('YYYY-MM-DD HH:mm:ss');
//         const current = new Date();

//         // // if (schedule) {

//         const scannedEnd = moment(current).format('YYYY-MM-DD HH:mm:ss');

//         const attachments = [];
//         const reco = [];

//         this.datasc.data?.map((parameter, k) => {
//           reco.push({
//             condition: parameter.isDeviation ? 'Finding' : 'Normal',
//             parameterId: parameter.parameterId,
//             scannedAt: scan,
//             scannedBy: this.datasc.record.scannedBy,
//             scannedEnd: scannedEnd,
//             scannedNotes: parameter.notes,
//             scannedWith: this.datasc.record.scannedWith,
//             scheduleTrxId: this.datasc.asset.scheduleTrxId,
//             syncAt: scan,
//             trxId: uuid(),
//             value: parameter.value ? parameter.value : false,
//             isUploaded: 0,
//           });
//           parameter.attachments?.map((attachment: any) => {
//             attachments.push({
//               scheduleTrxId: this.datasc.asset.scheduleTrxId,
//               trxId: parameter.parameterId,
//               notes: parameter.notes,
//               type: attachment.type,
//               filePath: attachment.filePath,
//               timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
//               isUploaded: 0
//             });
//           });
//           // console.log('datasc :', record);
//         });

//         if (this.datasc.attachments.length) {
//           this.datasc.attachments?.map(att => {
//             attachments.push({
//               scheduleTrxId: this.datasc.asset.scheduleTrxId,
//               trxId: uuid(),
//               notes: att.notes,
//               type: att.type,
//               filePath: att.filePath,
//               parameterId: att.parameterId,
//               timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
//               isUploaded: 0
//             });
//           });
//         }

//         // let dataRes = [{
//         //   records: data,
//         //   attachments: attachments
//         // }]
//         console.log('datasc', this.datasc);
//         console.log('data reco', reco);
//         console.log('data att', attachments);

//         console.log('nite', this.datasc.record.scannedNotes)

//         console.log('assetid', this.datasc.schedule[0].assetId);


//         if (reco.length) {
//           const parameterIds = reco.map(item => item.parameterId);
//           const marks = this.database.marks(parameterIds.length).join(',');
// console.log('parameterIds', parameterIds);
//           await this.database.delete('record', {
//             query: `scheduleTrxId=? AND parameterId IN (${marks})`,
//             params: [this.datasc.asset.scheduleTrxId, ...parameterIds],
//           });
//           await this.database.insert('record', reco);

//           await this.database.update(
//             'schedule',
//             {
//               scannedEnd,
//               scannedNotes: this.datasc.record.scannedNotes,
//             },
//             {
//               query: 'scheduleTrxId=?',
//               params: [this.datasc.asset.scheduleTrxId],
//             }
//           );

//           await this.database.delete('recordHold', {
//             query: 'assetId=?',
//             params: [this.datasc.schedule[0].assetId],
//           });

//           // attachments.push(
//           //   ...this.attachments.map(attachment => ({
//           //     ...attachment,
//           //     key: this.datasc.asset.scheduleTrxId,
//           //     timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
//           //     isUploaded: 0
//           //   }))
//           // );
//           console.log('attachments', attachments);

//           if (attachments.length) {
//             await this.database.delete('recordAttachment', {
//               query: 'scheduleTrxId=?',
//               params: [this.datasc.asset.scheduleTrxId],
//             });
//             await this.database.insert('recordAttachment', attachments);
//           }

//           await this.shared.addLogActivity({
//             activity: 'User save recording data',
//             data: {
//               scheduleTrxId: this.datasc.asset.scheduleTrxId,
//               asset: this.datasc.schedule[0].assetId,
//               scannedWith: this.record.scannedWith,
//               message: 'Success save recording data',
//               status: 'success',
//             },
//           });

//           await this.updateNotification();

//           await this.afterSaveOptions({
//             scheduleTrxId: this.datasc.asset.scheduleTrxId,
//             assetId: this.datasc.schedule[0].assetId,
//             assetName: this.datasc.schedule[0].assetNumber,
//             asset: this.datasc.asset,
//             attachments: this.datasc.attachments,
//             data: this.datasc.data,
//             record: this.datasc.record,
//             schedule: this.datasc.schedule


//           });

//           this.utils.back(3 + this.offset);
//         } else {
//           const alert = await this.utils.createCustomAlert({
//             type: 'warning',
//             header: 'Warning',
//             message: 'You must fill in at least 1 parameter to save data',
//             buttons: [{
//               text: 'Close',
//               handler: () => alert.dismiss()
//             }],
//           });

//           alert.present();
//         }

//         //   } else {
//         //     const alert = await this.utils.createCustomAlert({
//         //       type: 'warning',
//         //       header: 'Warning',
//         //       message: 'There is no schedule at this time',
//         //       buttons: [{
//         //         text: 'Close',
//         //         handler: () => alert.dismiss()
//         //       }],
//         //     });

//         //     alert.present();
//         //   }
//       } catch (error) {
//         console.log('error', error);
//         const alert = await this.utils.createCustomAlert({
//           type: 'error',
//           header: 'Failed',
//           message: 'An error occurred while saving data',
//           buttons: [{
//             text: 'Close',
//             handler: () => alert.dismiss()
//           }],
//         });

//         alert.present();
//       } finally {
//         loader.dismiss();
//       }
//     }
//   }

//   private async getSchedule(timestamp: number) {
//     let schedule: any;

//     try {
//       const result = await this.database.select('schedule', {
//         where: {
//           query: `assetId=?`,
//           params: [this.schedule.assetId],
//         }
//       });

//       schedule = this.database.parseResult(result);
//       // .find(item => {
//       //   const start = moment(item.scheduleFrom).valueOf();
//       //   const end = moment(item.scheduleTo).valueOf();

//       //   return moment(timestamp).isBetween(start, end);
//       // });
//       console.log('scd :', schedule);
//     } catch (error) {
//       console.error(error);
//     }

//     return schedule;
//   }

//   private async updateNotification() {
//     try {
//       await this.notification.cancel('Hold Record Notification', this.datasc.schedule[0].assetId);

//       const schedules = await this.database.select('schedule', {
//         column: [
//           'scheduleTrxId',
//           'scheduleTo',
//           'assetNumber'
//         ],
//         where: {
//           query: 'syncAt IS NULL',
//           params: []
//         },
//         groupBy: ['scheduleTrxId'],
//       }
//       );

//       const records = await this.database.select('record', {
//         column: ['scheduleTrxId'],
//         groupBy: ['scheduleTrxId']
//       });

//       const savedRecords = this.database.parseResult(records)
//         .map((record) => record.scheduleTrxId);

//       const unscannedSchedules = this.database.parseResult(schedules)
//         .filter((schedule) => !savedRecords.includes(schedule.scheduleTrxId));

//       await this.notification.cancel('Scan Asset Notification');
//       const groupedNotificatons = groupBy(unscannedSchedules, 'scheduleTo');

//       // for (const [key, data] of Object.entries<any>(groupedNotificatons)) {
//       //   const assetNames = data.map((item: any) => item.assetName).join(',');
//       const tgl = new Date();
//       const notificationSchema: LocalNotificationSchema = {
//         id: 0, // ID akan otomatis ditimpa oleh service
//         title: 'Scan Asset Notification',
//         body: `Time to scan ${this.datasc.schedule[0].assetNumber}`,
//         schedule: {
//           at: new Date(),
//           allowWhileIdle: true
//         },
//         smallIcon: 'ic_notification_schedule',
//         largeIcon: 'ic_notification_schedule'
//       };

//       notificationSchema.schedule.at.setHours(
//         notificationSchema.schedule.at.getHours() - 1
//       );

//       await this.notification.schedule(tgl.toDateString(), notificationSchema);
//       // }
//     } catch (error) {
//       console.error(error);
//     }
//   }

//   private async getRecords(scheduleTrxId: string) {
//     try {
//       this.readonly = true;

//       const resultSchedule = await this.database.select('schedule', {
//         where: {
//           query: `scheduleTrxId=?`,
//           params: [scheduleTrxId],
//         }
//       });

//       const [schedule] = this.database.parseResult(resultSchedule);

//       if (schedule) {
//         this.setDataSchedule(schedule);

//         const resultAsset = await this.database.select('asset', {
//           where: {
//             query: `assetId=?`,
//             params: [schedule.assetId],
//           }
//         });

//         const [asset] = this.database.parseResult(resultAsset);

//         if (asset) {
//           this.setDataAsset(asset);

//           const resultRecords = await this.database.select(
//             'record JOIN parameter ON record.parameterId = parameter.parameterId',
//             {
//               column: [
//                 'record.parameterId as parameterId',
//                 'parameterName',
//                 'description',
//                 'sortId',
//                 'photo',
//                 'uom',
//                 'min',
//                 'max',
//                 'normal',
//                 'abnormal',
//                 'option',
//                 'inputType',
//                 'showOn',
//                 'trxId',
//                 'value',
//                 'scannedAt',
//                 'scannedEnd',
//                 'scannedBy',
//                 'scannedWith',
//                 'scannedNotes',
//                 'condition',
//               ],
//               groupBy: ['record.parameterId'],
//               where: {
//                 query: 'scheduleTrxId=?',
//                 params: [scheduleTrxId],
//               },
//             }
//           );

//           // this.schedule.parameters = this.database.parseResult(resultRecords)
//           //   .map((parameter, i) => {
//           //     if (i === 0) {
//           //       this.setDataRecord(parameter);
//           //     }

//           //     return this.getDataParameter(parameter);
//           //   })
//           //   // .filter(parameter =>
//           //   //   parameter.showOn?.includes(this.asset.assetStatusId)
//           //   // )
//           //   .sort((a, b) => {
//           //     if (a.sortId === b.sortId) {
//           //       return 0;
//           //     }

//           //     return a.sortId < b.sortId ? -1 : 1;
//           //   });
//         }
//       }

//       await this.getAttachments();
//     } catch (error) {
//       console.error(error);
//     } finally {
//       this.loading = false;
//     }
//   }

//   private async getAttachments() {
//     try {
//       const result = await this.database.select('recordAttachment', {
//         column: [
//           'parameterId',
//           'name',
//           'filePath',
//           'notes',
//           'type'
//         ],
//         where: {
//           query: `key=?`,
//           params: [this.schedule.scheduleTrxId],
//         },
//       });

//       this.database.parseResult(result)
//         .forEach(({ parameterId, ...attachment }) => {
//           if (parameterId) {
//             // this.schedule.parameters
//             //   .find(parameter => parameter.parameterId === parameterId)
//             //   ?.attachments?.push?.({ ...attachment, parameterId });
//           } else {
//             this.attachments.push(attachment);
//           }
//         });
//     } catch (error) {
//       console.error(error);
//     }
//   }

//   private async afterSaveOptions(data: any) {
//     const state = this.shared.actionAfterSave || 'unset';
//     console.log('aftersave', state)
//     console.log('aftersave data', data)
//     if (state === 'unset') {
//       const id = uuid();

//       const saveOptions = await this.popoverCtrl.create({
//         id,
//         component: SaveOptionsComponent,
//         cssClass: 'alert-popover center-popover',
//         componentProps: {
//           id,
//           state
//         },
//         mode: 'ios'
//       });

//       saveOptions.present();

//       saveOptions.onDidDismiss().then(detail => {
//         if (detail?.data?.remember) {
//           this.shared.setActionAfterSave(detail?.data?.type);
//         }

//         if (detail?.data?.type === 'upload') {
//           this.uploadRecords(data);
//         }
//       });
//     }

//     if (state === 'local') {
//       const alert = await this.utils.createCustomAlert({
//         type: 'success',
//         header: 'Success',
//         message: `Success save asset ${data.assetName}`,
//         buttons: [{
//           text: 'Close',
//           handler: () => alert.dismiss()
//         }]
//       });

//       alert.present();
//     }

//     if (state === 'upload') {
//       this.uploadRecords(data);
//     }
//     this.navCtrl.navigateRoot('tabs');
//   }

//   private async uploadRecords(data: any) {
//     const id = uuid();
// console.log(data);
//     const popover = await this.popoverCtrl.create({
//       id,
//       component: UploadRecordsComponent,
//       cssClass: 'alert-popover center-popover',
//       backdropDismiss: false,
//       componentProps: {
//         id,
//         data
//       },
//       mode: 'ios',
//     });

//     popover.present();
//   }

//   private setDataAsset(asset: any) {
//     const tagIds: string[] = asset?.tagId?.length
//       ? asset?.tagId?.split?.(',')
//       : [];

//     const tagNumbers = asset?.tagNumber?.length
//       ? asset?.tagNumber?.split?.(',')
//       : [];

//     const tagLocationIds = asset?.tagLocationId?.length
//       ? asset?.tagLocationId?.split?.(',')
//       : [];

//     const tagLocationNames = asset?.tagLocationName?.length
//       ? asset?.tagLocationName?.split?.(',')
//       : [];

//     this.schedule.scheduleTrxId = asset?.scheduleTrxId;
//     this.schedule.abbreviation = asset?.abbreviation;
//     this.schedule.adviceDate = asset?.adviceDate;
//     this.schedule.approvedAt = asset?.approvedAt;
//     this.schedule.approvedBy = asset?.approvedBy;
//     this.schedule.approvedNotes = asset?.approvedNotes;
//     this.schedule.assetId = asset?.assetId;
//     this.schedule.photo = asset?.photo;
//     this.schedule.offlinePhoto = asset?.offlinePhoto;
//     this.schedule.assetNumber = asset?.assetNumber;
//     this.schedule.assetStatusId = asset?.assetStatusId;
//     this.schedule.assetStatusName = asset?.assetStatusName;
//     this.schedule.condition = asset?.condition;
//     this.schedule.merk = asset?.merk;
//     this.schedule.capacityValue = asset?.capacityValue;
//     this.schedule.unitCapacity = asset?.unitCapacity;
//     this.schedule.supplyDate = asset?.supplyDate;
//     this.schedule.reportPhoto = asset?.reportPhoto;
//     this.schedule.scannedAccuration = asset?.scannedAccuration;
//     this.schedule.scannedAt = asset?.scannedAt;
//     this.schedule.scannedBy = asset?.scannedBy;
//     this.schedule.scannedEnd = asset?.scannedEnd;
//     this.schedule.scannedNotes = asset?.scannedNotes;
//     this.schedule.scannedWith = asset?.scannedWith;
//     this.schedule.schDays = asset?.schDays;
//     this.schedule.schFrequency = asset?.schFrequency;
//     this.schedule.schManual = asset?.schManual;
//     this.schedule.schType = asset?.schType;
//     this.schedule.schWeekDays = asset?.schWeekDays;
//     this.schedule.schWeeks = asset?.schWeeks;
//     this.schedule.scheduleFrom = asset?.scheduleFrom;
//     this.schedule.scheduleTo = asset?.scheduleTo;
//     this.schedule.syncAt = asset?.syncAt;
//     this.schedule.tagId = asset?.tagId;
//     this.schedule.tagNumber = asset?.tagNumber;
//     this.schedule.unit = asset?.unit;
//     this.schedule.unitId = asset?.unitId;
//     this.schedule.area = asset?.area;
//     this.schedule.areaId = asset?.areaId;
//     this.schedule.latitude = asset?.latitude;
//     this.schedule.longitude = asset?.longitude;
//     this.schedule.created_at = asset?.created_at;
//     this.schedule.deleted_at = asset?.deleted_at;
//     this.schedule.date = asset?.date;

//     if (asset.offlinePhoto) {
//       this.schedule.offlinePhoto = Capacitor.convertFileSrc(asset.offlinePhoto);
//     }

//     // this.asset.tags = zip(tagIds, tagNames)
//     //   .map(([id, name]) => ({ id, name }));

//     // this.asset.tagLocations = zip(tagLocationIds, tagLocationNames)
//     //   .map(([id, name]) => ({ id, name }));

//     // console.log('asset', this.asset);
//   }

//   private setDataRecord(record: any) {
//     this.record.scannedAt = record?.scannedAt;
//     this.record.scannedEnd = record?.scannedEnd;
//     this.record.scannedBy = record?.scannedBy;
//     this.record.scannedWith = record?.scannedWith;
//     this.record.scannedNotes = record?.scannedNotes;

//     console.log('record', this.record);

//   }

//   private setDataSchedule(schedule: any) {
//     this.schedule.scheduleTrxId = schedule?.scheduleTrxId;
//     this.schedule.scheduleTo = schedule?.scheduleTo;
//     this.schedule.schType = schedule?.schType;
//     this.schedule.schFrequency = schedule?.schFrequency;
//     this.schedule.schWeeks = schedule?.schWeeks;
//     this.schedule.schWeekDays = schedule?.schWeekDays;
//     this.schedule.schDays = schedule?.schDays;

//     console.log('schedule', this.schedule);
//   }

//   private getDataParameter(parameter: any) {
//     return {
//       parameterId: parameter?.parameterId,
//       parameterName: parameter?.parameterName,
//       description: parameter?.description,
//       sortId: parameter?.sortId,
//       photo: parameter?.photo,
//       offlinePhoto: parameter?.offlinePhoto
//         ? Capacitor.convertFileSrc(parameter.offlinePhoto)
//         : parameter?.offlinePhoto,
//       uom: parameter?.uom,
//       min: parameter?.min,
//       max: parameter?.max,
//       normal: parameter?.normal?.length > 0 ? parameter.normal?.split(',') : [],
//       abnormal: parameter?.abnormal?.length > 0 ? parameter.abnormal?.split(',') : [],
//       option: parameter?.option?.length > 0 ? parameter.option?.split(',') : [],
//       inputType: parameter?.inputType,
//       showOn: parameter?.showOn?.length > 0 ? parameter.showOn?.split(',') : [],
//       attachments: [],
//       value: parameter.value,
//       isDeviation: parameter.condition === 'Finding',
//     };
//   }

//   private async showMediaNotes(media: any) {
//     const alert = await this.alertCtrl.create({
//       header: 'Notes',
//       inputs: [{
//         name: 'notes',
//         label: 'Notes',
//         type: 'textarea',
//         value: media.notes,
//         disabled: true,
//       }],
//       mode: 'ios',
//       cssClass: 'dark:ion-bg-gray-800',
//       buttons: [{
//         text: 'Close',
//         role: 'cancel'
//       }]
//     });

//     alert.present();
//   }
// }
