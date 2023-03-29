import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
    countScanned: number,
    scanned: any[],
    countUnscanned: number,
    unscanned: any[],
  };
  filteredData: any[];
  sourceData: any[];
  loaded: number;

  constructor(
    private router: Router,
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
      console.log('navValues ',navValues)
      this.params = navValues?.params;
      console.log('this.params ',this.params)

      this.listDataScan = navValues?.listDataScan;
      console.log('this.listDataScan ',this.listDataScan)

      this.filteredData = this.listDataScan.scanned.slice(0, this.loaded);
      console.log('this.filteredData ',this.filteredData)

    }
  }

  ngOnInit() { }

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

}