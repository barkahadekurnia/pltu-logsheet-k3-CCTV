/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
import { Injectable, Injector } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { DatabaseService } from 'src/app/services/database/database.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';

export type UserData = {
  id?: string;
  name?: string;
  email?: string;
  group?: string;
  token?: string;
  tempUserId?: string;
  namaperusahaan?: string;
  photo?: string;
  parameter?: { [key: string]: any };
  serverTimeAtLogin?: string;
  localTimeAtLogin?: number;
};
export type UserDetail = {
  shift?: string;
  nonshift?: string;
  lk3?: string;
};
export type SchType = {
  type?: string;
};
export type AttachmentSettings = {
  imageMaxHeight?: number;
  imageMaxWidth?: number;
  imageQuality?: number;
  audioMaxDuration?: number;
  videoHighResolution?: boolean;
  videoMaxDuration?: number;
};

type DataKey = {
  key: string;
  storageKey: string;
  defaultValue?: any;
};

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  asset: {
    abbreviation?: string;
    adviceDate?: string;
    approvedAt?: string;
    approvedBy?: string;
    approvedNotes?: string;
    area?: string;
    areaId?: string;
    assetCategoryId?: string;
    assetCategoryName?: string;
    assetForm?: string;
    assetId?: string;
    assetNumber?: string;
    assetStatusId?: string;
    assetStatusName?: string;
    capacityValue?: string;
    condition?: string;
    created_at?: string;
    date?: string;
    deleted_at?: string;
    detailLocation?: string;
    idschedule?: string;
    latitude?: string;
    longitude?: string;
    merk?: string;
    photo?: string;
    offlinePhoto?: string;
    reportPhoto?: string;
    scannedAccuration?: string;
    scannedAt?: string;
    scannedBy?: string;
    scannedEnd?: string;
    scannedNotes?: string;
    scannedWith?: string;
    schDays?: string;
    schFrequency?: string;
    schManual?: string;
    schType?: string;
    schWeekDays?: string;
    schWeeks?: string;
    scheduleFrom?: string;
    scheduleTo?: string;
    scheduleTrxId?: string;
    supplyDate?: string;
    syncAt?: string;
    tagId?: string;
    tagNumber?: string;
    unit?: string;
    unitCapacity?: string;
    unitId?: string;
  };
  apar: {
    assetId: string;
    merk: string;
    assetStatusName: string;
    condition: string;
    assetCategoryId: string;
    schType: string;
    assetCategoryName: string;
    offlinePhoto: string;
    assetName: string;
    assetNumber: string;
    mediaId: string;
    mediaName: string;
    photo: string;
    description: string;
    schFrequency: string;
    schManual: string;
    schWeekDays: string;
    schWeeks: string;
    scheduleFrom: string;
    scheduleTo: string;
    syncAt: string;
    tagId: string;
    tagNumber: string;
    assetStatusId: string;
    abbreviation: string;
    capacityId: string;
    capacityValue: string;
    detailLocation: string;
    unitCapacity: string;
    unit: string;
    typeTag: string;
    merkName: string;
    typeName: string;
    unitId: string;
    area: string;
    areaId: string;
    latitude: string;
    longitude: string;
    created_at: string;
    deleted_at: string;
    date: string;
  };
  akun: {
    nama: string;
    role: string;
  };

  filterOptions: {
    data: {
      label: string;
      key: string;
      values: {
        text: string;
        value: string;
        selected: boolean;
      }[];
    }[];
    keyword: '';
    onApply: () => any | void;
    onReset: () => any | void;
    onCancel: () => any | void;
  };

  records: any[];
  onUploadRecordsCompleted: () => any | void;

  private _initialCheck: boolean;
  private _offlineImages: boolean;
  private _imageQuality: 'high' | 'normal' | 'low';
  private _actionAfterSave: 'local' | 'upload';
  private _textZoom: number;
  private _lastSynchronize: string;
  private _lastOpened: string;
  private _notificationIds: any[];
  private _isBackButtonVisible: boolean;

  private _user: UserData;
  private _userdetail: UserDetail;
  private _schtype: SchType;
  private _attachmentConfig: AttachmentSettings;
  private userDataKeys: DataKey[];
  private userDetailKey: DataKey[];
  private userSchType: DataKey[];
  private applicationDataKeys: DataKey[];
  private attachmentSettingKeys: DataKey[];
  public radiovalue: any;

  private _currentRoute: string;

  constructor(
    private injector: Injector,
    private platform: Platform
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
      assetForm: ''

    };

    this.filterOptions = {
      data: [],
      keyword: '',
      onApply: () => { },
      onReset: () => { },
      onCancel: () => { }
    };

    this.attachmentSettingKeys = [
      { key: 'imageMaxHeight', storageKey: 'attachment__imageMaxHeight', defaultValue: 1024 },
      { key: 'imageMaxWidth', storageKey: 'attachment__imageMaxWidth', defaultValue: 1024 },
      { key: 'imageQuality', storageKey: 'attachment__imageQuality', defaultValue: 60 },
      { key: 'audioMaxDuration', storageKey: 'attachment__audioMaxDuration', defaultValue: 30 },
      { key: 'videoHighResolution', storageKey: 'attachment__videoHighResolution', defaultValue: 0 },
      { key: 'videoMaxDuration', storageKey: 'attachment__videoMaxDuration', defaultValue: 30 }
    ];

    this.applicationDataKeys = [
      { key: 'name', storageKey: 'app__applicationName' },
      { key: 'logo', storageKey: 'app__applicationLogo' }
    ];

    this.userDataKeys = [
      { key: 'id', storageKey: 'user__id' },
      { key: 'name', storageKey: 'user__name' },
      { key: 'email', storageKey: 'user__email' },
      { key: 'group', storageKey: 'user__group' },
      { key: 'tempUserId', storageKey: 'user__tempUserId' },
      { key: 'namaperusahaan', storageKey: 'user__namaperusahaan' },
      { key: 'photo', storageKey: 'user__photo' },
      { key: 'token', storageKey: environment.values.token },
      { key: 'parameter', storageKey: 'user__parameter' },
      { key: 'serverTimeAtLogin', storageKey: 'user__serverTimeAtLogin' },
      { key: 'localTimeAtLogin', storageKey: 'user__localTimeAtLogin' }
    ];
    this.userDetailKey = [
      { key: 'shift', storageKey: 'user__shift' },
      { key: 'nonshift', storageKey: 'user__nonshift' },
      { key: 'lk3', storageKey: 'user__lk3' }
    ];
    this.userSchType = [
      { key: 'type', storageKey: 'user__type' },
    ];
    this.records = [];

    this._initialCheck = true;
    this._offlineImages = false;
    this._imageQuality = 'low';
    this._textZoom = 1.0;
    this._notificationIds = [];

    this._attachmentConfig = {};
    this._user = {};
    this._userdetail = {};
    this._schtype = {};

    this.onUploadRecordsCompleted = () => { };
  }

  get isInitialCheck() {
    return this._initialCheck;
  }
  get isvalueradio() {
    return this.radiovalue;
  }
  get currentRoute(): string {
    return this._currentRoute;
  }
  get isAuthenticated() {
    return (
      this._user.id &&
      this._user.name &&
      this._user.email &&
      this._user.token &&
      this._user.serverTimeAtLogin &&
      this._user.localTimeAtLogin != null
    );
  }

  get user(): UserData {
    return { ...this._user };
  }
  get userdetail(): UserDetail {
    return { ...this._userdetail };
  }
  get schtype(): SchType {
    return { ...this._schtype };
  }

  get attachmentConfig(): AttachmentSettings {
    return { ...this._attachmentConfig };
  }

  get actionAfterSave() {
    return this._actionAfterSave;
  }

  get lastSynchronize() {
    return this._lastSynchronize;
  }

  get lastOpened() {
    return this._lastOpened;
  }

  get imageQuality() {
    return this._imageQuality;
  }

  get isOfflineImages() {
    return this._offlineImages;
  }

  get textZoom() {
    return this._textZoom;
  }

  get notificationIds() {
    return this._notificationIds;
  }
  set isradiovalue(value) {
    this.radiovalue = value;
  }
  set currentRoute(value: string) {
    this._currentRoute = value;
  }
  setUserData(data: UserData) {
    for (const key of this.userDataKeys) {
      if (data[key.key]) {
        this._user[key.key] = data[key.key];

        Storage.set({
          key: key.storageKey,
          value: JSON.stringify(data[key.key])
        });
      }
    }
  }
  setUserDetail(data: UserDetail) {
    for (const key of this.userDetailKey) {
      if (data[key.key]) {
        this._userdetail[key.key] = data[key.key];
        Storage.set({
          key: key.storageKey,
          value: JSON.stringify(data[key.key])
        });
      }
    }

  }
  setSchType(data: SchType) {
    for (const key of this.userSchType) {
      if (data[key.key]) {
        this._schtype[key.key] = data[key.key];
        Storage.set({
          key: key.storageKey,
          value: JSON.stringify(data[key.key])
        });
      }
    }

  }

  setAttachmentConfig(config: AttachmentSettings) {
    for (const key of this.attachmentSettingKeys) {
      if (config[key.key] != null) {
        this._attachmentConfig[key.key] = config[key.key];

        Storage.set({
          key: key.storageKey,
          value: JSON.stringify(config[key.key])
        });
      }
    }
  }

  setActionAfterSave(value: 'local' | 'upload') {
    this._actionAfterSave = value;

    Storage.set({
      key: 'record__actionAfterSave',
      value: JSON.stringify(value)
    });
  }

  setLastSynchronize(value: string) {
    this._lastSynchronize = value;

    Storage.set({
      key: 'app__lastSynchronize',
      value: JSON.stringify(value)
    });
  }

  setLastOpened(value: string) {
    this._lastOpened = value;

    Storage.set({
      key: 'app__lastOpened',
      value: JSON.stringify(value)
    });
  }

  setImageQuality(value: 'high' | 'normal' | 'low') {
    this._imageQuality = value;

    Storage.set({
      key: 'app__imageQuality',
      value: JSON.stringify(value)
    });
  }

  setOfflineImages(value: boolean) {
    this._offlineImages = value;

    Storage.set({
      key: 'app__offlineImages',
      value: JSON.stringify(value)
    });
  }

  setTextZoom(value: number) {
    this._textZoom = value;

    Storage.set({
      key: 'app__textZoom',
      value: JSON.stringify(value)
    });
  }

  setNotificationIds(data: any[]) {
    this._notificationIds = data;

    Storage.set({
      key: 'notification__ids',
      value: JSON.stringify(data)
    });
  }

  async getAppData() {
    await this.platform.ready();
    const utils = this.injector.get(UtilsService);

    const { value: textZoom } = await Storage.get({
      key: 'app__textZoom'
    });

    this._textZoom = textZoom != null ? utils.parseJson(textZoom) : 1.0;

    const { value: imageQuality } = await Storage.get({
      key: 'app__imageQuality'
    });

    this._imageQuality = imageQuality != null ? utils.parseJson(imageQuality) : 'low';

    const { value: offlineImages } = await Storage.get({
      key: 'app__offlineImages'
    });

    this._offlineImages = utils.parseJson(offlineImages);

    for (const setting of this.attachmentSettingKeys) {
      const { value } = await Storage.get({
        key: setting.storageKey
      });

      this._attachmentConfig[setting.key] = utils.parseJson(value) || setting.defaultValue;
    }

    const { value: actionAfterSave } = await Storage.get({
      key: 'record__actionAfterSave'
    });

    this._actionAfterSave = utils.parseJson(actionAfterSave);

    for (const { key, storageKey } of this.userDataKeys) {
      const { value } = await Storage.get({
        key: storageKey
      });

      this._user[key] = utils.parseJson(value);
    }
    for (const { key, storageKey } of this.userDetailKey) {
      const { value } = await Storage.get({
        key: storageKey
      });

      this._userdetail[key] = utils.parseJson(value);
    }
    for (const { key, storageKey } of this.userSchType) {
      const { value } = await Storage.get({
        key: storageKey
      });

      this._schtype[key] = utils.parseJson(value);
    }

    const { value: lastSynchronize } = await Storage.get({
      key: 'app__lastSynchronize'
    });

    this._lastSynchronize = utils.parseJson(lastSynchronize);

    const { value: lastOpened } = await Storage.get({
      key: 'app__lastOpened'
    });

    this._lastOpened = utils.parseJson(lastOpened);

    const { value: notificationIds } = await Storage.get({
      key: 'notification__ids'
    });



    this._lastOpened = utils.parseJson(lastOpened);

    if (this._initialCheck) {
      this._initialCheck = false;
    }
  }

  async clearAppData() {
    const database = this.injector.get(DatabaseService);

    await database.destroyTables({
      exceptions: ['activityLog']
    });

    await database.emptyTable('activityLog');

    const notification = this.injector.get(NotificationService);
    await notification.cancelAll();
    await this.removeAppDirectories();

    const storageKeys = [
      ...this.userDataKeys.map(key => key.storageKey),
      ...this.applicationDataKeys.map(key => key.storageKey),
      environment.values.form,
      environment.values.token,
      environment.values.secureKey,
      environment.values.secureIV,
      'app__lastSynchronize',
      'app__lastOpened'
    ];

    for (const key of storageKeys) {
      await Storage.remove({ key });
    }

    this._user = {};
    this._userdetail = {
      shift: '',
      nonshift: '',
      lk3: ''
    };
    this._lastSynchronize = null;
    this._lastOpened = null;
    this.records = [];

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
      assetForm: ''

    };

    this.filterOptions = {
      data: [],
      keyword: '',
      onApply: () => { },
      onReset: () => { },
      onCancel: () => { }
    };
  }

  async addLogActivity(
    payload: {
      userId?: string;
      activity: string;
      data?: any;
    }
  ) {
    const database = this.injector.get(DatabaseService);
    const utils = this.injector.get(UtilsService);
    const now = utils.getTime();

    await database.insert('activityLog', [{
      activity: payload.activity,
      data: payload.data ? JSON.stringify(payload.data) : '',
      userId: payload.userId || this._user.id,
      time: moment(now).format('YYYY-MM-DD HH:mm:ss'),
      isUploaded: 0
    }]);
  }

  private async removeAppDirectories() {
    const paths = [
      'application',
      'asset',
      'parameter'
    ];

    for (const path of paths) {
      try {
        const { files } = await Filesystem.readdir({
          path,
          directory: Directory.Data
        });

        for (const file of files) {
          await Filesystem.deleteFile({
            path: `${file}`,
            directory: Directory.Data
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}
