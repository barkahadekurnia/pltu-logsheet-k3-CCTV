import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-check',
  templateUrl: './check.page.html',
  styleUrls: ['./check.page.scss'],
})
export class CheckPage implements OnInit {
  isHeaderVisible: boolean;
  datakategori: any[];
  loaded: number;
  loading: boolean;
  constructor(
    private router: Router,
    private platform: Platform,
    private menuCtrl: MenuController,
    private database: DatabaseService,
    private shared: SharedService,
    private utils: UtilsService
  ) { }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.getKategori();
    });
  }
  openPage(commands: any[]) {
    return this.router.navigate(commands);
  }
  doRefresh(e: any) {
    this.getKategori().finally(() => e.target.complete());
  }

  onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }
  private async getKategori() {
    try {
      const result = await this.database.select('category', {
        column: [
          'assetCategoryId',
          'assetCategoryName',
          'description',
          'kode',
          'urlImage'
        ]
      });


      const category = this.database.parseResult(result)
    .map(kat => {
          const data = {
            assetCategoryId: kat?.assetCategoryId,
            assetCategoryName: kat?.assetCategoryName,
            description: kat?.description,
            kode: kat?.kode,
            urlImage: kat?.urlImage
          };
          return data;
        });
      console.log('kategori', category);
      this.datakategori = category;

    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }

  }
}
