import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform, AlertController } from '@ionic/angular';
import { Clipboard } from '@capacitor/clipboard';
import { BarcodeScanner, ScanOptions, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { NfcService } from 'src/app/services/nfc/nfc.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { Subscription } from 'rxjs';
import { NFC } from '@awesome-cordova-plugins/nfc/ngx';

@Component({
  selector: 'app-rfid-scan',
  templateUrl: './rfid-scan.page.html',
  styleUrls: ['./rfid-scan.page.scss'],
})
export class RfidScanPage implements OnInit {
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private alertCtrl: AlertController,
    private nfc: NfcService,
    private utils: UtilsService,
    private nfc1: NFC

  ) {
    this.openSettingsButton = {
      text: 'Open Settings',
      icon: 'settings-outline',
      handler: () => this.nfc.openSettings()
    };
  }

  get nfcStatus() {
    return this.nfc.status;
  }

  ngOnInit() {
    // this.nfc1.addTagDiscoveredListener().subscribe(event => {
    // console.log('cek event', event);
    // const res = this.nfc1.bytesToHexString(event.tag.id)
    // console.log('res', res);
    // this.setupNfc();

    // });
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

    this.subscription = this.platform.resume
      .subscribe(() => this.nfc.checkStatus());
  }

  ionViewWillEnter() {

    this.platform.ready().then(() => this.setupNfc());
    window.addEventListener('keypress', (v) => {
      console.log('v', v);
    })
    console.log(this.nfcStatus);
  }

  async ionViewWillLeave() {
    this.nfc.invalidateTagListener();
    this.subscription?.unsubscribe?.();
    await this.nfc.unsubscribeTagListener();
  }

  async ngOnDestroy(){
    await this.nfc.unsubscribeTagListener();
  }

  doRefresh(e: any) {
    this.setupNfc().finally(() => {
      setTimeout(() => e.target.complete(), 300);
    });

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
    // console.log('cek status', this.checkOnly);

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

        this.router.navigate(['scan-form', { data }]);
      }
    });
  }
}
