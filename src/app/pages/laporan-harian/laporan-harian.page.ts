import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { HttpService } from 'src/app/services/http/http.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-laporan-harian',
  templateUrl: './laporan-harian.page.html',
  styleUrls: ['./laporan-harian.page.scss'],
})
export class LaporanHarianPage implements OnInit {
  isHeaderVisible: boolean;
  loading: boolean;
  datasc: any;
  segment: 'belum' | 'sudah';
  laporan: {
    approvedAt: string;
    approvedBy: string;
    approvedNotes: string;
    notes: string;
    reportDate: string;
    scannedAt: string;
    scannedBy: string;
    scannedDate: string;
    scannedNotes: string;
    scannedWith: string;
    syncAt: string;
    trxData: any[];
    trxParentId: string;
  };

  searchTerm: string;
  params: any;
  listDataScan: {
    countScanned: number;
    scanned: any[];
    countUnscanned: number;
    unscanned: any[];
  };
  filteredData: any[];
  dataBelum: any[];
  dataSudah: any[];
  sourceData: any[];
  loaded: number;
  constructor(
    private utils: UtilsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private http: HttpService,
    private shared: SharedService,
    private platform: Platform
  ) {
    this.loading = true;
    this.datasc = {};
    this.segment = 'belum';
    this.searchTerm = '';
    this.isHeaderVisible = false;
    this.laporan = {
      approvedAt: '',
      approvedBy: '',
      approvedNotes: '',
      notes: '',
      reportDate: '',
      scannedAt: '',
      scannedBy: '',
      scannedDate: '',
      scannedNotes: '',
      scannedWith: '',
      syncAt: '',
      trxData: [],
      trxParentId: '',
    };

    this.listDataScan = {
      countScanned: 0,
      scanned: [],
      countUnscanned: 0,
      unscanned: [],
    };
    this.filteredData = [];
    this.dataBelum = [];
    this.dataSudah = [];
    this.sourceData = [];
    this.loaded = 12;
    const transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );

    // this.params = navValues?.params;
    // console.log('this.params ',this.params)

    // this.listDataScan = navValues?.listDataScan;
    // console.log('this.listDataScan ',this.listDataScan)

    this.filteredData = transitionData.data;
    this.dataBelum = transitionData.data;
    this.loading = false;
    this.getData();
  }

  ngOnInit() {
    this.getData();
  }
  ionViewWillEnter() {
    this.platform.ready().then(() => {
      this.getData();
    });
  }
  async onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }
  async getData() {
    const userId = { userId: this.shared.user.id };

    try {
      this.http.requests({
        requests: [() => this.http.getLaporan(userId)],
        onSuccess: async ([responseLaporan]) => {
          if (responseLaporan.status >= 400) {
            throw responseLaporan;
          }
          console.log('responseLaporan', responseLaporan.data.data);

          if (responseLaporan?.data?.data?.length) {
            const filterdatabelum = responseLaporan?.data?.data?.filter(
              (scan) => scan.reportDate == null
            );
            const filterdatasudah = responseLaporan?.data?.data?.filter(
              (scan) => scan.reportDate != null
            );
            console.log('filterdatabelum', filterdatabelum);
            console.log('filterdatasudah', filterdatasudah);
            this.dataBelum = filterdatabelum;
            this.dataSudah = filterdatasudah;
          }
          console.log('this.dataBelum', this.dataBelum);
          console.log('this.dataSudah', this.dataSudah);
        },
        onError: (error) => console.error(error),
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }
  onSegmentChanged(event: any) {
    this.segment = event.detail.value;
    console.log('segmen', this.segment);
    if (this.segment === 'sudah') {
      this.filteredData = this.dataSudah;
      console.log('segmen this.dataSudah', this.dataSudah);
    } else if (this.segment === 'belum') {
      this.filteredData = this.dataBelum;
      console.log('segmen this.dataBelum', this.dataBelum);
    }
    this.onSearch();
  }

  onSearch(event?: any) {
    if (event) {
      this.filteredData = this.sourceData?.filter((sch: any) => {
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

        end =
          end > this.listDataScan.unscanned.length
            ? this.listDataScan.unscanned.length
            : end;

        this.filteredData = this.filteredData.concat(
          this.listDataScan.unscanned.slice(start, end)
        );

        if (this.loaded < this.filteredData.length) {
          this.loaded = this.filteredData.length;
        }
      }

      event.target.complete();
    }, 500);
  }

  async openDetail(id) {
    const data = JSON.stringify({
      data: id,
    });
    console.log('data json :', JSON.parse(data));
    return this.router.navigate(['laporan-harian-detail', { data }]);
  }
  doRefresh(e: any) {
    // menghitung chart
    this.getData().finally(() => e.target.complete());
  }
}
