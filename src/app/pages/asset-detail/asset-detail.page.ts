/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MenuController, IonModal, IonContent, ActionSheetController, IonPopover } from '@ionic/angular';

import { Subscription, of } from 'rxjs';
import Viewer from 'viewerjs';
import { filter, find, findIndex, flow, intersectionWith, map, merge, partialRight, property, result, some } from 'lodash';
import { map as rxjsMap, tap } from 'rxjs/operators';

import { UtilsService } from 'src/app/services/utils/utils.service';
import { HttpService } from 'src/app/services/http/http.service';
import { environment } from 'src/environments/environment';
import { AssetDetails, AssetFormDetails, DetailAssetTags, TypeForm } from 'src/app/interfaces/asset-details';
import { DatabaseService } from 'src/app/services/database/database.service';
import { MediaService, PictureSource } from 'src/app/services/media/media.service';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

type NfcStatus = 'NO_NFC' | 'NFC_DISABLED' | 'NO_NFC_OR_NFC_DISABLED' | 'NFC_OK';


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

  subscription: Subscription;

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

  resultParam: AssetDetails;

  nfcStatus: NfcStatus;

  slideOpts = {
    initialSlide: 1,
    speed: 400,
  };

  dataFormDetailAsset: AssetFormDetails[];
  dataFormDetailLocation: DetailAssetTags;
  selectionUnit: any[] = [];
  selectionArea: any[] = [];
  selectionAreaKosong = false;
  areaId: any;
  selectionTandaPemasangan: any[] = [];
  selectionTandaPemasanganKosong = false;
  idTandaPemasangan: any;
  currentDetailLokasi: any;
  currentTandaPemasangan: any;

  public isBeginning = true;
  public slides?: string[];
  public currentSlide?: string;
  public isEnd: boolean;
  public indexSlide: any;
  public buttonChecked: boolean;
  private assetId: any;
  public databaseArea: any;

  isOpen = false;
  searchTerm = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    public utils: UtilsService,
    private menuCtrl: MenuController,
    private http: HttpService,
    private database: DatabaseService,
    private actionSheetCtrl: ActionSheetController,
    private media: MediaService,
  ) {
    this.nfcStatus = 'NO_NFC';
    this.dataFormDetailAsset = [];
    this.isBeginning = true;
  }

  async ngOnInit() {
    this.transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );

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
    try {
      console.log('transition data', this.transitionData);

      const resAssets = await this.database.select('assetsCCTV', {
        column: [
          'assetId',
          'assetForm',
          'assetNumber',
          'expireDate',
          'more',
          'photo',
          'supplyDate',
          'cctvIP'
        ],
        where: {
          query: 'assetId=?',
          params: [this.transitionData.data]
        },
      });

      const parsedAssets = this.database.parseResult(resAssets);
      const arrAssetAll: AssetDetails[] = parsedAssets
        ?.map(
          (asset: any) => ({
            id: asset.assetId,
            assetForm: this.utils.parseJson(asset.assetForm),
            asset_number: asset.assetNumber,
            expireDate: asset.expireDate,
            more: this.utils.parseJson(asset.more),
            photo: this.utils.parseJson(asset.photo),
            supply_date: asset.supplyDate,
            cctvIP: asset.cctvIP,
          })
        );

      console.log('parsed result arr AssetAll', parsedAssets);
      console.log('arrAssetAll', arrAssetAll);

      this.resultParam = arrAssetAll[0];
      console.log('this result param', this.resultParam);

      // simpen asset id
      if (arrAssetAll.length >= 1) {
        this.assetId = arrAssetAll[0].id;
      }
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

  getDataEditForms() {
    this.getDataInputForms();
    this.getDataLokasi();
  }

  async getDataInputForms() {
    const loader = await this.utils.presentLoader();

    try {
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
      const assetFormCategoryAllSQL: any[] = [];

      for (const asset of parsedFormAssetsCategory) {
        const data = {
          formId: asset.formId,
          idx: asset.idx,
          formLabel: asset.formLabel,
          formName: asset.formName,
          formType: asset.formType,
          formOption: JSON.parse(asset.formOption),
          assetCategoryId: asset.assetCategoryId,
          assetCategoryCode: asset.assetCategoryCode,
          assetCategoryName: asset.assetCategoryName,
          created_at: asset.created_at,
          updated_at: asset.updated_at,
          deleted_at: asset.deleted_at,
        };
        assetFormCategoryAllSQL.push(data);
      }

      const bodyformAssetDetail = this.resultParam;

      let mappedArray: any[] = map(assetFormCategoryAllSQL, (form, idx) => {
        const resultX = intersectionWith(
          this.utils.parseJson(form?.formOption),
          this.resultParam.assetForm,
          (a: any, b: any) => a?.id === b?.formValue
        );

        return {
          ...form,
          formOption: this.utils.parseJson(form?.formOption),
          selected: resultX.length ? true : false,
          value: resultX[0].id,
          assetFormId: bodyformAssetDetail.assetForm[idx]?.id,
          disabled: (form.assetCategoryCode === 'PH' && (form.formName === 'kapasitas')) ? true :
            (form.assetCategoryCode === 'HB' && (form.formName === 'tipekonektor')) ? true :
              (form.assetCategoryCode === 'DV' && (form.formName === 'diameter' || form.formName === 'jenis')) ? true :
                (form.assetCategoryCode === 'FT' && (form.formName === 'kapasitas' || form.formName === 'jenis')) ? true :
                  (form.assetCategoryCode === 'PH' && (form.formName === 'merk' || form.formName === 'tipekonektor')) ? true :
                    (form.assetCategoryCode === 'AP' && (form.formName === 'merk' || form.formName === 'kapasitas')) ? true : false
        };
      });

      const initData = mappedArray?.filter?.(
        (item) =>
          item.assetCategoryCode === 'PH' && item.formName === 'jenis' ||
          item.assetCategoryCode === 'HB' && item.formName === 'jenis' ||
          item?.assetCategoryCode === 'DV' && item?.formName === 'merk' ||
          item.assetCategoryCode === 'FT' && item.formName === 'merk' ||
          item.assetCategoryCode === 'PTD' && item.formName === 'jenis' ||
          item.assetCategoryCode === 'AP' && item.formName === 'media'
      );

      let dataFormTypeAsset: TypeForm[] = [];

      if (mappedArray.length && initData.length && bodyformAssetDetail) {
        const formValue = initData[0].value;
        const response = await this.http.getAnyData(`${environment.url.formType}/${formValue}`);

        if (![200, 201].includes(response.status)) {
          throw response;
        }

        const bodyResponse = response.data?.data;
        dataFormTypeAsset = bodyResponse;

        const mappedAssetDetail: AssetFormDetails = {
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
          index: (mappedArray.length + 1)?.toString(),
          selected: typeof bodyformAssetDetail.more?.type === 'object' ? true : false,
          updated_at: null,
          value: this.resultParam.more.type.id || null,
          disabled: false,
        };

        const idxDataMerk = findIndex(mappedArray, (obj: any) => obj.idx?.includes('2'));

        mappedArray = mappedArray.sort((a, b) => a.idx - b.idx);

        // add object (mappedAssetDetail) to index (idxDataMerk) of array (mappedArray)
        of(mappedArray)
          .pipe(
            rxjsMap(arr => [...arr.slice(0, idxDataMerk), mappedAssetDetail, ...arr.slice(1)]),
            tap(updatedArray => {
              mappedArray.length = 0;
              Array.prototype.push.apply(mappedArray, updatedArray);
            })
          ).subscribe();
      }

      this.dataFormDetailAsset = mappedArray;
    }
    catch (err) {
      console.error(err);
    } finally {
      await loader.dismiss();
    }
  }

  async getDataLokasi() {
    const loader = await this.utils.presentLoader();

    try {
      const resultUnit = await this.database.select('unit', {
        column: [
          'id',
          'unit',
          'kode',
          'deskripsi',
          'updated_at',
        ]
      });

      const parsedUnit = this.database.parseResult(resultUnit);

      const resultArea = await this.database.select('area', {
        column: [
          'id',
          'idUnit',
          'area',
          'kode',
          'deskripsi',
          'updated_at',
        ]
      });

      const parsedArea = this.database.parseResult(resultArea);

      this.databaseArea = parsedArea;

      this.selectionUnit = parsedUnit;
      this.selectionArea = parsedArea;

      this.dataFormDetailLocation = this.resultParam.more.tag[0];

      this.areaId = this.dataFormDetailLocation.areaId;
      this.idTandaPemasangan = this.dataFormDetailLocation.id;
    } catch (err) {
      console.error(err);
    } finally {
      await loader.dismiss();
      this.getSelectionTandaPemasangan();
    }
  }

  async getSelectionArea(event?: any) {
    let unitId = null;

    if (event) {
      unitId = event.detail.value;
    } else {
      unitId = this.dataFormDetailLocation.unitId;
    }

    const selectionArea: any = [];

    try {
      for (const data of this.databaseArea) {
        if (data.idUnit === unitId) {
          selectionArea.push(data);
        }
      }

      this.selectionArea = selectionArea;

      if (unitId === '4') {
        this.selectionArea = this.databaseArea;
      }
      this.selectionAreaKosong = false;

      if (this.selectionArea?.length === 0) {
        this.selectionAreaKosong = true;
      }

      console.log('selectionArea', this.selectionArea);

    } catch (err) {
      console.error(err);
    }
  }

  async getSelectionTandaPemasangan(event?: any) {
    const loader = await this.utils.presentLoader();

    if (event) {
      this.areaId = event.detail.value;
    }

    try {
      const selectionTandaPemasangan = await this.database.select('selectionTandaPemasangan', {
        column: [
          'id',
          'idArea',
          'tag_number',
          'unit',
          'area',
          'type_tag',
          'location',
          'detail_location',
          'latitude',
          'longitude',
          'tagCategory',
          'more',
          'photos',
        ],
        where: {
          query: 'idArea=?',
          params: [this.areaId]
        },
      });

      const parsedSelectionTandaPemasangan: any[] = this.database.parseResult(selectionTandaPemasangan);

      const selectionTandaPemasanganAll: any[] = parsedSelectionTandaPemasangan?.map(
        (asset: any) => ({
          id: asset.id,
          areaId: asset.idArea,
          tag_number: asset.tag_number,
          unit: asset.unit,
          area: asset.area,
          type_tag: asset.type_tag,
          location: asset.location,
          detail_location: asset.detail_location,
          latitude: asset.latitude,
          longitude: asset.longitude,
          tagCategory: asset.tagCategory,
          more: this.utils.parseJson(asset.more),
          photos: this.utils.parseJson(asset.photos),
        })
      );

      this.selectionTandaPemasangan = selectionTandaPemasanganAll;

      this.selectionTandaPemasanganKosong = false;

      if (this.selectionTandaPemasangan.length === 0) {
        this.selectionTandaPemasanganKosong = true;
      } else {
        const resArea = selectionTandaPemasanganAll.find((el) => el.areaId === this.areaId);
        this.dataFormDetailLocation.tag_number = resArea?.tag_number;
        this.dataFormDetailLocation.id = resArea?.id;
        this.idTandaPemasangan = resArea?.id;
      }
    } catch (err) {
      console.error(err);
    } finally {
      await loader.dismiss();
      this.getSelectionIdTandaPemasangan();
    }
  }

  async getSelectionIdTandaPemasangan(event?: any) {
    const loader = await this.utils.presentLoader();

    if (event) {
      this.idTandaPemasangan = event.detail.value;
    }

    try {
      const lokasi = this.selectionTandaPemasangan.find((el) => el.id === this.idTandaPemasangan);
      this.dataFormDetailLocation.location = lokasi.location;
      this.dataFormDetailLocation.detail_location = lokasi.detail_location;
    } catch (err) {
      console.error(err);
    } finally {
      await loader.dismiss();
    }
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
  }

  selectUnit(ev: Event) {
    this.popover.event = ev;
    this.getSelectionArea();
    this.isOpen = true;
    console.log('selectionUnit', this.selectionUnit);

  }

  selectItemUnit(item) {
    console.log('selectItemUnit', item);
    this.isOpen = false;
  }

  async confirmSubmitForm(modal?: IonModal) {
    const alert = await this.utils.createCustomAlert({
      type: 'warning',
      header: 'Konfirmasi',
      message: `Apakah Anda yakin untuk menyimpan data asset ${this.resultParam.asset_number} ?`,
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
      // console.log('dataFormDetailLocation', this.dataFormDetailLocation);
      // console.log('selectionArea', this.selectionArea);

      const findArea = find(this.selectionArea, { id: this.dataFormDetailLocation.areaId });
      this.dataFormDetailLocation.area = findArea.deskripsi;

      const filteredObject = find(dataFormType.formOption, { id: dataFormType.value });

      const storedType = {
        id: dataFormType.value,
        name: filteredObject.type_name,
      };

      const storedMore = {
        category: this.resultParam.more.category,
        status: this.resultParam.more.status,
        tag: [this.dataFormDetailLocation],
        tagging: this.resultParam.more.tagging,
        type: storedType,
      };

      const updatedRow = {
        assetForm: dataFormTypeToStore,
        assetNumber: this.resultParam.asset_number,
        expireDate: this.resultParam.expireDate,
        assetId: this.resultParam.id,
        more: storedMore,
        photo: this.resultParam.photo,
        supplyDate: this.resultParam.supply_date,
        cctvIP: this.resultParam.cctvIP,
      };

      console.log('updatedRow', updatedRow);

      this.database.update(
        'assetsCCTV',
        {
          assetForm: JSON.stringify(dataFormTypeToStore),
          assetNumber: this.resultParam.asset_number,
          expireDate: this.resultParam.expireDate,
          assetId: this.resultParam.id,
          more: JSON.stringify(storedMore),
          photo: JSON.stringify(this.resultParam.photo),
          supplyDate: this.resultParam.supply_date,
          cctvIP: this.resultParam.cctvIP,
        },
        {
          query: 'assetId=?',
          params: [this.resultParam.id]
        }
      );

      this.database.insert(
        'recordAssetsCCTV', [
        {
          assetForm: JSON.stringify(dataFormTypeToStore),
          assetNumber: this.resultParam.asset_number,
          expireDate: this.resultParam.expireDate,
          assetId: this.resultParam.id,
          more: JSON.stringify(storedMore),
          photo: JSON.stringify(this.resultParam.photo),
          supplyDate: this.resultParam.supply_date,
          cctvIP: this.resultParam.cctvIP,
        }
      ]
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
    try {
      const { uri } = await Filesystem.writeFile({
        path: `recordAssetsCCTV/${attachment.name}`,
        data: attachment.filePath,
        directory: Directory.Data,
        recursive: true,
      });

      if (uri) {
        this.resultParam.photo[0].path = Capacitor.convertFileSrc(uri);
        this.resultParam.photo[0].photo = attachment.name;
      }
    } catch (err) {
      console.error(err);
      await Filesystem.mkdir({
        path: 'recordAssetsCCTV',
        directory: Directory.Data,
      });
    }
  }

}
