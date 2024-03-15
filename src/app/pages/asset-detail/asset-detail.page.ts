/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MenuController, IonModal, IonContent, ActionSheetController, IonPopover, PopoverController, PopoverOptions } from '@ionic/angular';

import Viewer from 'viewerjs';
import { find, map, merge, result } from 'lodash';

import { UtilsService } from 'src/app/services/utils/utils.service';
import { HttpService } from 'src/app/services/http/http.service';
import { environment } from 'src/environments/environment';
import { AssetFormDetails, DetailAssetTags, TypeForm } from 'src/app/interfaces/asset-details';
import { DatabaseService } from 'src/app/services/database/database.service';
import { MediaService, PictureSource } from 'src/app/services/media/media.service';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { PickerScreenComponent } from 'src/app/components/picker-screen/picker-screen.component';
import { Geolocation } from '@capacitor/geolocation';
import { MapPickerComponent } from 'src/app/components/map-picker/map-picker.component';
import * as moment from 'moment';

export interface AssetCredentials {
  ipAddress: string,
  username: string,
  password: string,
  latitude: number,
  longitude: number,
  locationStatus: string,
};

interface AssetStatus {
  id: string,
  asset_status_name: string,
  abbreviation: string,
  assetCategoryId: string,
  description: string,
};

@Component({
  selector: 'app-asset-detail',
  templateUrl: './asset-detail.page.html',
  styleUrls: ['./asset-detail.page.scss'],
})

export class AssetDetailPage implements OnInit {
  @ViewChild(IonContent, { static: true }) ionContent?: IonContent;
  @ViewChild('swiper') swiper: ElementRef | undefined;
  @ViewChild('imageViewer') imageViewer: ElementRef;

  @ViewChild(IonModal) modal: IonModal;
  @ViewChild(IonPopover) popover: IonPopover;

  checkOnly: boolean;

  openSettingsButton: {
    text: string;
    icon?: string;
    iconEnd?: boolean;
    handler?: () => any | void;
  };

  scanQrButton: {
    text: string;
    icon?: string;
    iconEnd?: boolean;
    handler?: () => any | void;
  };
  private transitionData: {
    type?: string;
    data: string;
    offset?: number;
  };

  resultParam: any;

  slideOpts = {
    initialSlide: 1,
    speed: 400,
  };

  dataFormDetailAsset: AssetFormDetails[];
  dataFormDetailMarkSign: DetailAssetTags;

  selectionUnit: any[] = [];
  selectionArea: any[] = [];
  selectionMarkSign: any[] = [];
  filteredArea: any[] = [];
  filteredMarkSign: any[] = [];
  selectionStatus: AssetStatus[] = [];

  currentDetailLokasi: any;
  currentTandaPemasangan: any;

  isPasswordVisible = false;

  asset: AssetCredentials = {
    ipAddress: '',
    username: '',
    password: '',
    latitude: null,
    longitude: null,
    locationStatus: '',
  };

  assetStatus: AssetStatus = {
    id: '',
    asset_status_name: '',
    abbreviation: '',
    assetCategoryId: '',
    description: '',
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    public utils: UtilsService,
    private menuCtrl: MenuController,
    private http: HttpService,
    private database: DatabaseService,
    private actionSheetCtrl: ActionSheetController,
    private media: MediaService,
    private popoverCtrl: PopoverController,
  ) {
    this.dataFormDetailAsset = [];
  }

  async ngOnInit() {
    const { coords } = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 2000
    });

    if (!coords) {
      return;
    }

    this.asset.latitude = coords.latitude;
    this.asset.longitude = coords.longitude;

    this.transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );
    console.log('transitionData', this.transitionData);


    if (!this.transitionData) {
      return this.utils.back();
    }

    this.showDataOffline();
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(true, 'asset-information')
      .then(() => this.menuCtrl.swipeGesture(true, 'asset-information'));
  }

  async ionViewWillLeave() {
    await this.menuCtrl.enable(false, 'asset-information');
    await this.menuCtrl.swipeGesture(false, 'asset-information');
  }

  doRefresh(e: any) {
    this.showDataOffline().finally(() => {
      setTimeout(() => e.target.complete(), 100);
    });
  }

  async showDataOffline() {
    const assetId = /[^/]*$/.exec(this.transitionData.data)[0];
    console.log('assetId', assetId);

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
          'isUploaded',
        ],
        where: {
          query: 'assetId=?',
          params: [assetId]
        },
      });

      const parsedAssets = this.database.parseResult(resAssets);
      const arrAssetAll: any[] = parsedAssets
        ?.map(
          (asset: any) => ({
            assetId: asset.assetId,
            assetNumber: asset.assetNumber,
            assetForm: this.utils.parseJson(asset.assetForm),
            description: asset.description,
            expireDate: asset.expireDate,
            historyActive: asset.history,
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
            isUploaded: asset.isUploaded,
          })
        );

      console.log('arrAssetAll', arrAssetAll);

      this.resultParam = arrAssetAll[0];
      console.log('resultParam', this.resultParam);

      this.asset.ipAddress = this.resultParam?.ipAddress;
      this.asset.username = this.resultParam?.username;
      this.asset.password = this.resultParam?.password;

      this.assetStatus.id = this.resultParam?.more.status.id;
      this.assetStatus.asset_status_name = this.resultParam?.more.status.name;
      this.assetStatus.description = this.resultParam?.more.status.name;
      this.assetStatus.abbreviation = this.resultParam?.more.status.abbreviation;
      this.assetStatus.assetCategoryId = this.resultParam?.more.category.id;
      console.log('this result param', this.resultParam);

      const resStatus = await this.database.select('assetStatus', {
        column: [
          'abbreviation',
          'assetCategoryId',
          'asset_status_name',
          'description',
          'id',
        ],
        where: {
          query: 'assetCategoryId=?',
          params: [this.resultParam?.more.category?.id]
        },
      });

      const parsedStatus = this.database.parseResult(resStatus);
      const arrStatus: any[] = parsedStatus
        ?.map(
          (status: any) => ({
            id: status.id,
            asset_status_name: status.asset_status_name,
            abbreviation: status.abbreviation,
            assetCategoryId: status.assetCategoryId,
            description: status.description,
          })
        );

      this.selectionStatus = arrStatus;
      console.log('arrStatus', arrStatus);
    } catch (err) {
      console.error(err);
    }
  }

  showImageViewer({ target }: Event) {
    const options: Viewer.Options = {
      navbar: false,
      toolbar: false,
      button: false
    };

    const viewer = new Viewer(target as HTMLElement, options);
    viewer.show();
  }

  async selectMedia() {
    const actionSheet = await this.actionSheetCtrl.create({
      animated: true,
      backdropDismiss: true,
      header: 'Pilih sumber media',
      buttons: [
        {
          icon: 'camera-outline',
          text: 'Kamera',
          handler: () => this.getPicture()
        },
        {
          icon: 'image-outline',
          text: 'Galeri',
          handler: () => this.getPictureBySource('gallery')
        },
        {
          icon: 'folder-outline',
          text: 'File',
          handler: () => this.getPictureBySource('files')
        },
        {
          icon: 'close-outline',
          text: 'Batal',
          role: 'cancel'
        }
      ]
    });
    actionSheet.present();
  }

  async getDataEditForms() {
    const loader = await this.utils.presentLoader();

    try {
      await this.getDataInputForms();
      await this.getDataMarkSign();
    } catch (err) {
      console.error(err);
    } finally {
      await loader.dismiss();
    }
  }

  async getDataInputForms() {
    const resFormAssetsCategory = await this.database.select('formAssetsCategory', {
      column: [
        'formId',
        'idx',
        'formLabel',
        'formName',
        'formType',
        'formOption',
        'assetCategoryId',
        'assetCategoryCode',
        'assetCategoryName',
        'created_at',
        'updated_at',
        'deleted_at'
      ],
      where: {
        query: 'assetCategoryId=?',
        params: [this.resultParam.more.category?.id]
      },
    });

    const parsedFormAssetsCategory = this.database.parseResult(resFormAssetsCategory);
    const assetFormCategoryAllSQL: any[] = parsedFormAssetsCategory
      .map(
        (asset) => ({
          formId: asset.formId,
          idx: asset.idx,
          formLabel: asset.formLabel,
          formName: asset.formName,
          formType: asset.formType,
          formOption: this.utils.parseJson(asset.formOption),
          assetCategoryId: asset.assetCategoryId,
          assetCategoryCode: asset.assetCategoryCode,
          assetCategoryName: asset.assetCategoryName,
          created_at: asset.created_at,
          updated_at: asset.updated_at,
          deleted_at: asset.deleted_at,
          selected: true,
          value: this.resultParam.assetForm[0].formValue,
          assetFormId: this.resultParam.assetForm[0].id,
          disabled: false,
        })
      );

    const bodyformAssetDetail = this.resultParam;

    console.log('assetFormCategoryAllSQL', assetFormCategoryAllSQL);

    if (assetFormCategoryAllSQL.length) {
      const formValue = this.resultParam.assetForm[0].formValue;
      const response = await this.http.getAnyData(`${environment.url.formType}/${formValue}`);

      if (![200, 201].includes(response.status)) {
        throw response;
      }

      const dataFormTypeAsset: TypeForm[] = response.data?.data;

      const dataFormType: AssetFormDetails = {
        assetCategoryCode: null,
        assetCategoryId: null,
        assetCategoryName: null,
        created_at: null,
        deleted_at: null,
        formId: bodyformAssetDetail.id,
        formLabel: 'Type',
        formName: 'type',
        formOption: dataFormTypeAsset,
        formType: 'select',
        index: '2',
        selected: true,
        updated_at: null,
        value: this.resultParam.more.type.id,
        disabled: false,
      };

      assetFormCategoryAllSQL.push(dataFormType);
    }

    this.dataFormDetailAsset = assetFormCategoryAllSQL;
    console.log('dataFormDetailAsset', assetFormCategoryAllSQL);
  }

  async getDataMarkSign() {
    const resultUnit = await this.database.select('unit', {
      column: [
        'id',
        'unit',
        'deskripsi',
      ]
    });

    const resultArea = await this.database.select('area', {
      column: [
        'id',
        'idUnit',
        'area',
        'deskripsi',
      ]
    });

    const resultMarkSign = await this.database.select('markSign', {
      column: [
        'id',
        'idArea',
        'tag_number',
        'location',
        'detail_location',
      ]
    });

    const parsedArea: any[] = this.database.parseResult(resultArea);
    const parsedUnit: any[] = this.database.parseResult(resultUnit);
    const parsedMarkSign: any[] = this.database.parseResult(resultMarkSign);

    this.dataFormDetailMarkSign = this.resultParam.more.tag[0];

    this.selectionUnit = parsedUnit;
    this.selectionArea = parsedArea;
    this.selectionMarkSign = parsedMarkSign;

    this.filteredArea = this.selectionArea
      .filter((item) => item.idUnit === this.dataFormDetailMarkSign.unitId);
    this.filteredMarkSign = this.selectionMarkSign
      .filter((item) => item.idArea === this.dataFormDetailMarkSign.areaId);
  }

  getSelectionArea(data?: any) {
    if (data) {
      this.dataFormDetailMarkSign.unitId = data.ids[0];
      this.dataFormDetailMarkSign.unit = data.texts[0];
    }

    const idUnit = this.dataFormDetailMarkSign.unitId;

    this.filteredArea = this.selectionArea
      .filter((item) => item.idUnit === idUnit);

    this.dataFormDetailMarkSign.areaId = null;
    this.dataFormDetailMarkSign.area = null;
    this.dataFormDetailMarkSign.tag_number = null;
    this.dataFormDetailMarkSign.id = null;
    this.dataFormDetailMarkSign.location = null;
    this.dataFormDetailMarkSign.detail_location = null;
  }

  getSelectionMarkSign(data?: any) {
    if (data) {
      this.dataFormDetailMarkSign.areaId = data.ids[0];
      this.dataFormDetailMarkSign.area = data.desc[0];
    }

    const idArea = this.dataFormDetailMarkSign.areaId;

    this.filteredMarkSign = this.selectionMarkSign
      .filter((item) => item.idArea === idArea);

    this.dataFormDetailMarkSign.tag_number = null;
    this.dataFormDetailMarkSign.id = null;
    this.dataFormDetailMarkSign.location = null;
    this.dataFormDetailMarkSign.detail_location = null;
  }

  getSelectionLocation(data?: any) {
    if (data) {
      this.dataFormDetailMarkSign.id = data.ids[0];
      this.dataFormDetailMarkSign.tag_number = data.texts[0];
    }

    const idMarkSign = this.dataFormDetailMarkSign.id;
    const location = this.filteredMarkSign.find((item) => item.id === idMarkSign);

    this.dataFormDetailMarkSign.location = location?.location;
    this.dataFormDetailMarkSign.detail_location = location?.detail_location;
  }

  async fetchFormType(ev) {
    if (!ev) {
      return null;
    }

    const loader = await this.utils.presentLoader();
    const formValue = ev.detail?.value;

    try {
      const response = await this.http.getAnyData(`${environment.url.formType}/${formValue}`);

      if (![200, 201].includes(response.status)) {
        throw response;
      }

      console.log('fetchFormType', response);


      const bodyFormType = response.data?.data;

      const updatedArray = this.dataFormDetailAsset
        ?.map?.((obj) => {
          if (obj.formName === 'type') {
            return { ...obj, formOption: bodyFormType, value: null };
          }
          return obj;
        });

      this.dataFormDetailAsset = updatedArray;
    } catch (err) {
      console.error(err);
    } finally {
      await loader.dismiss();
    }
  }

  async fetchAdditionalData(ev, formOption: any[]) {
    if (!ev) {
      return null;
    }

    const mappedNextFormData = formOption
      ?.filter(obj => obj?.id === ev.detail?.value)
      ?.map(obj => obj.more);

    if (mappedNextFormData.length) {
      const removedIdxData = mappedNextFormData.shift();
      const autofillNextFormData = map(this.dataFormDetailAsset, (obj) => {
        const matchingObj = find(removedIdxData, { formId: obj.formId });
        if (matchingObj) {
          return merge(obj, { value: matchingObj.formValue });
        }
        return obj;
      });

      this.dataFormDetailAsset = autofillNextFormData;
    } else {
      this.dataFormDetailAsset = this.dataFormDetailAsset;
    }

    console.log('fetchAdditionalData', this.dataFormDetailAsset);
  }

  async setModalLocationOpen() {
    const popover = await this.utils.createCustomPicker({
      component: MapPickerComponent,
      componentProps: {
        asset: this.asset,
      },
      cssClass: 'picker-popover'
    });

    await popover.present();

    const { data, role } = await popover.onDidDismiss();
    console.log(data, role);
  }

  async openPicker(type: string, source: any[], multi: boolean) {
    const popover = await this.utils.createCustomPicker({
      component: PickerScreenComponent,
      componentProps: {
        pickerType: type,
        pickerData: source,
        multiselect: multi,
      },
      cssClass: 'picker-popover',
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if (!data) {
      return;
    }

    if (type === 'unit') {
      this.getSelectionArea(data);
    } else if (type === 'area') {
      this.getSelectionMarkSign(data);
    } else if (type === 'mark-sign') {
      this.getSelectionLocation(data);
    }
  }

  async confirmSubmitForm(modal?: IonModal) {
    const alert = await this.utils.createCustomAlert({
      type: 'warning',
      header: 'Konfirmasi',
      message: `Apakah Anda yakin untuk menyimpan data asset ${this.resultParam.assetNumber} ?`,
      buttons: [
        {
          text: 'Simpan',
          handler: () => {
            alert.dismiss();
            this.submitFormUpdate(modal);
          }
        }, {
          text: 'Batal',
          handler: () => alert.dismiss()
        }
      ]
    });
    await alert.present();
  }

  async submitFormUpdate(modal?: IonModal) {
    const loader = await this.utils.presentLoader();

    const body = new FormData();
    const dataFormType = this.dataFormDetailAsset?.filter(item => item.formName === 'type')[0];

    try {
      // const dataExcludeFormType = this.dataFormDetailAsset
      //   ?.filter(item => item.formName !== 'type')
      //   ?.map((obj) => {
      //     if (obj.assetCategoryCode && obj.formId) {
      //       const { disabled, selected, value, ...rest } = obj;
      //       return { ...rest, formValue: obj.value, formOption: JSON.stringify(obj.formOption) };
      //     } else {
      //       throw new Error('Data yang Anda masukkan tidak valid, silahkan dicoba kembali.');
      //     }
      //   });

      const dataFormTypeToStore = this.dataFormDetailAsset
        ?.filter(item => item.formName !== 'type')
        ?.map((obj) => {
          if (obj.assetCategoryCode && obj.formId) {
            const { disabled, selected, value, ...rest } = obj;
            const filteredFormOption = result(find(obj.formOption, { id: obj.value }), 'optionName');
            return { ...rest, formValue: obj.value, optionName: filteredFormOption, formOption: JSON.stringify(obj.formOption) };
          } else {
            throw new Error('Data yang Anda masukkan tidak valid, silahkan dicoba kembali.');
          }
        });

      if (dataFormType.value) {
        body.append('typeId', dataFormType.value);
      } else {
        throw new Error('Data yang Anda masukkan tidak valid, silahkan dicoba kembali.');
      }

      // console.log('resultParam', this.resultParam);
      // console.log('dataFormDetailLocation', this.dataFormDetailMarkSign);
      // console.log('selectionArea', this.selectionArea);

      const findArea = find(this.selectionArea, { id: this.dataFormDetailMarkSign.areaId });
      this.dataFormDetailMarkSign.area = findArea.deskripsi;

      const filteredObject = find(dataFormType.formOption, { id: dataFormType.value });

      const storedType = {
        id: dataFormType.value,
        name: filteredObject.type_name,
      };

      if (this.assetStatus.id) {
        const selected = this.selectionStatus.find((status) => status.id === this.assetStatus.id);
        console.log('selected', selected);

        this.resultParam.more.status.id = selected.id;
        this.resultParam.more.status.name = selected.asset_status_name;
        this.resultParam.more.status.abbreviation = selected.abbreviation;
      }

      const now = this.utils.getTime();
      const updatedAt = moment(now).format('YYYY-MM-DD HH:mm:ss');

      const storedMore = {
        category: this.resultParam.more.category,
        status: this.resultParam.more.status,
        tag: [this.dataFormDetailMarkSign],
        tagging: this.resultParam.more.tagging,
        type: storedType,
      };

      const updatedRow = {
        assetId: this.resultParam.assetId,
        assetForm: dataFormTypeToStore,
        assetNumber: this.resultParam.assetNumber,
        description: this.resultParam.description,
        expireDate: this.resultParam.expireDate,
        historyActive: this.resultParam.historyActive,
        ipAddress: this.asset.ipAddress,
        lastScannedAt: this.resultParam.lastScannedAt,
        lastScannedBy: this.resultParam.lastScannedBy,
        more: storedMore,
        password: this.asset.password,
        photo: this.resultParam.photo,
        schFrequency: this.resultParam.schFrequency,
        schManual: this.resultParam.schManual,
        schType: this.resultParam.schType,
        supplyDate: this.resultParam.supplyDate,
        username: this.asset.username,
        updatedAt,
        isUploaded: false,
      };

      console.log('updatedRow', updatedRow);

      this.database.update(
        'asset',
        {
          assetId: this.resultParam.assetId,
          assetForm: JSON.stringify(dataFormTypeToStore),
          description: this.resultParam.description,
          expireDate: this.resultParam.expireDate,
          historyActive: this.resultParam.historyActive,
          ipAddress: this.asset.ipAddress,
          lastScannedAt: this.resultParam.lastScannedAt,
          lastScannedBy: this.resultParam.lastScannedBy,
          more: JSON.stringify(storedMore),
          password: this.asset.password,
          photo: JSON.stringify(this.resultParam.photo),
          schFrequency: this.resultParam.schFrequency,
          schManual: this.resultParam.schManual,
          schType: this.resultParam.schType,
          supplyDate: this.resultParam.supplyDate,
          username: this.asset.username,
          updatedAt,
          isUploaded: false,
        },
        {
          query: 'assetId=?',
          params: [this.resultParam.assetId]
        }
      );

      const success = await this.utils.createCustomAlert({
        type: 'success',
        header: 'Berhasil',
        message: 'Data berhasil diubah, silahkan periksa kembali data tersebut.',
        buttons: [
          {
            text: 'Tutup',
            handler: () => success.dismiss()
          }
        ]
      });
      await success.present();
    } catch (err) {
      console.error(err);
      const error = await this.utils.createCustomAlert({
        type: 'error',
        header: 'Kesalahan',
        message: this.http.getErrorMessage(err),
        buttons: [
          {
            text: 'Tutup',
            handler: () => error.dismiss()
          }
        ]
      });
      await error.present();
    } finally {
      await loader.dismiss();
      await modal.dismiss();
      this.showDataOffline();
    }
  }

  private async getPicture() {
    const file = await this.media.getPictureBase64();

    if (file) {
      const attachment = {
        name: `${Date.now()}.${file.format}`,
        type: `image/${file.format}`,
        filePath: `data:image/${file.format};base64,${file.base64String}`,
      };

      this.updatePictures(attachment);
    }
  }

  private async getPictureBySource(source: PictureSource) {
    const media = await this.media.getPictureBySource(source);
    const file = media.files[0];

    if (file.path) {
      const attachment = {
        name: file.name,
        type: file.mimeType,
        filePath: `data:${file.mimeType};base64,${file.data}`,
      };

      this.updatePictures(attachment);
    }
  }

  private async updatePictures(attachment) {
    const loader = await this.utils.presentLoader();

    try {
      const { uri } = await Filesystem.writeFile({
        path: `recordAssets/${attachment.name}`,
        data: attachment.filePath,
        directory: Directory.Data,
        recursive: true,
      });

      if (this.resultParam.photo?.length) {
        const primary = this.resultParam.photo.find((item) => item.assetPhotoType === 'primary');
        primary.path = Capacitor.convertFileSrc(uri);
        primary.photo = attachment.name;
      } else {
        const data = {
          assetPhotoType: 'primary',
          path: Capacitor.convertFileSrc(uri),
          photo: attachment.name,
          assetPhotoId: null,
          historyId: null,
        };

        const lastIndex = this.resultParam.photo?.length - 1;

        if (lastIndex >= 0) {
          this.resultParam.photo[lastIndex].assetPhotoType = 'media';
          this.resultParam.photo?.push(data);
        } else {
          this.resultParam.photo?.push(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      await loader.dismiss();
    }
  }

  setPrimary(arr) {
    const primary = arr?.find((item) => item.assetPhotoType === 'primary');
    return primary.path;
  }

}
