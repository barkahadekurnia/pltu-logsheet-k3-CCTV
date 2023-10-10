import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { NFC } from '@awesome-cordova-plugins/nfc/ngx';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { HttpService } from '../http/http.service';
import { SharedService } from '../shared/shared.service';
import { UtilsService } from '../utils/utils.service';

type NfcStatus = 'NO_NFC' | 'NFC_DISABLED' | 'NO_NFC_OR_NFC_DISABLED' | 'NFC_OK';

type TagListener = (event?: any) => any | void;

@Injectable({
  providedIn: 'root'
})
export class NfcService {
  private nfcStatus: NfcStatus;
  private tagListener: Subscription;

  constructor(
    private platform: Platform,
    private nfc: NFC,
    private http: HttpService,
    private shared: SharedService,
    private router: Router,
    private utils: UtilsService


  ) {
    this.nfcStatus = 'NO_NFC';
  }

  get status() {
    return this.nfcStatus;
  }

  async setup(listener: TagListener = () => { }) {
    await this.checkStatus();
    await this.setTagListener(listener);
  }
  async changesetup(listener: TagListener = () => { }) {
    await this.checkStatus();
    await this.setRfid(listener);
  }

  async checkStatus() {
    if (this.platform.is('capacitor')) {
      try {
        this.nfcStatus = await this.nfc.enabled();
      } catch (error) {
        this.nfcStatus = error;
      }
    }

    return this.nfcStatus;
  }

  async setTagListener(listener: TagListener) {
    console.log('cek listener', this.tagListener)
    if (this.tagListener) {
      this.tagListener.unsubscribe();
      this.tagListener = null;
    }

    // if (this.platform.is('android')) {
    //   this.tagListener = this.nfc.addTagDiscoveredListener().subscribe(listener);
    // }
    this.nfc.addTagDiscoveredListener().subscribe(event => {
      // console.log(event.tag.id);
      // this.router.navigate(['scan-form', { data }]);
      // this.nfc1.addTagDiscoveredListener().subscribe(event => {
      // console.log('cek event', event);
      const res = this.nfc.bytesToHexString(event.tag.id)
      console.log('res', res);
      // const data = res;
      const data = JSON.stringify({
        type: 'rfid',
        data: res
      });
      this.router.navigate(['scan-form', { data }]);

      // this.setupNfc();

      // });
    });

    if (this.platform.is('ios')) {
      try {
        this.tagListener = await this.nfc.scanTag().then(listener);
        console.log(this.tagListener);
      } catch (err) {
        console.error(err);
      }
    }
  }
  async setRfid(listener: TagListener) {
    console.log('cek listener', this.tagListener)
    if (this.tagListener) {
      this.tagListener.unsubscribe();
      this.tagListener = null;
    }

    // if (this.platform.is('android')) {
    //   this.tagListener = this.nfc.addTagDiscoveredListener().subscribe(listener);
    // }
    var kali =0;

    this.nfc.addTagDiscoveredListener().subscribe(async event => {
      const res = this.nfc.bytesToHexString(event.tag.id)
      console.log('res', res);

      const data = JSON.stringify({
        type: 'rfid',
        data: res
      });
      const reco = { rfid: res };
      console.log('kali1', kali)

      if(kali < 1){
      await this.http.requests({
        requests: [() => this.http.changerfid(this.shared.asset.assetId, reco)],
        onSuccess: async ([responseParameters]) => {
          if (responseParameters.status >= 400) {
            throw responseParameters;
          }

          const alert = await this.utils.createCustomAlert({
            type: 'success',
            header: 'Berhasil',
            message: 'Berhasil merubah RFID',
            buttons: [{
              text: 'Okay',
              handler: () => alert.dismiss()
            }]
          });

          alert.present();
          this.router.navigate(['tabs/home', { data }]);

        },
        onError: error => console.error(error)
      });
      console.log('kali2', kali)
    }
    console.log('kali3', kali)

kali++;
    });

    if (this.platform.is('ios')) {
      try {
        this.tagListener = await this.nfc.scanTag().then(listener);
        console.log(this.tagListener);
      } catch (err) {
        console.error(err);
      }
    }
  }

  invalidateTagListener() {
    if (this.tagListener) {
      this.tagListener.unsubscribe();
      this.tagListener = null;
    }
  }

  async getTagString(id: number[]) {
    if (this.platform.is('capacitor')) {
      return this.nfc.bytesToHexString(id);

    }

    return null;
  }

  async openSettings() {
    if (this.platform.is('capacitor')) {
      return this.nfc.showSettings();
    }
  }
}
