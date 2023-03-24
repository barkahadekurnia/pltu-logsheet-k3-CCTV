import { HttpService } from 'src/app/services/http/http.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform, AlertController, MenuController } from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { BarcodeScanner, ScanOptions, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { NfcService } from 'src/app/services/nfc/nfc.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { Subscription } from 'rxjs';
import { NFC } from '@awesome-cordova-plugins/nfc/ngx';
import { SharedService } from 'src/app/services/shared/shared.service';
type NfcStatus = 'NO_NFC' | 'NFC_DISABLED' | 'NO_NFC_OR_NFC_DISABLED' | 'NFC_OK';

@Component({
  selector: 'app-change-rfid',
  templateUrl: './change-rfid.page.html',
  styleUrls: ['./change-rfid.page.scss'],
})

export class ChangeRfidPage implements OnInit {
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
  resultParam = [];
  public nfcStatus: NfcStatus;

  // asset = [];
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
    // this.openSettingsButton = {
    //   text: 'Open Settings',
    //   icon: 'settings-outline',
    //   handler: () => this.nfc.openSettings()
    // };
    this.nfcStatus = 'NO_NFC';

  }

  get status() {
    return this.nfcStatus;
  }
  // get nfcStatus() {
  //   return this.nfc.status;
  // }

  async ngOnInit() {
    await this.checkStatus();

    this.transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );

    if (!this.transitionData) {
      return this.utils.back();
    }

    console.log('transitionData :', this.transitionData);

    this.checkOnly = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('checkOnly')
    );

    if (!this.checkOnly) {
      this.scanQrButton = {
        text: 'Scan with QR Code',
        icon: 'qr-code-outline',
        handler: () => this.scanQrCode()
      };
    }

    // this.subscription = this.platform.resume
    //   .subscribe(() => this.nfc.checkStatus());


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
    // this.platform.ready().then(() => this.setupNfc());
    // window.addEventListener('keypress', (v) => {
    //   console.log('vsa', v);
    // })
    await this.http.requests({
      requests: [() => this.http.getAssetsId(this.transitionData.data)],
      onSuccess: async ([responseParameters]) => {
        if (responseParameters.status >= 400) {
          throw responseParameters;
        }
        // console.log('parameter', responseParameters?.data?.data);
        // if (responseParameters?.data?.data?.length) {
        const data = responseParameters?.data?.data;
        this.resultParam = responseParameters?.data?.data;
        this.shared.asset.assetId = data.assetId;
        this.shared.asset.assetNumber = data.assetNumber;
        this.shared.asset.schType = data.schType;
        this.shared.asset.merk = data.merkName;
        this.shared.asset.assetStatusName = data.assetStatusName;
        // this.shared.asset.offlinePhoto = data.photo[0].path;
        // this.shared.asset.photo = data.photo[0].path;
        this.shared.asset.unit = data.unit;
        this.shared.asset.area = data.area;
        this.shared.asset.longitude = data.longitude;
        this.shared.asset.latitude = data.latitude;
        this.shared.asset.condition = data.assetStatusName;
      },
      onError: error => console.error(error)
    });
  }

  ionViewWillLeave() {
    // this.nfc.invalidateTagListener();
    // this.subscription?.unsubscribe?.();
  }

  doRefresh(e: any) {
    // this.setupNfc().finally(() => {
    //   setTimeout(() => e.target.complete(), 300);
    // });

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

}
