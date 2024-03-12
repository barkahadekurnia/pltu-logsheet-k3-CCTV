import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared/shared.service';
import { BarcodeScanner, ScanOptions, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit {
  gruprole = this.shared.user.group;

  constructor(
    private router: Router,
    private shared: SharedService,
    private utils: UtilsService,
  ) { }

  ngOnInit() { }

  scanQrCode() {
    BarcodeScanner.hideBackground();
    document.body.classList.add('qrscanner');

    const options: ScanOptions = {
      targetedFormats: [SupportedFormat.QR_CODE]
    };

    BarcodeScanner.startScan(options).then(async (result) => {
      this.utils.overrideBackButton();
      document.body.classList.remove('qrscanner');

      if (result.hasContent) {
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
}
