import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, Platform } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-schedule-lokasi',
  templateUrl: './schedule-lokasi.page.html',
  styleUrls: ['./schedule-lokasi.page.scss'],
})
export class ScheduleLokasiPage implements OnInit {
  countsc: any[];
  calendar: {
    date: Date;
    daysInLastMonth: any[];
    daysInThisMonth: any[];
    daysInNextMonth: any[];
    title: string;
  };

  count: {
    uploaded: number;
    unuploaded: number;
    holded: number;
    unscanned: number;
  };

  assets: any[];
  filteredAssets: any[];
  sourceAssets: any[];
  schedules: any[];


  isHeaderVisible: boolean;
  loaded: number;
  loading: boolean;
  isAssetsExpanded: boolean;
  isFirstEnter: boolean;
  selectedDate: any;
  segment: 'scanned' | 'unscanned';
  datakategori: any[];
  // lokasiaset: any[];
  lokasiaset: {
    tagNumber: string;
    adviceDate: string;
    unit: string;
    area: string;
  };
  searchTerm: string;

  params: {
    abbreviation: string;
    adviceDate: string;
    approvedAt: string;
    approvedBy: string;
    approvedNotes: string;
    area: string;
    areaId: string;
    assetCategoryId: string;
    assetCategoryName: string;
    assetId: string;
    assetName: string;
    assetNumber: string;
    assetStatusId: string;
    assetStatusName: string;
    assetTags: string;
    condition: string;
    hasCoordinatTagging: string;
    hasPreview: string;
    hasRecordHold: string;
    isUnscanned: string;
    isUnuploaded: string;
    isUploaded: string;
    latitude: string;
    longitude: string;
    scannedAt: string;
    scannedBy: string;
    scannedEnd: string;
    scannedNotes: string;
    scannedWith: string;
    scheduleFrom: string;
    scheduleTo: string;
    scheduleTrxId: string;
    supplyDate: string;
    syncAt: string;
    tagId: string;
    tagNumber: string;
    unit: string;
  };

 // params:any;

  listDataScan: {
    countScanned: number,
    scanned: any[],
    countUnscanned: number,
    unscanned: any[],
  };
  filteredData: any[];
  sourceData: any[];

  constructor(
    private platform: Platform,
    private database: DatabaseService,
    public shared: SharedService,
    private utils: UtilsService,
    private navCtrl: NavController,
    private router: Router,
  ) {
    this.calendar = {
      date: null,
      daysInLastMonth: [],
      daysInThisMonth: [],
      daysInNextMonth: [],
      title: '',
    };

    this.count = {
      uploaded: 0,
      unuploaded: 0,
      holded: 0,
      unscanned: 0,
    };

    this.assets = [];
    this.filteredAssets = [];
    this.sourceAssets = [];
    this.schedules = [];

    this.isHeaderVisible = false;
    this.loaded = 10;
    this.loading = false;
    this.isAssetsExpanded = false;
    this.isFirstEnter = true;
    this.selectedDate = {};



    this.segment = 'scanned';
    this.searchTerm = '';

    this.listDataScan = {
      countScanned: 0,
      scanned: [],
      countUnscanned: 0,
      unscanned: []
    };
    this.filteredData = [];
    this.sourceData = [];
    this.loaded = 12;


    console.log('this.params luar',this.params)

    if (router.getCurrentNavigation().extras.state) {
      const navValues = this.router.getCurrentNavigation().extras.state;
      console.log('navValues ',navValues)
      console.log('navValues 2 ',navValues.listDataScan.schedules)
      this.sourceAssets = navValues.listDataScan.schedules;
      this.datakategori = navValues.kategori;
      this.lokasiaset = navValues.listDataScan.lokasi[0];
      this.params = navValues.params;
      this.countsc = navValues.countsc;
      // console.log('navValues 1 ',this.sourceAssets )
      // console.log('navValues 2 ',this.datakategori )

    // this.params = navValues?.params;
      console.log('this.params ',this.params)


      // this.listDataScan = navValues?.listDataScan;
      // console.log('this.listDataScan ',this.listDataScan)

      // this.filteredData = this.listDataScan.scanned.slice(0, this.loaded);
      // console.log('this.filteredData ',this.filteredData)

    }else{
      this.sourceAssets =[]
      this.datakategori =[]
      this.countsc =[]
    }
  }

  ngOnInit() {
  }

  async onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }
  onSegmentChanged(event: any) {
    this.segment = event.detail.value;

    if (this.segment === 'scanned') {
      this.filteredData = this.listDataScan.scanned.slice(0, this.loaded);
      this.sourceData = this.listDataScan.scanned;
    } else if (this.segment === 'unscanned') {
      this.filteredData = this.listDataScan.unscanned.slice(0, this.loaded);
      this.sourceData = this.listDataScan.unscanned;
    }
    this.onSearch();
  }

  onSearch(event?: any) {
    if (event) {
      this.filteredData = this.sourceData
        ?.filter((sch: any) => {
          const keyword = this.searchTerm?.toLowerCase();
          const matchAssetName = sch?.assetName?.toLowerCase()?.includes(keyword);
          const matchUnit = sch?.unit?.toLowerCase()?.includes(keyword);
          const matchArea = sch?.area?.toLowerCase()?.includes(keyword);

          return matchAssetName || matchUnit || matchArea;
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


  navPage(path, paramsm, listDataScan) {
    this.navCtrl.navigateForward(path, { state: { paramsm, listDataScan } });
  }
}
