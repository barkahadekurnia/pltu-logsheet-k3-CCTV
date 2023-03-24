import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-laporan-harian',
  templateUrl: './laporan-harian.page.html',
  styleUrls: ['./laporan-harian.page.scss'],
})
export class LaporanHarianPage implements OnInit {
  isHeaderVisible: boolean;

  constructor() { }

  ngOnInit() {
  }
  async onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

}
