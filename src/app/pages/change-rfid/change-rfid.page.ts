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

type TagListener = (event?: any) => any | void;


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
  private tagListener: Subscription;

  // asset = [];
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private alertCtrl: AlertController,
    private nfc: NfcService,
    private utils: UtilsService,
    private nfcPlugin: NFC,
    private menuCtrl: MenuController,
    private shared: SharedService,

    private http: HttpService,
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
    console.log('transitionData.data :', this.transitionData.data);

    // this.checkOnly = this.utils.parseJson(
    //   this.activatedRoute.snapshot.paramMap.get('checkOnly')
    // );

    // console.log('check only kah? ' , this.checkOnly)

    // if (!this.checkOnly) {
    //   this.scanQrButton = {
    //     text: 'Scan with QR Code',
    //     icon: 'qr-code-outline',
    //     //handler: () => this.scanQrCode()
    //   };
    // }

    // this.subscription = this.platform.resume
    //   .subscribe(() => this.nfc.checkStatus());

    console.log('transition Data',this.transitionData.data)

    if (this.transitionData.data === undefined) {
      return console.log('kosong mamang data bawaannya (aset id)')
    }

    await this.http.requests({
      requests: [() => this.http.getAssetsId(this.transitionData.data)],
      onSuccess: async ([responseParameters]) => {
        if (responseParameters.status >= 400) {
          throw responseParameters;
        }

        console.log('respons parameter',responseParameters)
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
  async checkStatus() {
    if (this.platform.is('capacitor')) {
      try {
        this.nfcStatus = await this.nfcPlugin.enabled();
      } catch (error) {
        this.nfcStatus = error;
      }
    }

    console.log('nfc status bang',this.nfcStatus)

    return this.nfcStatus;
  }
  async ngAfterViewInit() {
    await this.changesetup();
    
  }
  async ionViewWillEnter() {
     this.platform.ready().then(() => this.setupNfc());
    // window.addEventListener('keypress', (v) => {
    //   console.log('vsa', v);
    // })
    
  }

  async ionViewWillLeave() {
    //  this.nfc.invalidateTagListener();
    //  this.subscription?.unsubscribe?.();
    // console.log('i wanna out nfc')
    // if (this.tagListener) {
    //   this.tagListener.unsubscribe();
    //   this.tagListener = null;
    // }

    // this.nfcPlugin.cancelScan
  }
  async ngOnDestroy() {
    console.log('i wanna destroy nfc')
    if (this.tagListener) {
      this.tagListener.unsubscribe();
      this.tagListener = null;
    }
  }

  doRefresh(e: any) {
    this.setupNfc().finally(() => {
      setTimeout(() => e.target.complete(), 300);
    });
  }
  async changesetup(listener: TagListener = () => { }) {
    await this.checkStatus();
    await this.setRfid(listener);
  }

  async showDetails() {
    // this .shared.asset = asset;
    await this.menuCtrl.enable(true, 'asset-information');
    return this.menuCtrl.open('asset-information');
  }
  // scanQrCode() {
  //   BarcodeScanner.hideBackground();
  //   document.body.classList.add('qrscanner');

  //   const options: ScanOptions = {
  //     targetedFormats: [SupportedFormat.QR_CODE]
  //   };

  //   BarcodeScanner.startScan(options).then(async result => {
  //     this.utils.overrideBackButton();
  //     document.body.classList.remove('qrscanner');

  //     if (result.hasContent) {
  //       const key = 'assetId=';
  //       const startIndex = result.content.indexOf(key) + key.length;

  //       const assetId = result.content;
  //       const data = JSON.stringify({
  //         type: 'qr',
  //         data: assetId
  //       });

  //       //this.router.navigate(['scan-form', { data }]);
  //     }
  //   });

  //   this.utils.overrideBackButton(() => {
  //     this.utils.overrideBackButton();
  //     document.body.classList.remove('qrscanner');
  //     BarcodeScanner.showBackground();
  //     BarcodeScanner.stopScan();
  //   });
  // }

  private async setupNfc() {
    await this.checkStatus();
  }

  // async setTagListener(listener: TagListener) {
  //   console.log('cek listener', this.tagListener)
  //   if (this.tagListener) {
  //     this.tagListener.unsubscribe();
  //     this.tagListener = null;
  //   }

  //   // if (this.platform.is('android')) {
  //   //   this.tagListener = this.nfc.addTagDiscoveredListener().subscribe(listener);
  //   // }
   
  //   this.nfcPlugin.addTagDiscoveredListener().subscribe(event => {
  //     // console.log(event.tag.id);
  //     // this.router.navigate(['scan-form', { data }]);
  //     // this.nfcPlugin.addTagDiscoveredListener().subscribe(event => {
  //     // console.log('cek event', event);
  //     const res = this.nfcPlugin.bytesToHexString(event.tag.id)
  //     console.log('res', res);
  //     // const data = res;
  //     const data = JSON.stringify({
  //       type: 'rfid',
  //       data: res
  //     });
  //     //this.router.navigate(['scan-form', { data }]);

  //     // this.setupNfc();

  //     // });
  //   });

  //   if (this.platform.is('ios')) {
  //     try {
  //       this.tagListener = await this.nfcPlugin.scanTag().then(listener);
  //       console.log('tag listener', this.tagListener);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }
  // }

  async setRfid(listener: TagListener) {
    console.log('cek listener', this.tagListener)
    if (this.tagListener) {
      this.tagListener.unsubscribe();
      this.tagListener = null;
    }

    // if (this.platform.is('android')) {
    //   this.tagListener = this.nfcPlugin.addTagDiscoveredListener().subscribe(listener);
    // }
    var kali =0;

    (this.tagListener as any) = this.nfcPlugin.addTagDiscoveredListener().subscribe(async event => {
      const res = this.nfcPlugin.bytesToHexString(event.tag.id)
      console.log('res', res);

      const data = JSON.stringify({
        type: 'qr',
        data: this.shared.asset.assetId,
      });
      // const data = JSON.stringify({
      //   type: 'rfid',
      //   data: res
      // });
      
      const reco = { rfid: res };
      console.log('kali1 aset', kali)

      // if(kali < 1){
      await this.http.requests({
        requests: [() => this.http.changerfid(this.shared.asset.assetId, reco)],
        onSuccess: async ([responseParameters]) => {
          if (responseParameters.status >= 400) {
            throw responseParameters;
          }

          const alert = await this.utils.createCustomAlert({
            type: 'success',
            header: 'Berhasil',
            message: 'Berhasil merubah RFID Asset',
            buttons: [{
              text: 'Okay',
              handler: () => alert.dismiss()
            }]
          });

          alert.present();
          console.log('pindah kehalaman asset detail')
          //this.router.navigate(['tabs/home', { data }]);
          await this.router.navigate(['asset-detail', { data }]);

        },
        onError: error => console.error(error)
      });
      console.log('kali2 aset', kali)
    //}

    console.log('kali3 aset', kali)

    kali++;
    }
    
    );
  

    if (this.platform.is('ios')) {
      try {
        this.tagListener = await this.nfcPlugin.scanTag().then(listener);
        console.log(this.tagListener);
      } catch (err) {
        console.error(err);
      }
    }
  }

async getTagString(id: number[]) {
  if (this.platform.is('capacitor')) {
    return this.nfcPlugin.bytesToHexString(id);

  }

  return null;
}
}
