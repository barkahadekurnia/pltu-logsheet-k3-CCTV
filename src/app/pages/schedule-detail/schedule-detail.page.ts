import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { BarcodeScanner, ScanOptions, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-schedule-detail',
  templateUrl: './schedule-detail.page.html',
  styleUrls: ['./schedule-detail.page.scss'],
})
export class ScheduleDetailPage implements OnInit {
  segment: 'scanned' | 'unscanned';
  searchTerm: string;

  isHeaderVisible: boolean;

  params: any;
  listDataScan: {
    countScanned: any,
    scanned: any[],
    countUnscanned: any,
    unscanned: any[],
  };
  filteredData: any[];
  sourceData: any[];
  loaded: number;


  constructor(
    private router: Router,
    private database: DatabaseService,
    private menuCtrl: MenuController,
    private shared: SharedService,
    private utils:UtilsService,
  ) {
    this.segment = 'scanned';
    this.searchTerm = '';

    this.isHeaderVisible = false;
    this.listDataScan = {
      countScanned: 0,
      scanned: [],
      countUnscanned: 0,
      unscanned: []
    };
    this.filteredData = [];
    this.sourceData = [];
    this.loaded = 12;

    if (router.getCurrentNavigation().extras.state) {
      const navValues = this.router.getCurrentNavigation().extras.state;
      console.log('navValues ', navValues)
      this.params = navValues?.params;
      console.log('this.params ', this.params)

      this.listDataScan = navValues?.listDataScan;
      console.log('this.listDataScan ', this.listDataScan)

      // console.log('this.listDataScan countScanned',this.listDataScan.countScanned);
      // console.log('this.listDataScan countUnscanned',this.listDataScan.countUnscanned);

      this.filteredData = this.listDataScan.scanned.slice(0, this.loaded);
      console.log('this.filteredData ', this.filteredData)

    }
  }

  ngOnInit() { }

  async onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

  openScanPage() {
    return this.router.navigate(['rfid-scan']);
  } 

  scanQrCode() {
    BarcodeScanner.hideBackground();
    document.body.classList.add('qrscanner');

    const options: ScanOptions = {
      targetedFormats: [SupportedFormat.QR_CODE]
    };

    BarcodeScanner.startScan(options).then(async (result) => {
      this.utils.overrideBackButton();
      document.body.classList.remove('qrscanner');
      console.log('result;' ,result)
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
  
  onSegmentChanged(event: any) {
    this.segment = event.detail.value;

    if (this.segment === 'scanned') {
      this.filteredData = this.listDataScan.scanned.slice(0, this.loaded);
      this.sourceData = this.listDataScan.scanned;
      const sortData = this.sourceData.sort((a, b) => a.assetNumber.toLowerCase().localeCompare(b.assetNumber.toLowerCase())); 
      this.sourceData = sortData
      
    } else if (this.segment === 'unscanned') {
      this.filteredData = this.listDataScan.unscanned.slice(0, this.loaded);
      this.sourceData = this.listDataScan.unscanned;
      console.log('sourceData', this.sourceData);
      const sortData = this.sourceData.sort((a, b) => a.assetNumber.toLowerCase().localeCompare(b.assetNumber.toLowerCase())); 
      this.sourceData = sortData
      console.log('barkah tes')
    }
    this.onSearch();
  }

  async showDetails(asset?: any) {
    this.shared.asset = asset;
    console.log('showDetails', asset);
    await this.menuCtrl.enable(true, 'asset-information');
    return this.menuCtrl.open('asset-information');
  }

  onSearch(event?: any) {
    if (event) {
      this.filteredData = this.sourceData
        ?.filter((sch: any) => {
          const keyword = this.searchTerm?.toLowerCase();
          const matchAssetName = sch?.assetName?.toLowerCase()?.includes(keyword);
          const matchAssetNumber = sch?.assetNumber?.toLowerCase()?.includes(keyword);
          const matchUnit = sch?.unit?.toLowerCase()?.includes(keyword);
          const matchArea = sch?.area?.toLowerCase()?.includes(keyword);

          return matchAssetName || matchUnit || matchArea || matchAssetNumber ;
        });
      
      const sortData = this.filteredData.sort((a, b) => a.assetNumber.toLowerCase().localeCompare(b.assetNumber.toLowerCase())); 
      this.filteredData = sortData
      console.log('sort data' , this.filteredData)

      Object.entries(sortData).forEach(entry => {
        const [key, value] = entry;
        console.log(key, value.assetNumber);
      });

      this.filteredData = this.filteredData.slice(0, 5);
    }
  }

  pushData(event: any) {
    setTimeout(async () => {
      const start = this.filteredData.length;

      if (start < this.listDataScan.unscanned.length) {
        let end = start + 12;

        end = end > this.listDataScan.unscanned.length
          ? this.listDataScan.unscanned.length
          : end;

        this.filteredData = this.filteredData
          .concat(this.listDataScan.unscanned
            .slice(start, end));

        if (this.loaded < this.filteredData.length) {
          this.loaded = this.filteredData.length;
        }
      }

      event.target.complete();
    }, 500);
  }

}
