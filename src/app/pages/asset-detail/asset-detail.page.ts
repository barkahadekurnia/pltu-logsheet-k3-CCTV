import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/app/services/http/http.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform, AlertController, MenuController } from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { BarcodeScanner, ScanOptions, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { NfcService } from 'src/app/services/nfc/nfc.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { Subscription } from 'rxjs';
import Viewer from 'viewerjs';

import { NFC } from '@awesome-cordova-plugins/nfc/ngx';
import { SharedService } from 'src/app/services/shared/shared.service';
type NfcStatus = 'NO_NFC' | 'NFC_DISABLED' | 'NO_NFC_OR_NFC_DISABLED' | 'NFC_OK';

@Component({
  selector: 'app-asset-detail',
  templateUrl: './asset-detail.page.html',
  styleUrls: ['./asset-detail.page.scss'],
})
export class AssetDetailPage implements OnInit {
  checkOnly: boolean;
  subscription: Subscription;

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
  // resultParam = [];
  resultParam: {
    assetForm: any[],
    asset_number: string,
    description: string,
    expireDate: string,
    historyActive: string,
    id: string,
    more: {
      category: {
        code:string,
        id:string,
        name:string
      },
      status:{
        abbreviation: string,
        id: string,
        name: string,
      },
      tag:[{
        area:string,
        areaId: string,
        detail_location: string,
        id: string,
        location: string,
        tag_number: string,
        unit: string,
        unitId: string,
      }],
      tagging: any[],
      type:{
        id:string,
        name:string
      }
    },
    parameter:{
      day: any[],
      lustrum: any[],
      monthly: any[],
      semester: any[],
      threeMonthly: any[],
      week: any[],
      yearly: any[],
    }
    photo: any[],
    qr: string,
    sch_frequency: string,
    sch_manual: string,
    sch_type: string,
    supply_date: string

  };

  public nfcStatus: NfcStatus;
  slideOpts = {
    initialSlide: 1,
    speed: 400,
  };
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private alertCtrl: AlertController,
    private nfc: NfcService,
    private utils: UtilsService,
    private nfc1: NFC,
    private menuCtrl: MenuController,
    private shared: SharedService,
    private http: HttpService
  ) {
    this.nfcStatus = 'NO_NFC';

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
    this.showdata();

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
    this.platform.ready().then(() => this.showdata());
    // window.addEventListener('keypress', (v) => {
    //   console.log('vsa', v);
    // })

  }

  ionViewWillLeave() {
    // this.nfc.invalidateTagListener();
    // this.subscription?.unsubscribe?.();
  }

  doRefresh(e: any) {
    this.showdata().finally(() => {
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
  async showdata(){
    await this.http.requests({
      requests: [() => this.http.getAssetsDetail(this.transitionData.data)],
      onSuccess: async ([responseAsset]) => {
        if (responseAsset.status >= 400) {
          throw responseAsset;
        }
        console.log('responseAsset', responseAsset?.data?.data);
this.resultParam = responseAsset?.data?.data;

      },
      onError: error => console.error(error)
    });
console.log('this.resultParam', this.resultParam);

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

}
