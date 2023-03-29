import { SchType } from './../../services/shared/shared.service';
import { AttachmentSettings } from 'src/app/services/shared/shared.service';
/* eslint-disable @typescript-eslint/naming-convention */
import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetOptions } from '@ionic/core';

import {
  Platform,
  IonContent,
  ActionSheetController,
  AlertController,
  LoadingController,
  MenuController
} from '@ionic/angular';

import { Capacitor } from '@capacitor/core';
import { LocalNotificationSchema } from '@capacitor/local-notifications';
import { DatabaseService } from 'src/app/services/database/database.service';
import { MediaService } from 'src/app/services/media/media.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { toLower, zip } from 'lodash';
import Viewer from 'viewerjs';
import * as moment from 'moment';
import {Directory} from "@capacitor/filesystem";
import write_blob from "capacitor-blob-writer";
@Component({
  selector: 'app-scan-form',
  templateUrl: './scan-form.page.html',
  styleUrls: ['./scan-form.page.scss'],
})
export class ScanFormPage implements OnInit {
  @ViewChild(IonContent) ionContent: IonContent;
  resultParam = [];
  attach = [];
  sch = [];
  asset: {
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
  };
  param: {
    assetId: string,
    assetNumber: string,
    description: string,
    inputType: string,
    max: string,
    min: string,
    normal: string,
    abnormal: string,
    option: string,
    parameterId: string,
    parameterName: string,
    schType: string,
    showOn: string,
    sortId: string,
    uom: string,
    workInstruction: string,
    tagId,
    unit: string,
    unitId: string,
    area: string,
    areaId: string,
    created_at: string,
    updated_at: string,
    col: string;
    isDeviation: string;
    isExpanded: string;
    reportType: string;
    value: string;
    attachment: any[];
  }
  record: {
    scannedAt: string;
    scannedEnd: string;
    scannedBy: string;
    scannedWith: string;
    scannedNotes: string;
  };

  schedule: {
    scheduleTrxId: string;
    scheduleTo: string;
    schType: string;
    schFrequency: string;
    schWeeks: string;
    schWeekDays: string;
    schDays: string;
  };

  attachments: any[];
  loading: boolean;
  validated: boolean;

  private transitionData: {
    type?: string;
    data: string;
    offset?: number;
  };


  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private menuCtrl: MenuController,
    private database: DatabaseService,
    private media: MediaService,
    private notification: NotificationService,
    private shared: SharedService,
    private utils: UtilsService
  ) {
    this.asset = {
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
    };

    this.record = {
      scannedAt: '',
      scannedEnd: '',
      scannedBy: '',
      scannedWith: '',
      scannedNotes: ''
    };

    this.schedule = {
      scheduleTrxId: '',
      scheduleTo: '',
      schType: '',
      schFrequency: '',
      schWeeks: '',
      schWeekDays: '',
      schDays: ''
    };

    this.attachments = [];
    this.loading = true;
    this.validated = false;
  }

  ngOnInit() {
    this.transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );

    if (!this.transitionData) {
      return this.utils.back();
    }

    console.log('transitionData :', this.transitionData);

    this.platform.ready().then(() => {
      this.getAsset().finally(() => {
        if (this.asset.assetId) {
          this.shared.asset = this.asset;
          console.log('cek assetid on init :', this.asset);
        } else {
          this.menuCtrl.swipeGesture(false, 'asset-information')
            .then(() => this.menuCtrl.enable(false, 'asset-information'));
        }
      });
    });
  }

  ionViewWillEnter() {
    this.utils.overrideBackButton(() => this.confirmLeave());

    this.menuCtrl.enable(true, 'asset-information')
      .then(() => this.menuCtrl.swipeGesture(true, 'asset-information'));
  }

  async ionViewWillLeave() {
    this.utils.overrideBackButton();

    await this.menuCtrl.enable(false, 'asset-information');
    await this.menuCtrl.swipeGesture(false, 'asset-information');
  }
//leave page
  async confirmLeave() {
    if (
      !this.loading
    ) {
      const confirm = await this.utils.createCustomAlert({
        color: 'danger',
        type: 'warning',
        header: 'Confirm',
        message: 'Apakah Anda yakin ingin meninggalkan halaman ini?',
        buttons: [
          {
            text: 'Keluar',
            handler: () => {
              confirm.dismiss();
              return this.utils.back();
            }
          },
          {
            text: 'Batal',
            handler: () => confirm.dismiss()
          }
        ]
      });

      confirm.present();
    } else {
      this.utils.back();
    }
  }

  setFocus(parameter: any) {
    const [element]: any[] = Array.from(
      document.getElementsByClassName(parameter.parameterId)
    );

    if (element && element.setFocus) {
      element.setFocus();
    } else if (element && element.open) {
      element.open();
    }
  }

  showAssetInfo() {
    return this.menuCtrl.open('asset-information');
  }

  async checkDeviation(parameter: any) {
    parameter.isDeviation = this.isDeviation(parameter);
  }

  hasValue(value: any) {
    return value != null && value !== '';
  }
  notes(parameter?: any) {
    this.resultParam.filter(res => {
      return res.parameterId === parameter?.parameterId;
    })[0].notes = parameter.notes;
  }
  async selectMedia(parameter?: any) {
    console.log('data all: ', this.resultParam);
    console.log('parameter select: ', parameter);
    const actionSheet = await this.actionSheetCtrl.create({
      animated: true,
      backdropDismiss: true,
      header: 'Select Media Type',
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [
        {
          icon: 'camera-outline',
          text: 'Photo',
          handler: () => this.getPicture(parameter)
        },
        {
          icon: 'mic-outline',
          text: 'Audio',
          handler: () => this.captureAudio(parameter)
        },
        {
          icon: 'videocam-outline',
          text: 'Video',
          handler: () => this.captureVideo(parameter)
        },
        {
          icon: 'close-outline',
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    console.log('pilihan media', actionSheet)
    actionSheet.present();
  }
  async selectMedia2(parameter?: any) {
    console.log('data all: ', this.resultParam);
    console.log('parameter select: ', parameter);
    const actionSheet = await this.actionSheetCtrl.create({
      animated: true,
      backdropDismiss: true,
      header: 'Select Media Type',
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [
        {
          icon: 'camera-outline',
          text: 'Photo',
          handler: () => this.getPicture1(parameter)
        },
        {
          icon: 'close-outline',
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    console.log('pilihan media', actionSheet)
    actionSheet.present();
  }
  async selectUpload(parameter?: any, arrai?: any) {
    console.log('attachment select: ', this.attachments);
    console.log('parameter select: ', parameter);
    console.log('arrai select: ', arrai);
    const actionSheet = await this.actionSheetCtrl.create({
      animated: true,
      backdropDismiss: true,
      header: 'Select Media Type',
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [
        {
          icon: 'camera-outline',
          text: 'Photo',
          handler: () => this.getPicture(parameter, arrai)
        },
        {
          icon: 'mic-outline',
          text: 'Audio',
          handler: () => this.captureAudio(parameter)
        },
        {
          icon: 'videocam-outline',
          text: 'Video',
          handler: () => this.captureVideo(parameter)
        },
        {
          icon: 'close-outline',
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    console.log('pilihan media', actionSheet)
    actionSheet.present();
  }

  async onMediaSelected(media: any, parameter?: any, index?: any) {

    const options: ActionSheetOptions = {
      animated: true,
      backdropDismiss: true,
      header: media?.name,
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [
        // {
        //   icon: 'pencil-outline',
        //   text: media?.notes ? 'Edit notes' : 'Add Notes',
        //   handler: () => this.editMediaNotes(media)
        // },
        {
          icon: 'trash-outline',
          text: 'Delete',
          role: 'destructive',
          handler: () => this.confirmDeleteAttachment(media, parameter, index)
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
  }
  async onMediaSelected1(media: any) {
console.log(media)
    const options: ActionSheetOptions = {
      animated: true,
      backdropDismiss: true,
      header: media?.name,
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [
        // {
        //   icon: 'pencil-outline',
        //   text: media?.notes ? 'Edit notes' : 'Add Notes',
        //   handler: () => this.editMediaNotes(media)
        // },
        {
          icon: 'trash-outline',
          text: 'Delete',
          role: 'destructive',
          handler: () => this.confirmDeleteAttachmentAlat(media)
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
  }
  async onMediaPilih(media: any, parameter?: any) {
    const options: ActionSheetOptions = {
      animated: true,
      backdropDismiss: true,
      header: media?.name,
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [
        // {
        //   icon: 'pencil-outline',
        //   text: media?.notes ? 'Edit notes' : 'Add Notes',
        //   handler: () => this.editMediaNotes(media)
        // },
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
  }
  async onMediaPilih1(media: any, parameter?: any) {
    const options: ActionSheetOptions = {
      animated: true,
      backdropDismiss: true,
      header: media?.name,
      cssClass: 'dark:ion-bg-gray-800',
      buttons: [
        // {
        //   icon: 'pencil-outline',
        //   text: media?.notes ? 'Edit notes' : 'Add Notes',
        //   handler: () => this.editMediaNotes(media)
        // },
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
  }

  async preview() {
    const emptyParameter = this.resultParam
      .find(parameter => parameter.value == null || parameter.value === '');
    this.record.scannedNotes ='catatan';
    this.validated = true;
    console.log('this.resultParam',this.resultParam)
    console.log('emptyParameter',emptyParameter)
    if (emptyParameter) {
      const alert = await this.utils.createCustomAlert({
        type: 'error',
        header: 'Gagal',
        message: 'Silahkan isi semua parameter',
        buttons: [{
          text: 'Okay',
          handler: () => alert.dismiss()
        }]
      });

      alert.present();
      return this.ionContent.scrollToTop(2000);

    }
    console.log('sch', this.sch)
this.sch = this.sch.filter(sch => sch.schType == this.shared.schtype.type)
console.log('sch', this.sch)
console.log('type', this.shared.schtype.type)
    moment.locale('id')
    const now = this.utils.getTime();
    const current = new Date();
    this.record.scannedAt = moment(current).format('YYYY-MM-DD HH:mm:ss');
    this.validated = true;
    const attdata = [];
    this.schedule.scheduleTrxId = this.sch[0]?.scheduleTrxId;
    this.schedule.scheduleTo = this.sch[0]?.scheduleTo;
    this.schedule.schType = this.sch[0]?.schType;
    this.schedule.schFrequency = this.sch[0]?.schFrequency;
    this.schedule.schWeeks = this.sch[0]?.schWeeks;
    this.schedule.schWeekDays = this.sch[0]?.schWeekDays;
    this.schedule.schDays = this.sch[0]?.schDays;
    this.resultParam.map(res => {
      res.attachments.map(att => {
        attdata.push({
          name: att.name,
          type: att.type,
          filePath: att.filePath,
          notes: res.notes,
          parameterId: res.parameterId
        });
      })
    })
    const data = JSON.stringify({
      asset: this.schedule,
      record: this.record,
      schedule: this.resultParam,
      offset: this.transitionData?.offset || 0,

      data: this.resultParam
        .map(v => ({
          value: v.value,
          parameterName: v.parameterName,
          isDeviation: v.isDeviation,
          parameterId: v.parameterId,
          isExpanded: false
        })),
      attachments: attdata,
      attachmentsapar: this.attach

    });
    console.log('data json :', JSON.parse(data));
    return this.router.navigate(['form-preview', { data }]);
  }

  async saveTemporary() {
    const loader = await this.loadingCtrl.create({
      spinner: 'dots',
      message: 'Saving temporary...',
      cssClass: 'dark:ion-bg-gray-800',
      mode: 'ios'
    });

    loader.present();

    try {
      const data = this.resultParam
        .map(parameter => ({
          assetId: parameter.assetId,
          parameterId: parameter.parameterId,
          value: parameter.value,
          scannedAt: parameter.scannedAt,
          scannedWith: parameter.scannedWith,
          scannedNotes: parameter.scannedNotes
        }));

      // if (data.length) {
      await this.database.delete('recordHold', {
        query: 'id=?',
        params: [this.asset.assetId]
      });

      // await this.database.insert('recordHold', data);
      // }

      // const parametersThatHaveAttachments = this.asset.parameter
      //   .filter(parameter => parameter.attachments.length);

      // const hasAttachments = this.attachments.length + parametersThatHaveAttachments.length > 0;

      // if (hasAttachments) {
      //   await this.database.delete('recordAttachment', {
      //     query: 'key=?',
      //     params: [this.asset.assetId]
      //   });

      const now = this.utils.getTime();

      const attachments = this.attachments
        .map(attachment => ({
          ...attachment,
          key: this.asset.assetId,
          timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
          isUploaded: -1
        }));
      console.log('isi attachment', attachments);

      // parametersThatHaveAttachments.forEach(parameter => {
      //   attachments.push(
      //     ...parameter.attachments.map((attachment: any) => ({
      //       ...attachment,
      //       key: this.asset.assetId,
      //       parameterId: parameter.parameterId,
      //       timestamp: moment(now).format('YYYY-MM-DD HH:mm:ss'),
      //       isUploaded: -1
      //     }))
      //   );
      // });

      await this.database.insert('recordAttachment', attachments);
      // }

      // if (data.length || hasAttachments) {
      //   await this.shared.addLogActivity({
      //     activity: 'User saves temporary recording data',
      //     data: {
      //       asset: this.asset.assetNumber,
      //       scannedWith: this.record.scannedWith,
      //       message: 'Success save temporary recording data',
      //       status: 'success'
      //     }
      //   });

      //   await this.notification.cancel('Hold Record Notification', this.asset.id);

      //   const notificationSchema: LocalNotificationSchema = {
      //     id: 0, // ID akan otomatis ditimpa oleh service
      //     title: 'Hold Record Notification',
      //     body: `You have recordings temporarily saved on asset ${this.asset.asset_number}!`,
      //     schedule: {
      //       at: new Date(this.schedule.scheduleTo),
      //       allowWhileIdle: true
      //     },
      //     smallIcon: 'ic_notification_schedule',
      //     largeIcon: 'ic_notification_schedule'
      //   };

      //   notificationSchema.schedule.at.setHours(
      //     notificationSchema.schedule.at.getHours() - 1
      //   );

      //   await this.notification.schedule(this.asset.id, notificationSchema);

      //   const alert = await this.utils.createCustomAlert({
      //     type: 'success',
      //     header: 'Success',
      //     message: `Success save temporarily asset ${this.asset.asset_number}`,
      //     buttons: [{
      //       text: 'Okay',
      //       handler: () => alert.dismiss()
      //     }]
      //   });

      //   alert.present();
      //   const offset = this.transitionData.offset || 0;
      //   this.utils.back(2 + offset);
      // } else {
      //   const alert = await this.utils.createCustomAlert({
      //     type: 'warning',
      //     header: 'Warning',
      //     message: 'You must fill in at least 1 parameter to save temporarily',
      //     buttons: [{
      //       text: 'Okay',
      //       handler: () => alert.dismiss()
      //     }]
      //   });

      //   alert.present();
      // }
    } catch (error) {
      const alert = await this.utils.createCustomAlert({
        type: 'error',
        header: 'Failed',
        message: 'An error occurred while saving data temporarily',
        buttons: [{
          text: 'Okay',
          handler: () => alert.dismiss()
        }]
      });

      alert.present();
      await this.shared.addLogActivity({
        activity: 'User saves temporary recording data',
        data: {
          asset: this.asset.assetNumber,
          scannedWith: this.record.scannedWith,
          message: error?.message ? error.message : error,
          status: 'failed'
        }
      });
    } finally {
      loader.dismiss();
    }
  }

  showImageViewer({ target }: Event) {
    const viewer = new Viewer(target as HTMLElement, {
      navbar: false,
      toolbar: false,
      button: false,
      hidden: () =>
        this.menuCtrl.swipeGesture(true, 'asset-information')
    });

    this.menuCtrl.swipeGesture(false, 'asset-information')
      .then(() => viewer.show());
  }

  private async getAsset() {
    try {
      const now = this.utils.getTime();
      this.record.scannedAt = moment(now).format('YYYY-MM-DD HH:mm:ss');

      this.record.scannedBy = this.shared.user.name;
      this.record.scannedWith = this.transitionData?.type;
      const value = this.transitionData.data;


      const resultAsset = await this.database.select('schedule', {
        where: {
          query: `assetId=?`,
          params: [value]
        }
      });

      const [asset] = this.database.parseResult(resultAsset);
      const assetarr = this.database.parseResult(resultAsset);
      console.log('value :', value);

      const resultParameters = await this.database.select('parameter', {
        where: {
          query: `assetId=?`,
          params: [value]
        }
      }
      );
      const isiaray = { notes: "", attachments: [] };
      const params = this.database.parseResult(resultParameters)

      const ak = params.map(attachment =>
      ({
        ...attachment,
        ...isiaray
      })
      )

      this.resultParam = ak;
      console.log('awal parameter :', this.resultParam);
      console.log('asset schedule :', asset);
      this.sch = assetarr;

      if (asset) {
        console.log('css', this.shared.schtype.type)
        console.log('css1', asset.schType)
        this.shared.setSchType({
          type: asset.schType
        });
        console.log('css2', this.shared.schtype.type)


        this.setDataAsset(asset);
        if (this.schedule.scheduleTrxId) {
          this.getHoldRecord();
          this.getHoldAttachment();
          if (await this.isAlreadyScanned()) {
            const alert = await this.utils.createCustomAlert({
              type: 'warning',
              header: 'Warning',
              message: 'This asset has been scanned for the current schedule, are you sure you want to continue scanning?',
              buttons: [
                {
                  text: 'Continue',
                  handler: () => alert.dismiss()
                },
                {
                  text: 'Back',
                  handler: () => {
                    this.utils.back();
                    alert.dismiss();
                  }
                }
              ],
              backdropDismiss: false
            });

            alert.present();
          }
        }



      }
      // const value = this.transitionData.data;
      // const resultAsset = await this.database.select('schedule', {
      //   where: {
      //     query: `assetId=?`,
      //     params: [value]
      //   }
      // });
      // const asset = this.database.parseResult(resultAsset);
      console.log('value :', value);
      console.log('cek jumlah jadwal :', asset)

      if(assetarr.length > 1){
        const datatype = assetarr.map(k =>({
        label: k.schType,
        type: "radio",
        value: k.schType
        }))
        const alert = await this.utils.createCustomAlert({
          type: 'radio',
          header: 'Type Scan',
          backdropDismiss: false,
          param: datatype,
          buttons: [
            {
              text: 'Lanjutkan',
              handler: async ()  =>
              {
                console.log('k', this.shared.schtype.type)
                console.log('value', value)
                alert.dismiss()
                const resultParameters = await this.database.select('parameter', {
                  where: {

                    query: `assetId=? AND schType=?`,
                    // params: ["96b7597d-7b56-4f87-868f-e775e7908b21", "Monthly"]
                    params: [value, toLower(this.shared.schtype.type)]
                  }
                }
                );
                console.log('cek param', resultParameters)
                const isiaray = { notes: "", attachments: [] };
                const params = this.database.parseResult(resultParameters)
                console.log('cek param2', params)

                const ak = params.map(attachment =>
                ({
                  ...attachment,
                  ...isiaray
                })
                )

                this.resultParam = ak
                console.log(this.resultParam)

              }

            }
          ],
        });

        alert.present();
      }else{
        const resultParameters = await this.database.select('parameter', {
          where: {

            query: `assetId=? AND schType=?`,
            // params: ["96b7597d-7b56-4f87-868f-e775e7908b21", "Monthly"]
            params: [value, toLower(this.shared.schtype.type)]
          }
        }
        );
        console.log('cek param', resultParameters)
        const isiaray = { notes: "", attachments: [] };
        const params = this.database.parseResult(resultParameters)
        console.log('cek param2', params)

        const ak = params.map(attachment =>
        ({
          ...attachment,
          ...isiaray
        })
        )

        this.resultParam = ak
        console.log(this.resultParam)
      }


    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;

    }
  }

  private async getSchedule() {
    try {

      const value = await this.getAssetTagValue();
      const result = await this.database.select('schedule', {
        // where: {
        //   query: `assetId=?`,
        //   params: [value]
        // }
      });

      // console.log({ result: result });

      const now = this.utils.getTime();
      const schedule = this.database.parseResult(result)
      // .find(item => {
      //   const start = new Date(item.scheduleFrom).getTime();
      //   const end = new Date(item.scheduleTo).getTime();
      //   return moment(now).isBetween(start, end);
      // });

      // console.log({ schedule: schedule });

      if (schedule) {
        this.setDataSchedule(schedule);
      };
    } catch (error) {
      console.error(error);
    }
  }

  private async getHoldRecord() {
    try {
      const result = await this.database.select('recordHold', {
        where: {
          query: `assetId=?`,
          params: [this.asset.assetId]
        }
      });

      // this.database.parseResult(result).forEach(record => {
      //   const parameter = this.asset.parameter.find(p => p.parameterId === record.parameterId);

      //   if (parameter) {
      //     parameter.value = record.value;
      //   }

      //   this.setDataRecord(record);
      // });
    } catch (error) {
      console.error(error);
    }
  }
  showVal(val: any) {
    console.log('data show:', val)
  }
  private async getHoldAttachment() {
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
          params: [this.asset.assetId]
        }
      });

      this.database.parseResult(result)
        .forEach(({ parameterId, ...attachment }) => {
          if (parameterId) {
            // this.asset.parameter
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

  private async isAlreadyScanned() {
    let isAlreadyScanned = false;

    try {
      const schedule = await this.database.select('schedule', {
        column: ['scheduleTrxId'],
        where: {
          query: 'scheduleTrxId=? AND syncAt IS NOT NULL',
          params: [this.schedule.scheduleTrxId]
        },
        groupBy: ['scheduleTrxId'],
        limit: 1
      });

      const record = await this.database.select('record', {
        column: ['scheduleTrxId'],
        where: {
          query: 'scheduleTrxId=?',
          params: [this.schedule.scheduleTrxId]
        },
        groupBy: ['scheduleTrxId'],
        limit: 1
      });

      isAlreadyScanned = (schedule.rows.length + record.rows.length) > 0;
    } catch (error) {
      console.error(error);
    }

    return isAlreadyScanned;
  }

  private async getAssetTagValue() {
    if (['qrcode', 'coordinat'].includes(this.record.scannedWith)) {
      return this.transitionData?.data;
    }
    // console.log('assetTag', this.transitionData);

    let assetId: string;

    try {
      const result = await this.database.select('assetTag', {
        column: ['assetId'],
        where: {
          query: `assetTaggingType=? AND assetTaggingValue=?`,
          params: [this.record.scannedWith, this.transitionData?.data]
        },
        limit: 1
      });

      const [assetTag] = this.database.parseResult(result);
      assetId = assetTag?.assetId;
    } catch (error) {
      console.error(error);
    }

    return assetId;
  }

  private setDataAsset(asset: any) {
    const tagIds: string[] = asset?.tagId?.length
      ? asset?.tagId?.split?.(',')
      : [];

    const tagNames = asset?.tagName?.length
      ? asset?.tagName?.split?.(',')
      : [];

    const tagLocationIds = asset?.tagLocationId?.length
      ? asset?.tagLocationId?.split?.(',')
      : [];

    const tagLocationNames = asset?.tagLocationName?.length
      ? asset?.tagLocationName?.split?.(',')
      : [];

    // this.asset.id = asset?.id;
    // this.asset.asset_number = asset?.asset_number;
    // this.asset.photo = asset?.photo;
    // this.asset.description = asset?.description;
    // this.asset.sch_manual = this.utils.parseJson(asset?.sch_manual);
    this.asset.schType = this.sch[0].schType;
    this.asset.merk = this.sch[0].merk;
    // this.asset.sch_frequency = asset?.sch_frequency;
    // this.asset.sch_weeks = asset?.sch_weeks;
    // this.asset.schWeekDays = asset?.schWeekDays;
    // this.asset.schDays = asset?.schDays;
    // this.asset.offlinePhoto = asset?.offlinePhoto;
    // this.asset.parameter = asset?.parameter;
    // this.asset.more = asset?.more;
    this.asset.assetId = asset?.assetId;
    this.asset.assetNumber = asset?.assetNumber;
    this.asset.assetStatusName = this.sch[0].assetStatusName;
    this.asset.condition = this.sch[0].condition;
    this.asset.latitude = this.sch[0].latitude;
    this.asset.longitude = this.sch[0].longitude;
    // this.asset.min = asset?.min;
    // this.asset.normal = asset?.normal;
    // this.asset.abnormal = asset?.abnormal;
    // this.asset.option = asset?.option;
    // this.asset.parameterId = asset?.parameterId;
    // this.asset.parameterName = asset?.parameterName;
    // this.asset.photo1 = parameter[photoKey];
    this.asset.offlinePhoto = null;
    this.asset.reportPhoto = asset?.reportPhoto;
    // this.asset.col = asset?.col;
    // this.asset.reportType = asset?.reportType;
    // this.asset.showOn = asset?.showOn;
    // this.asset.sortId = asset?.sortId;
    // this.asset.uom = asset?.uom;
    // this.asset.workInstruction = asset?.workInstruction;
    this.asset.tagId = asset?.tagId;
    this.asset.unit = asset?.unit;
    this.asset.unitId = asset?.unitId;
    this.asset.area = asset?.area;
    this.asset.areaId = asset?.areaId;
    this.asset.created_at = asset?.created_at;
    // this.asset.updated_at = asset?.updated_at;

    if (asset.offlinePhoto) {
      this.asset.offlinePhoto = Capacitor.convertFileSrc(asset.offlinePhoto);
    }

    console.log({ tagIds, tagNames, tagLocationIds, tagLocationNames });

    // this.asset.tags = zip(tagIds, tagNames)
    //   .map(([id, name]) => ({ id, name }));

    // this.asset.tagLocations = zip(tagLocationIds, tagLocationNames)
    //   .map(([id, name]) => ({ id, name }));

    // console.log({ asset: this.asset.tags, tagLocations: this.asset.tagLocations });

  }

  private setDataRecord(record: any) {
    this.record.scannedAt = record.scannedAt;
    this.record.scannedWith = record.scannedWith;
    this.record.scannedNotes = record.scannedNotes;
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
      value: null,
      isDeviation: false
    };
  }

  private isDeviation(parameter: any) {
    // console.log('cek deviasi ', parameter)
    if (parameter.value == null || parameter.value === '') {
      return false;
    }

    if (parameter.inputType === 'input') {
      const value = Number(parameter.value);
      if (isNaN(value)) {
        return true;
      }

      if (parameter.min != null && parameter.min !== '') {
        const min = Number(parameter.min);

        if (!isNaN(min) && value < min) {
          return true;
        }
      }

      if (parameter.max != null && parameter.max !== '') {
        const max = Number(parameter.max);

        if (!isNaN(max) && value > max) {
          return true;
        }
      }

      return false;
    }

    if (parameter.inputType === 'select') {
      function searchStringInArray(str, strArray) {
        return strArray.includes(str);
      }
      // console.log('hasil', );
      // console.log('abnormal', parameter.abnormal.split(","));
      // console.log('value', parameter.value);
      return searchStringInArray(parameter.value, parameter.abnormal.split(","));
    }

    return false;
  }

  private async getPicture(parameter?: any, index?: any) {
    const filePath = await this.media.getPicture();
    // console.log('parameter select: ', parameter)
    if (filePath) {
      const attachment = {
        name: filePath?.split?.('/')?.pop?.(),
        type: 'image/jpeg',
        filePath,
        notes: '',
        paramId: parameter?.parameterId,
      };

      // this.resultParam[index]?.attachments?.push(attachment);
      // this.resultParam[index]
      this.resultParam.filter(res => {
        return res.parameterId === parameter?.parameterId;
      })[0].attachments = [...parameter.attachments, attachment];
    }
    // this.resultParam[0].attachments.push({ nama: 'irfan' })
    // console.log('index keluar: ', index)
    console.log('attachment keluar: ', this.resultParam)

  }
  private async getPicture1(parameter?: any, index?: any) {
    const filePath = await this.media.getPicture();
    // console.log('parameter select: ', parameter)
    if (filePath) {
      const attachment = {
        name: filePath?.split?.('/')?.pop?.(),
        type: 'image/jpeg',
        filePath,
        notes: ''
      };
      (parameter?.attachments || this.attach)?.push?.(attachment);
      // this.resultParam[index]?.attachments?.push(attachment);
      // this.resultParam[index]
      // this.resultParam.filter(res => {
      //   return res.parameterId === parameter?.parameterId;
      // })[0].attachments = [...parameter.attachments, attachment];
    }
    // this.resultParam[0].attachments.push({ nama: 'irfan' })
    // console.log('index keluar: ', index)
    // console.log('attachment keluar: ', parameter.attachments)
    console.log('attachment keluar: ', this.attach)

  }
  private async captureAudio(parameter?: any) {
    const audio:any = await this.media.captureAudio();
    console.log('audio', audio);
    if (audio) {
      const attachment = {
        name: audio.name,
        type: audio.type,
        filePath: audio.fullPath,
        notes: ''
      };
      (parameter?.attachments || this.attachments)?.push?.(attachment);
//       const blobconvert = await this.media.convertFileToBlob(audio.fullPath);


// console.log('blobconvert', blobconvert);
// write_blob({
//   path: audio.fullPath,
//   directory: Directory.Data,
//   blob: blobconvert,
//   fast_mode: true,
//   recursive: true,
//   on_fallback(error) {
//     console.error(error);
// }

// }).then(function (res) {
//   console.log(res);
//   const attachment = {
//     name: audio.name,
//     type: audio.type,
//     filePath: res,
//     notes: ''
//   };
//   (parameter?.attachments || this.attachments)?.push?.(attachment);
// });



    }
  }
  // const blob1 = this.media.convert(filePath);
  // write_blob({
  //   path: filePath, blob:blob
  //  }).then(function (res) {

  //   console.log("Video written.");
  // });
  private async captureVideo(parameter?: any) {
    const video:any = await this.media.captureVideo();

    if (video) {
      const attachment = {
        name: video.name,
        type: video.type,
        filePath: video.fullPath,
        notes: ''
      };

      (parameter?.attachments || this.attachments)?.push?.(attachment);
    }
  }
  private async captureVideo1(parameter?: any) {
    const video:any = await this.media.captureVideo();

    if (video) {
      const attachment = {
        name: video.name,
        type: video.type,
        filePath: video.fullPath,
        notes: ''
      };

      (parameter?.attachments || this.attach)?.push?.(attachment);
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

  private async confirmDeleteAttachment(media: any, parameter?: any, index?: any) {
    const confirm = await this.utils.createCustomAlert({
      color: 'danger',
      type: 'warning',
      header: 'Konfirmasi',
      message: 'Apakah anda yakin ingin menghapus file?',
      buttons: [
        {
          text: 'Delete',
          handler: () => {
            console.log('media val:', media);
            console.log('parameter val:', parameter);

            const mediaIndex = parameter?.findIndex?.((attachment: any) => attachment.name === media.name)
            // : this.attachments.findIndex(attachment => attachment.name === media.name);
            console.log('mediaIndex val:', mediaIndex);

            if (mediaIndex >= 0 && parameter) {
              this.resultParam[index].attachments = [
                ...this.resultParam[index].attachments.slice(0, mediaIndex),
                ...this.resultParam[index].attachments.slice(mediaIndex + 1)
              ];
              // parameter = [
              //   ...parameter.slice(0, mediaIndex),
              //   ...parameter.slice(mediaIndex + 1)
              // ];
              console.log('parameter val:', parameter);
            } else if (mediaIndex >= 0) {
              this.resultParam[index].attachments = [
                ...this.resultParam[index].attachments.slice(0, mediaIndex),
                ...this.resultParam[index].attachments.slice(mediaIndex + 1)
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

  private async confirmDeleteAttachmentAlat(media: any) {
    const confirm = await this.utils.createCustomAlert({
      color: 'danger',
      type: 'warning',
      header: 'Konfirmasi',
      message: 'Apakah anda yakin ingin menghapus file?',
      buttons: [
        {
          text: 'Delete',
          handler: () => {
            console.log('media val:', media);
            // console.log('parameter val:', parameter);

            const mediaIndex = this.attach?.findIndex?.((attachment: any) => attachment.name === media.name)
            console.log('mediaIndex val:', mediaIndex);
            console.log('mediaIndex sch:', this.attach);

            if (mediaIndex >= 0 && this.attach) {
              this.attach = [
                ...this.attach.slice(0, mediaIndex),
                ...this.attach.slice(mediaIndex + 1)
              ];
            } else if (mediaIndex >= 0) {
              this.attach = [
                ...this.attach.slice(0, mediaIndex),
                ...this.attach.slice(mediaIndex + 1)
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

}