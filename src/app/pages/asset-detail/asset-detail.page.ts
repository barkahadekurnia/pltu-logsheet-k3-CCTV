/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Platform, AlertController, MenuController, IonModal } from '@ionic/angular';

import { BarcodeScanner, ScanOptions, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { Clipboard } from '@capacitor/clipboard';
import { NFC } from '@awesome-cordova-plugins/nfc/ngx';

import { Subscription, of } from 'rxjs';
import Viewer from 'viewerjs';
import { find, findIndex, intersectionWith, map, merge } from 'lodash';
import { map as rxjsMap, tap } from 'rxjs/operators';

import { NfcService } from 'src/app/services/nfc/nfc.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { HttpService } from 'src/app/services/http/http.service';
import { environment } from 'src/environments/environment';
import { AssetDetails, AssetFormDetails, TypeForm } from 'src/app/interfaces/asset-details';

type NfcStatus = 'NO_NFC' | 'NFC_DISABLED' | 'NO_NFC_OR_NFC_DISABLED' | 'NFC_OK';

@Component({
  selector: 'app-asset-detail',
  templateUrl: './asset-detail.page.html',
  styleUrls: ['./asset-detail.page.scss'],
})
export class AssetDetailPage implements OnInit, AfterViewInit {
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private alertCtrl: AlertController,
    private nfc: NfcService,
    private utils: UtilsService,
    private nfc1: NFC,
    private menuCtrl: MenuController,
    private http: HttpService
  ) {
    this.nfcStatus = 'NO_NFC';
    this.dataFormDetailAsset = [];
  }

  async ngOnInit() {
    this.transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );

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
    this.showData();
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
  async ngAfterViewInit() {
    await this.nfc.changesetup();
  }

  async ionViewWillEnter() {
    this.platform.ready().then(() => this.showData());
  }

  ionViewWillLeave() {
    // this.nfc.invalidateTagListener();
    // this.subscription?.unsubscribe?.();
  }

  doRefresh(e: any) {
    this.showData().finally(() => {
      setTimeout(() => e.target.complete(), 100);
    });

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
  private async setupNfc() {
    await this.nfc.checkStatus();
    console.log('cek status', this.checkOnly);

    await this.nfc.setTagListener(async (event: any) => {
      // console.log('cek event', event);
      console.log('checkOnly', this.checkOnly);
      console.log('tag', event?.tag?.id);
      if (this.checkOnly && event?.tag?.id) {
        const data = await this.nfc.getTagString(event.tag.id);

        const alert = await this.alertCtrl.create({
          header: 'Result',
          message: data,
          mode: 'ios',
          cssClass: 'dark:ion-bg-gray-800',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Copy',
              handler: () => {
                Clipboard.write({
                  // eslint-disable-next-line id-blacklist
                  string: data
                });
              }
            }
          ]
        });

        this.utils.back();
        alert.present();
      } else if (event?.tag?.id) {
        const data = JSON.stringify({
          type: 'rfid',
          data: await this.nfc.getTagString(event.tag.id)
        });

        // this.router.navigate(['scan-form', { data }]);
      }
    });
  }

  async showData() {
    try {
      const response = await this.http.getAssetsDetail(this.transitionData.data);

      if (![200, 201].includes(response.status)) {
        throw response;
      }

      const bodyResponse = response.data?.data;

      this.resultParam = bodyResponse;
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

  async getDataInputForms() {
    const loader = await this.utils.presentLoader();

    this.http.requests({
      requests: [
        () => this.http.getAnyData(`${environment.url.formAssetCategory}/${this.resultParam.more.category?.id}`),
        () => this.http.getAnyData(`${environment.url.assetsdetail}/${this.resultParam?.id}`),
      ],
      onSuccess: async (responses) => {
        const [
          responseAssetCategory,
          responseAssetDetail,
        ] = responses;

        if (![200, 201].includes(responseAssetCategory.status)) {
          throw responseAssetCategory;
        }
        if (![200, 201].includes(responseAssetDetail.status)) {
          throw responseAssetDetail;
        }

        const bodyformAssetCategory = responseAssetCategory.data?.data;
        const bodyformAssetDetail = responseAssetDetail.data?.data;

        const mappedArray: AssetFormDetails[] = map(bodyformAssetCategory, (form, idx) => {
          const result = intersectionWith(
            this.utils.parseJson(form?.formOption),
            this.resultParam.assetForm,
            (a: any, b: any) => a?.id === b?.formValue
          );

          return {
            ...form,
            formOption: this.utils.parseJson(form?.formOption),
            selected: result.length ? true : false,
            value: result[0].id,
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
          const formId = initData[0].value;

          const response = await this.http.getAnyData(`${environment.url.formType}/${formId}`);

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
            value: null,
            disabled: false,
          };

          // const idxDataMerk = mappedArray?.findIndex((obj: any) => obj.formName === 'merk');
          const idxDataMerk = findIndex(mappedArray, (obj) => obj.index?.includes('2'));

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
        console.log('dataFormDetailAsset', this.dataFormDetailAsset);
      },
      onError: (err) => {
        console.error(err);
      },
      onComplete: async () => await loader.dismiss()
    });
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

}
