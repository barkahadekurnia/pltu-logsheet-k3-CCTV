/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AlertController, MenuController, IonModal, IonContent, NavController, ActionSheetController } from '@ionic/angular';

import { BarcodeScanner, ScanOptions, SupportedFormat } from '@capacitor-community/barcode-scanner';

import { Subscription, of } from 'rxjs';
import Viewer from 'viewerjs';
import { find, findIndex, intersectionWith, map, merge } from 'lodash';
import { map as rxjsMap, tap } from 'rxjs/operators';

import { UtilsService } from 'src/app/services/utils/utils.service';
import { HttpService } from 'src/app/services/http/http.service';
import { environment } from 'src/environments/environment';
import { AssetDetails, AssetFormDetails, TypeForm } from 'src/app/interfaces/asset-details';
import { DatabaseService } from 'src/app/services/database/database.service';
import { MediaService, PictureSource } from 'src/app/services/media/media.service';
import { Capacitor } from '@capacitor/core';

type NfcStatus = 'NO_NFC' | 'NFC_DISABLED' | 'NO_NFC_OR_NFC_DISABLED' | 'NFC_OK';

@Component({
  selector: 'app-asset-detail',
  templateUrl: './asset-detail.page.html',
  styleUrls: ['./asset-detail.page.scss'],
})

export class AssetDetailPage implements OnInit, AfterViewInit {
  @ViewChild(IonContent, { static: true }) ionContent?: IonContent;
  @ViewChild('swiper') swiper: ElementRef | undefined;

  @ViewChild(IonModal) modal: IonModal;

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
  dataFormDetailLocation: any;
  selectionUnit: any;
  selectionArea: any;
  selectionAreaKosong = false;
  idArea: any;
  selectionTandaPemasangan: any;
  selectionLokasiTandaPemasangan: any;
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController,
    public utils: UtilsService,
    private menuCtrl: MenuController,
    private http: HttpService,
    private navCtrl: NavController,
    private database: DatabaseService,
    private actionSheetCtrl: ActionSheetController,
    private media: MediaService,
  ) {
    this.nfcStatus = 'NO_NFC';
    this.dataFormDetailAsset = [];

    this.isBeginning = true;
  }

  async ngOnInit() {
    let transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );
    
    const splitData = transitionData.data.split("/")
    transitionData.data = splitData[7]

    this.transitionData = transitionData
      
    console.log('transition data', this.transitionData);
    if (!this.transitionData) {
      return this.utils.back();
    }
    this.checkOnly = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('checkOnly')
    );
    if (!this.checkOnly) {
      this.scanQrButton = {
        text: 'Scan with QR Code',
        icon: 'qr-code-outline',
        handler: () => this.scanQrCode()
      };
    };
    this.showDataOffline();
  }

  // async checkStatus() {
  //   if (this.platform.is('capacitor')) {
  //     try {
  //       this.nfcStatus = await this.nfc1.enabled();
  //     } catch (error) {
  //       this.nfcStatus = error;
  //     }
  //   }

  //   return this.nfcStatus;
  // }

  async ngAfterViewInit() {
    //await this.nfc.changesetup();
  }

  async ionViewWillEnter() {
    this.menuCtrl.enable(true, 'asset-information')
      .then(() => this.menuCtrl.swipeGesture(true, 'asset-information'));
  }

  async ionViewWillLeave() {
    // this.nfc.invalidateTagListener();
    // this.subscription?.unsubscribe?.();

    await this.menuCtrl.enable(false, 'asset-information');
    await this.menuCtrl.swipeGesture(false, 'asset-information');
  }

  doRefresh(e: any) {
    this.showDataOffline().finally(() => {
      setTimeout(() => e.target.complete(), 100);
    });
  }

  cancel() {
    // this.modal.dismiss(null, 'cancel');
    this.navCtrl.pop();
  }

  async showDetails() {
    // this.shared.asset = asset;
    await this.menuCtrl.enable(true, 'asset-information');
    return this.menuCtrl.open('asset-information');
  }

  scanQrCode() {
    BarcodeScanner.hideBackground();
    document.body.classList.add('qrscanner');

    const options: ScanOptions = {
      targetedFormats: [SupportedFormat.QR_CODE]
    };

    BarcodeScanner.startScan(options).then(async result => {
      this.utils.overrideBackButton();
      document.body.classList.remove('qrscanner');

      if (result.hasContent) {
        const key = 'assetId=';
        const startIndex = result.content.indexOf(key) + key.length;

        const assetId = result.content;
        const data = JSON.stringify({
          type: 'qr',
          data: assetId
        });

        this.router.navigate(['scan-form', { data }]);
      }
    });

    this.utils.overrideBackButton(() => {
      this.utils.overrideBackButton();
      document.body.classList.remove('qrscanner');
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
    });
  }
  // private async setupNfc() {
  //   await this.nfc.checkStatus();
  //   console.log('cek status', this.checkOnly);

  //   await this.nfc.setTagListener(async (event: any) => {
  //     // console.log('cek event', event);
  //     console.log('checkOnly', this.checkOnly);
  //     console.log('tag', event?.tag?.id);
  //     if (this.checkOnly && event?.tag?.id) {
  //       const data = await this.nfc.getTagString(event.tag.id);

  //       const alert = await this.alertCtrl.create({
  //         header: 'Result',
  //         message: data,
  //         mode: 'ios',
  //         cssClass: 'dark:ion-bg-gray-800',
  //         buttons: [
  //           {
  //             text: 'Cancel',
  //             role: 'cancel'
  //           },
  //           {
  //             text: 'Copy',
  //             handler: () => {
  //               Clipboard.write({
  //                 // eslint-disable-next-line id-blacklist
  //                 string: data
  //               });
  //             }
  //           }
  //         ]
  //       });

  //       this.utils.back();
  //       alert.present();
  //     } else if (event?.tag?.id) {
  //       const data = JSON.stringify({
  //         type: 'rfid',
  //         data: await this.nfc.getTagString(event.tag.id)
  //       });

  //       // this.router.navigate(['scan-form', { data }]);
  //     }
  //   });
  // }

  async showDataOffline() {
    try {
      console.log('transition data', this.transitionData);

      const result = await this.database.select('assetsCCTV', {
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

      const parsedAssets = this.database.parseResult(result);
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
          }));

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

  async editDetailFoto() {

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

  async getDataInputForms() {
    const loader = await this.utils.presentLoader();

    try {
      const result = await this.database.select('formAssetsCategory', {
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

      const parsedFormAssetsCategory = this.database.parseResult(result);
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

      console.log('result param category id', this.resultParam.more.category?.id);

      // console.log("formAssetsCategory on SQL Lite",parsedFormAssetsCategory)
      // console.log("formAssetsCategory on SQL Lite assetFormCategoryAll",assetFormCategoryAllSQL)

      const bodyformAssetDetail = this.resultParam;

      //console.log('isi dari result api online bodyformAssetCategory',bodyformAssetCategory)
      console.log('isi dari result api online bodyformAssetDetail', bodyformAssetDetail);
      console.log('isi dari result api online assetFormCategoryAllSQL', assetFormCategoryAllSQL);
      //const mappedArray: AssetFormDetails[] = map(bodyformAssetCategory, (form, idx) => {
      const mappedArray: any[] = map(assetFormCategoryAllSQL, (form, idx) => {
        const resultX = intersectionWith(
          this.utils.parseJson(form?.formOption),
          this.resultParam.assetForm,
          (a: any, b: any) => a?.id === b?.formValue
        );

        console.log('isi dari result api online', resultX);

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
        console.log('formValue', formValue);
        const response = await this.http.getAnyData(`${environment.url.formType}/${formValue}`);

        if (![200, 201].includes(response.status)) {
          throw response;
        }

        const bodyResponse = response.data?.data;
        dataFormTypeAsset = bodyResponse;

        console.log('bodyResponse formType', bodyResponse);
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
          value: null,
          disabled: false,
        };

        // const idxDataMerk = mappedArray?.findIndex((obj: any) => obj.formName === 'merk');
        const idxDataMerk = findIndex(mappedArray, (obj: any) => obj.idx?.includes('2'));
        console.log('idxDataMerk', idxDataMerk);

        //idxDataMerk = 1;
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
      const sortFormDetailAsset: any = (this.dataFormDetailAsset as any).sort((s1, s2) => {
        console.log('s1', s1.idx);
        console.log('s2', s2.idx);
        return s1.idx - s2.idx;
      });

      // const sortFormDetailAsset = this.dataFormDetailAsset.sort()

      console.log('sortFormDetailAsset', sortFormDetailAsset);
      console.log('dataFormDetailAsset', this.dataFormDetailAsset);
    }

    catch (err) {
      console.error(err);
    } finally {
      await loader.dismiss();
    }

    // this.http.requests({
    //   requests: [
    //     () => this.http.getAnyData(`${environment.url.formAssetCategory}/${this.resultParam.more.category?.id}`),
    //     () => this.http.getAnyData(`${environment.url.assetsdetail}/${this.resultParam?.id}`),
    //   ],
    //   onSuccess: async (responses) => {
    //     const [
    //       responseAssetCategory,
    //       responseAssetDetail,
    //     ] = responses;

    //     if (![200, 201].includes(responseAssetCategory.status)) {
    //       throw responseAssetCategory;
    //     }
    //     if (![200, 201].includes(responseAssetDetail.status)) {
    //       throw responseAssetDetail;
    //     }

    //     //const bodyformAssetCategory = responseAssetCategory.data?.data;
    //    // const bodyformAssetDetail = responseAssetDetail.data?.data;
    //     const bodyformAssetDetail = this.resultParam


    //     //console.log('isi dari result api online bodyformAssetCategory',bodyformAssetCategory)
    //     console.log('isi dari result api online bodyformAssetDetail',bodyformAssetDetail)
    //     console.log('isi dari result api online assetFormCategoryAllSQL',assetFormCategoryAllSQL)
    //     //const mappedArray: AssetFormDetails[] = map(bodyformAssetCategory, (form, idx) => {
    //     const mappedArray: AssetFormDetails[] = map(assetFormCategoryAllSQL, (form, idx) => {
    //       const result = intersectionWith(
    //         this.utils.parseJson(form?.formOption),
    //         this.resultParam.assetForm,
    //         (a: any, b: any) => a?.id === b?.formValue
    //       );

    //       console.log('isi dari result api online',result)

    //       return {
    //         ...form,
    //         formOption: this.utils.parseJson(form?.formOption),
    //         selected: result.length ? true : false,
    //         value: result[0].id,
    //         assetFormId: bodyformAssetDetail.assetForm[idx]?.id,
    //         disabled: (form.assetCategoryCode === 'PH' && (form.formName === 'kapasitas')) ? true :
    //           (form.assetCategoryCode === 'HB' && (form.formName === 'tipekonektor')) ? true :
    //             (form.assetCategoryCode === 'DV' && (form.formName === 'diameter' || form.formName === 'jenis')) ? true :
    //               (form.assetCategoryCode === 'FT' && (form.formName === 'kapasitas' || form.formName === 'jenis')) ? true :
    //                 (form.assetCategoryCode === 'PH' && (form.formName === 'merk' || form.formName === 'tipekonektor')) ? true :
    //                   (form.assetCategoryCode === 'AP' && (form.formName === 'merk' || form.formName === 'kapasitas')) ? true : false
    //       };
    //     });

    //     const initData = mappedArray?.filter?.(
    //       (item) =>
    //         item.assetCategoryCode === 'PH' && item.formName === 'jenis' ||
    //         item.assetCategoryCode === 'HB' && item.formName === 'jenis' ||
    //         item?.assetCategoryCode === 'DV' && item?.formName === 'merk' ||
    //         item.assetCategoryCode === 'FT' && item.formName === 'merk' ||
    //         item.assetCategoryCode === 'PTD' && item.formName === 'jenis' ||
    //         item.assetCategoryCode === 'AP' && item.formName === 'media'
    //     );

    //     let dataFormTypeAsset: TypeForm[] = [];

    //     if (mappedArray.length && initData.length && bodyformAssetDetail) {
    //       const formId = initData[0].value;
    //       console.log('formId',formId)
    //       const response = await this.http.getAnyData(`${environment.url.formType}/${formId}`);

    //       if (![200, 201].includes(response.status)) {
    //         throw response;
    //       }

    //       const bodyResponse = response.data?.data;
    //       dataFormTypeAsset = bodyResponse;

    //       const mappedAssetDetail: AssetFormDetails = {
    //         assetCategoryCode: null,
    //         assetCategoryId: null,
    //         assetCategoryName: null,
    //         created_at: null,
    //         deleted_at: null,
    //         formId: bodyformAssetDetail.id,
    //         formLabel: 'Type',
    //         formName: 'type',
    //         formOption: dataFormTypeAsset,
    //         formType: 'select',
    //         index: (mappedArray.length + 1)?.toString(),
    //         selected: typeof bodyformAssetDetail.more?.type === 'object' ? true : false,
    //         updated_at: null,
    //         value: null,
    //         disabled: false,
    //       };

    //       // const idxDataMerk = mappedArray?.findIndex((obj: any) => obj.formName === 'merk');
    //       let idxDataMerk = findIndex(mappedArray, (obj:any) => obj.idx?.includes('2'));
    //       console.log('idxDataMerk',idxDataMerk);

    //       //idxDataMerk = 1 ;
    //       // add object (mappedAssetDetail) to index (idxDataMerk) of array (mappedArray)
    //       of(mappedArray)
    //         .pipe(
    //           rxjsMap(arr => [...arr.slice(0, idxDataMerk), mappedAssetDetail, ...arr.slice(1)]),
    //           tap(updatedArray => {
    //             mappedArray.length = 0;
    //             Array.prototype.push.apply(mappedArray, updatedArray);
    //           })
    //         ).subscribe();
    //     }

    //     this.dataFormDetailAsset = mappedArray;
    //     console.log('dataFormDetailAsset', this.dataFormDetailAsset);
    //   },
    //   onError: (err) => {
    //     console.error(err);
    //   },
    //   onComplete: async () => await loader.dismiss()
    // });
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
      console.log('resultUnit', resultUnit);
      console.log('parsedUnit', parsedUnit);

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
      console.log('resultArea', resultArea);
      console.log('parsedArea', parsedArea);

      this.databaseArea = parsedArea;

      this.selectionUnit = parsedUnit;
      this.selectionArea = parsedArea;

      this.dataFormDetailLocation = this.resultParam.more.tag[0];

      console.log('dataFormDetailLocation', this.dataFormDetailLocation);
      console.log('selection unit', this.selectionUnit);
    } catch (err) {
      console.log('error', err);
    } finally {
      await loader.dismiss();
    }

    // this.http.requests({
    //   requests: [
    //     // () => this.http.getAnyData(`${environment.url.allTandaPemasangan}`),
    //     () => this.http.getAnyData(`${environment.url.assetsdetail}/${this.resultParam?.id}`),
    //     () => this.http.getAnyData(`${environment.url.selectionUnit}`),
    //     () => this.http.getAnyData(`${environment.url.selectionArea}`),
    //     //() => this.http.getAnyData(`${environment.url.selectionTandaPemasangan}${this.dataFormDetailLocation.unitId}`)

    //   ],
    //   onSuccess: async (responses) => {
    //     const [
    //       // responseAllTP,
    //       responseAssetDetail,
    //       responseunitDetail,
    //       responseunitArea,
    //       responseTandaPemasangan,
    //     ] = responses;

    //     if (![200, 201].includes(responseAssetDetail.status)) {
    //       throw responseAssetDetail;
    //     }

    //     if (![200, 201].includes(responseunitDetail.status)) {
    //       throw responseunitDetail;
    //     }

    //     if (![200, 201].includes(responseunitArea.status)) {
    //       throw responseunitArea;
    //     }

    //     // if (![200, 201].includes(responseAllTP.status)) {
    //     //   throw responseAllTP;
    //     // }

    //     // if (![200, 201].includes(responseTandaPemasangan.status)) {
    //     //   throw responseTandaPemasangan;
    //     // }

    //     console.log('responseunitArea', responseunitArea);
    //     // console.log('responseunitAllTP' , responseAllTP)

    //     console.log('responseunitAssetDetail', responseAssetDetail)

    //     const bodyformAssetDetail = responseAssetDetail.data?.data;

    //     //unit
    //     this.selectionUnit = responseunitDetail.data.responds.results;

    //     console.log('selection unit', this.selectionUnit);

    //     this.dataFormDetailLocation = bodyformAssetDetail.more.tag[0];
    //     console.log('dataFormDetailLocation', this.dataFormDetailLocation);

    //     //area
    //     this.selectionArea = responseunitArea.data.responds.results;

    //     console.log('selection unit', this.selectionUnit);



    //     this.http.requests({
    //       requests: [
    //         () => this.http.getAnyData(`${environment.url.selectionTandaPemasangan}${this.dataFormDetailLocation.areaId}`)
    //       ],
    //       onSuccess: async (responses) => {
    //         const [
    //           responseTandaPemasangan,
    //         ] = responses;
    //         if (![200, 201].includes(responseTandaPemasangan.status)) {
    //           throw responseTandaPemasangan;
    //         }

    //         console.log('response tanda pemasangan', responseTandaPemasangan)
    //         //TP
    //         // this.selectionTandaPemasangan = responseAllTP.data.data;
    //         this.selectionTandaPemasangan = responseTandaPemasangan.data.data;

    //         console.log('selection Tanda Pemasangan 1', this.selectionTandaPemasangan)

    //         this.selectionTandaPemasanganKosong = false

    //         console.log('selection Area', this.selectionTandaPemasangan)
    //         if (this.selectionTandaPemasangan.length === 0) {
    //           this.selectionTandaPemasanganKosong = true
    //         }

    //         this.idTandaPemasangan = this.dataFormDetailLocation.tag_number
    //         console.log('id tanda pemasangan', this.idTandaPemasangan)
    //         this.idArea = this.dataFormDetailLocation.areaId
    //         // cari lokasi berdasarkan TP
    //         const lokasi = responseTandaPemasangan.data.data.find((el) => el.tag_number === this.idTandaPemasangan)

    //         console.log('lokasi', lokasi)

    //         this.selectionLokasiTandaPemasangan = lokasi

    //         //simpat data lokasi sementara buat logic if else update
    //         this.currentDetailLokasi = this.selectionLokasiTandaPemasangan.detail_location;
    //         this.currentTandaPemasangan = this.idTandaPemasangan;
    //       }
    //     })
    //   },
    //   onError: (err) => {
    //     console.error(err);
    //   },
    //   onComplete: async () => await loader.dismiss()
    // });
  }

  // filterselectionArea(unitId:any) {
  //     return this.databaseArea.id = unitId

  // }

  async getSelectionArea(event: any) {
    // const loader = await this.utils.presentLoader();
    const unitId = event.detail.value;
    const selectionArea: any = [];

    try {
      console.log('unit ID', unitId);
      console.log('this.databaseArea', this.databaseArea);

      for (const data of this.databaseArea) {
        if (data.idUnit === unitId) {
          selectionArea.push(data);
        }
      }

      console.log('get selection Area', selectionArea);
      this.selectionArea = selectionArea;

      if (unitId === '4') {
        this.selectionArea = this.databaseArea;
      }
      this.selectionAreaKosong = false;

      if (this.selectionArea?.length === 0) {
        this.selectionAreaKosong = true;
      }
    } catch (err) {
      console.log('error selection Area', err);
    } finally {
      console.log('done select area');
      //async () => loader.dismiss()
    }

    // const request:any = this.database.select('area', {
    //   column: [
    //     'id ',
    //     'area ',
    //     'kode ',
    //     'deskripsi ',
    //     'updated_at '
    //   ],
    //   where:  {
    //     query : 'id=?' ,
    //     params : [unitId]
    //   }
    // })


    // const parsedRequest = this.database.parseResult(request)

    // console.log('parsed request responseAreaDetail',parsedRequest)


    // console.log('isi request selection unit', request)
    // if(request) {
    //   const parsedRequest = this.database.parseResult(request)

    //   console.log('parsed request responseAreaDetail',parsedRequest)

    //}

    // this.http.requests({
    //   requests: [
    //     () => this.http.getAnyData(`${environment.url.selectionArea}/${unitId}`)
    //   ],
    //   onSuccess: async (responses) => {
    //     const [
    //       responseAreaDetail
    //     ] = responses;

    //     if (![200, 201].includes(responseAreaDetail.status)) {
    //       throw responseAreaDetail;
    //     }

    //     this.selectionArea = responseAreaDetail.data.responds.results;
    //     this.selectionAreaKosong = false

    //     console.log('selection Area http', this.selectionArea)
    //     if (this.selectionArea.length === 0) {
    //       this.selectionAreaKosong = true
    //     }
    //   },
    //   onError: (err) => {
    //     console.error(err);
    //   },
    //   onComplete: async () => await loader.dismiss()
    // });
  }

  async getSelectionTandaPemasangan(event: any) {
    console.log('isi event', event);
    console.log('isi event value', event.detail.value);
    this.idArea = event.detail.value;

    console.log('this id area get selection tanda pemasangan', this.idArea);
    const loader = await this.utils.presentLoader();
    //let  unitId = event.detail.value

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
          params: [this.idArea]
        },
      });

      console.log('data selectionTandaPemasangan', selectionTandaPemasangan);
      const parsedSelectionTandaPemasangan = this.database.parseResult(selectionTandaPemasangan);

      console.log('data parsed Selection Tanda Pemasangan', parsedSelectionTandaPemasangan);

      const selectionTandaPemasanganAll: any = parsedSelectionTandaPemasangan?.map(
        (asset: any) => ({
          id: asset.id,
          idArea: asset.idArea,
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

      console.log('data parsed selectionTandaPemasanganAll', selectionTandaPemasanganAll);

      this.selectionTandaPemasangan = selectionTandaPemasanganAll;

      console.log('selection Tanda Pemasangan', this.selectionTandaPemasangan);

      this.selectionTandaPemasanganKosong = false;

      console.log('selection Area', this.selectionTandaPemasangan);
      if (this.selectionTandaPemasangan.length === 0) {
        this.selectionTandaPemasanganKosong = true;
      }

    } catch (err) {
      console.log('error pada saat pengambilan selectionTandaPemasangan', err);
    } finally {
      await loader.dismiss();
    }

    // this.http.requests({
    //   requests: [
    //     () => this.http.getAnyData(`${environment.url.selectionTandaPemasangan}${this.idArea}`)
    //   ],
    //   onSuccess: async (responses) => {
    //     const [
    //       responseTandaPemasangan
    //     ] = responses;

    //     if (![200, 201].includes(responseTandaPemasangan.status)) {
    //       throw responseTandaPemasangan;
    //     }

    //     this.selectionTandaPemasangan = responseTandaPemasangan.data.data;

    //     console.log('selection Tanda Pemasangan', this.selectionTandaPemasangan)

    //     this.selectionTandaPemasanganKosong = false

    //     console.log('selection Area', this.selectionTandaPemasangan)
    //     if (this.selectionTandaPemasangan.length === 0) {
    //       this.selectionTandaPemasanganKosong = true
    //     }

    //   },
    //   onError: (err) => {
    //     console.error(err);
    //   },
    //   onComplete: async () => await loader.dismiss()
    // });
  }

  async getSelectionIdTandaPemasangan(event: any) {
    // console.log('isi event',event)
    console.log('id Tanda Pemasangan', event.detail.value)
    this.idTandaPemasangan = event.detail.value
    console.log('this. id area', this.idArea)
    const loader = await this.utils.presentLoader();
    //let  unitId = event.detail.value

    try {
      console.log('respon tanda TandaPemasangan', this.selectionTandaPemasangan)

      const lokasi = this.selectionTandaPemasangan.find((el) => el.tag_number == this.idTandaPemasangan)

      console.log('lokasi', lokasi)

      this.selectionLokasiTandaPemasangan = lokasi
    } catch (err) {
      console.log('error', err)
    } finally {

      await loader.dismiss()
    }

    // this.http.requests({
    //   requests: [
    //     () => this.http.getAnyData(`${environment.url.selectionTandaPemasangan}${this.idArea}`)
    //   ],
    //   onSuccess: async (responses) => {
    //     const [
    //       responseTandaPemasangan
    //     ] = responses;

    //     if (![200, 201].includes(responseTandaPemasangan.status)) {
    //       throw responseTandaPemasangan;
    //     }

    //     console.log('2 respon tanda TandaPemasangan', responseTandaPemasangan.data.data)
    //     const lokasi = responseTandaPemasangan.data.data.find((el) => el.tag_number === this.idTandaPemasangan)

    //     console.log('2  lokasi', lokasi)

    //     this.selectionLokasiTandaPemasangan = lokasi

    //   },
    //   onError: (err) => {
    //     console.error(err);
    //   },
    //   onComplete: async () => await loader.dismiss()
    // });
  }


  async fetchFormType(ev) {
    if (!ev) {
      return null;
    }

    console.log('fetchFormType', ev);


    const loader = await this.utils.presentLoader();
    const formValue = ev.detail?.value;

    try {
      const response = await this.http.getAnyData(`${environment.url.formType}/${formValue}`);

      if (![200, 201].includes(response.status)) {
        throw response;
      }

      const bodyFormType = response.data?.data;
      console.log('bodyFormType', bodyFormType);

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

  async confirmSubmitForm() {
    const alert = await this.utils.createCustomAlert({
      type: 'warning',
      header: 'Konfirmasi',
      message: `Apakah Anda yakin untuk mengubah data nomor asset ${this.resultParam.asset_number} ?`,
      buttons: [
        {
          text: 'Konfirmasi',
          handler: () => {
            alert.dismiss();
            this.submitFormUpdate();
          }
        }, {
          text: 'Batal',
          handler: () => alert.dismiss()
        }
      ]
    });

    await alert.present();
  }

  async submitFoto(modal?: IonModal) {
    console.log('submit Foto');
    await modal.dismiss();
  }

  async submitFormUpdate(modal?: IonModal) {
    const loader = await this.utils.presentLoader();
    const body = new FormData();

    const dataFormType = this.dataFormDetailAsset?.filter(item => item.formName === 'type');

    try {
      const dataExcludeFormType = this.dataFormDetailAsset
        ?.filter(item => item.formName !== 'type')
        ?.map((obj) => {
          if (obj.assetCategoryCode && obj.formId) {
            const { disabled, selected, value, ...rest } = obj;
            return { ...rest, formValue: obj.value, formOption: JSON.stringify(obj.formOption) };
          } else {
            throw new Error('Data yang Anda masukkan tidak valid, silahkan dicoba kembali.');
          }
        });

      console.log('data formtype', dataFormType);

      if (dataFormType[0].value) {
        body.append('typeId', dataFormType[0].value);
      } else {
        throw new Error('Data yang Anda masukkan tidak valid, silahkan dicoba kembali.');
      }

      body.append('assetForm', JSON.stringify(dataExcludeFormType));

      const response = await this.http.postAnyData(`${environment.url.uploadFormType}/${this.resultParam.id}`, body);

      if (![200, 201].includes(response.status)) {
        throw response;
      }

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
    }
  }

  async submitFormUpdateLocation(modal?: IonModal) {
    // const loader = await this.utils.presentLoader();
    // const body = new FormData();

    console.log('isi dari form', this.dataFormDetailLocation);
    console.log('tanda pemasangan', this.dataFormDetailLocation.tag_number);
    const dataTandaPemasangan = this.selectionTandaPemasangan.find((el) => el.tag_number === this.dataFormDetailLocation.tag_number);
    console.log('id tanda pemasangan', dataTandaPemasangan);

    // const idTandaPemasangan = JSON.stringify(dataTandaPemasangan.id);
    const idTandaPemasangan = dataTandaPemasangan.id;
    console.log('idTandaPemasnagan', idTandaPemasangan);

    console.log('isi dari detail lokasi', this.selectionLokasiTandaPemasangan.detail_location);
    console.log('asset id  ', this.assetId);

    try {
      if (this.currentTandaPemasangan !== idTandaPemasangan) {
        const body = {
          tagId: idTandaPemasangan
        };
        //ini buat edit asset tag
        const response = await this.http.postAnyDataJson(`${environment.url.updateAssetTag}/${this.assetId}`, body);

        if (![200, 201].includes(response.status)) {
          throw response;
        }
      }

      if (this.currentDetailLokasi !== this.selectionLokasiTandaPemasangan.detail_location) {
        const body = {
          detailLocation: this.selectionLokasiTandaPemasangan.detail_location
        };
        //ini buat edit detail lokasi
        const responseDetailLokasi = await this.http.uploadDetailLocation(idTandaPemasangan, body);

        if (![200, 201].includes(responseDetailLokasi.status)) {
          throw responseDetailLokasi;
        }
      }

      //   const alert = await this.utils.createCustomAlert({
      //     type: 'success',
      //     color: 'success',
      //     header: 'Update Detail Lokasi Berhasil',
      //     message: `${(response.data as any)?.message}. Perubahan efektif terjadi setelah dilakukan sinkronisasi.`,
      //     backdropDismiss: false,
      //     buttons: [
      //       {
      //         text: 'Tutup',
      //         handler: () => alert.dismiss()
      //       }
      //     ]
      //   });

      //   await alert.present();
      // } catch (err) {
      //   console.error(err);
      //   const alert = await this.utils.createCustomAlert({
      //     type: 'error',
      //     color: 'danger',
      //     header: 'Kesalahan',
      //     message: this.http.getErrorMessage(err),
      //     backdropDismiss: false,
      //     buttons: [
      //       {
      //         text: 'Tutup',
      //         handler: () => alert.dismiss()
      //       }
      //     ]
      //   });

      //   await alert.present();
      // } finally {

      //   await modal.dismiss();
      // }

      console.log('mengupdate data assetTag');
      const success = await this.utils.createCustomAlert({
        type: 'success',
        header: 'Berhasil',
        message: 'Data berhasil diubah, silahkan periksa kembali data tersebut.',
        buttons: [
          {
            text: 'Tutup',
            handler: () => success.dismiss()
            // handler: () => modal.dismiss()
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
      await modal.dismiss();
      this.doRefresh(event);
    }
  }

  //gakpke file lama pnya hamjah
  async editDetailLocation() {
    const alert = await this.alertCtrl.create({
      header: 'Form Edit',
      message: 'Edit detail lokasi',
      backdropDismiss: false,
      mode: 'ios',
      inputs: [
        {
          type: 'textarea',
          label: 'Detail lokasi',
          value: this.resultParam.more.tag[0].detail_location,
          placeholder: 'Isikan detail lokasi baru...'
        }
      ],
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          handler: () => alert.dismiss()
        }, {
          text: 'Submit',
          handler: (res) => {
            this.putDetailLocation(this.resultParam?.more?.tag[0].id, {
              detailLocation: res['0']
            });
          }
        }
      ]
    });
    await alert.present();
  }
  //gakepke file lama pnya hamjah
  private async putDetailLocation(tagId, body) {
    try {
      const response = await this.http.uploadDetailLocation(tagId, body);

      if (![200, 201].includes(response.status)) {
        throw response;
      }

      const alert = await this.utils.createCustomAlert({
        type: 'success',
        color: 'success',
        header: 'Update Berhasil',
        message: `${(response.data as any)?.message}. Perubahan efektif terjadi setelah dilakukan sinkronisasi.`,
        backdropDismiss: false,
        buttons: [
          {
            text: 'Tutup',
            handler: () => alert.dismiss()
          }
        ]
      });

      await alert.present();
    } catch (err) {
      console.error(err);
      const alert = await this.utils.createCustomAlert({
        type: 'error',
        color: 'danger',
        header: 'Kesalahan',
        message: this.http.getErrorMessage(err),
        backdropDismiss: false,
        buttons: [
          {
            text: 'Tutup',
            handler: () => alert.dismiss()
          }
        ]
      });

      await alert.present();
    }
  }

  editRFID() {
    const data = JSON.stringify({
      type: 'qr',
      data: this.assetId
    });
    this.router.navigate(['change-rfid', { data }]);
  }

  private async getPicture() {
    const filePath = await this.media.getPicture();

    if (filePath) {
      const attachment = {
        name: filePath?.split?.('/')?.pop?.(),
        type: 'image/jpeg',
        filePath,
      };

      console.log('attachment', attachment);
      this.resultParam.photo[0].path = Capacitor.convertFileSrc(attachment.filePath);
    }
  }

  private async getPictureBySource(source: PictureSource) {
    const result = await this.media.getPictureBySource(source);
    const file = result.files[0];

    if (file.path) {
      const attachment = {
        name: file.name,
        type: file.mimeType,
        filePath: file.path,
      };

      console.log('attachment', attachment);
      this.resultParam.photo[0].path = Capacitor.convertFileSrc(attachment.filePath);
    }
  }

  private async updatePictures() {
    
    try {
      
    } catch (err) {
      console.error(err);
    }
  }

}
