/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit, ViewChild } from '@angular/core';
import { Platform, MenuController, IonSearchbar, ModalController } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { intersection, zip } from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.page.html',
  styleUrls: ['./assets.page.scss'],
})
export class AssetsPage implements OnInit {
  @ViewChild('autoFocus', { static: false, read: IonSearchbar }) autoFocus: IonSearchbar;

  assets: any[];
  filteredAssets: any[];
  sourceAssets: any[];
  searchTerm: string;
  isHeaderVisible: boolean;
  loaded: number;
  loading: boolean;

  temporaryAssets: any[];

  isSearchFocus: boolean;

  assetAll: any[];

  constructor(
    private platform: Platform,
    private menuCtrl: MenuController,
    private database: DatabaseService,
    private shared: SharedService,
    private modalCtrl: ModalController,
    private router: Router,
  ) {
    this.assets = [];
    this.filteredAssets = [];
    this.sourceAssets = [];
    this.temporaryAssets = [];

    this.isHeaderVisible = false;
    this.loaded = 10;
    this.loading = true;
    this.searchTerm = '';
    this.assetAll = [];
  }

  async ngOnInit() {
    await this.platform.ready();
    await this.getAssets();
    await this.getAssetsAll();
  }

  ionViewDidEnter() {
    if (this.isSearchFocus) {
      this.autoFocus.setFocus();
    }
  }

  ionViewWillLeave() {
    this.menuCtrl.enable(false, 'asset-information');
    this.menuCtrl.enable(false, 'filter-assets');
  }

  doRefresh(e: any) {
    this.getAssets().finally(() => e.target.complete());
  }

  onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

  isString(value: any) {
    return typeof value === 'string';
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }

  openPage(commands: any[]) {
    return this.router.navigate(commands);
  }

  async openFilter() {
    await this.menuCtrl.enable(true, 'filter-assets');
    return this.menuCtrl.open('filter-assets');
  }

  async showDetails(asset?: any) {
    this.shared.asset = asset;
    await this.menuCtrl.enable(true, 'asset-information');
    return this.menuCtrl.open('asset-information');
  }

  async onSearch(event?: any) {
    if (event) {
      this.shared.filterOptions.keyword = event.detail.value;
    }

    console.log('this source asset: ', this.sourceAssets)
    this.filteredAssets = this.sourceAssets.filter((sch) => {
      let condition = {
        assetNumber: sch.assetNumber,
        area: sch.area,
        unit: sch.unit
      };

      condition = condition && sch.assetNumber?.toLowerCase?.()
        .includes(this.shared.filterOptions.keyword.toLowerCase());


      const filteredData = this.shared.filterOptions.data
        .map(filter => {
          const values = filter.values
            .filter((value) => value.selected)
            .map((value) => value.value);
          return { ...filter, values };
        })
        .filter(filter => filter.values.length);

      if (filteredData.length) {
        condition &&
          !Boolean(
            filteredData
              .map(({ key, values }) =>
                intersection(
                  sch[key]?.map?.((item: any) => item.id),
                  values
                )
              )
              .find((data) => data.length === 0)
          );
      }

      return condition;
    });

    this.filteredAssets = this.filteredAssets.slice(0, 10);

    console.log('search: ',event?.detail?.value)
    console.log('this filtered Asset', this.filteredAssets)
  }

  loadingFalse() {
    this.loading = false;
  }

  pushData(event: any) {
    this.loading = true;

    setTimeout(async () => {
      const start = this.filteredAssets.length;

      if (start < this.sourceAssets.length) {
        let end = start + 10;

        end = end > this.sourceAssets.length
          ? this.sourceAssets.length
          : end;

        this.filteredAssets.push(
          ...this.sourceAssets.slice(start, end)
        );

        if (this.loaded < this.filteredAssets.length) {
          this.loaded = this.filteredAssets.length;
        }
      }

      event.target.complete(
        this.loading = false
      );
    }, 500);
  }

  async getAssetsAll() {
    try {
      const result = await this.database.select('asset', {
        column: [
          'assetId',
          'assetNumber',
          'assetForm',
          'description',
          'expireDate',
          'historyActive',
          'ipAddress',
          'lastScannedAt',
          'lastScannedBy',
          'more',
          'password',
          'photo',
          'schFrequency',
          'schManual',
          'schType',
          'supplyDate',
          'username',
          'updatedAt',
          'isUploaded',
        ]
      });

      this.assetAll = this.database.parseResult(result);

      console.log('this.assetAll', this.assetAll)
    } catch (error) {
      console.error(error);
    }
  }

  private async getAssets() {
    try {
      const result = await this.database.select('schedule', {});

      const assets = this.database.parseResult(result).map((asset) => {
        const tagIds: string[] = asset?.tagId?.length
          ? asset?.tagId?.split?.(',')
          : [];

        const tagNumbers = asset?.tagNumber?.length
          ? asset?.tagNumber?.split?.(',')
          : [];

        const unitIds = asset?.unitId?.length
          ? asset?.unitId?.split?.(',')
          : [];

        const unitNames = asset?.unit?.length
          ? asset?.unit?.split?.(',')
          : [];

        const data = {
          scheduleTrxId: asset?.scheduleTrxId,
          abbreviation: asset?.abbreviation,
          adviceDate: asset?.adviceDate,
          approvedAt: asset?.approvedAt,
          approvedBy: asset?.approvedBy,
          approvedNotes: asset?.approvedNotes,
          assetId: asset?.assetId,
          assetNumber: asset?.assetNumber,
          assetStatusId: asset?.assetStatusId,
          assetStatusName: asset?.assetStatusName,
          condition: asset?.condition,
          merk: asset?.merk,
          capacityValue: asset?.capacityValue,
          detailLocation: asset?.detailLocation,
          unitCapacity: asset?.unitCapacity,
          supplyDate: asset?.supplyDate,
          reportPhoto: asset?.reportPhoto,
          scannedAccuration: asset?.scannedAccuration,
          scannedAt: asset?.scannedAt,
          scannedBy: asset?.scannedBy,
          scannedEnd: asset?.scannedEnd,
          scannedNotes: asset?.scannedNotes,
          scannedWith: asset?.scannedWith,
          schDays: asset?.schDays,
          schFrequency: asset?.schFrequency,
          schManual: asset?.schManual,
          schType: asset?.schType,
          schWeekDays: asset?.schWeekDays,
          schWeeks: asset?.schWeeks,
          scheduleFrom: asset?.scheduleFrom,
          scheduleTo: asset?.scheduleTo,
          syncAt: asset?.syncAt,
          tagId: asset?.tagId,
          tagNumber: asset?.tagNumber,
          unit: asset?.unit,
          unitId: asset?.unitId,
          area: asset?.area,
          areaId: asset?.areaId,
          latitude: asset?.latitude,
          longitude: asset?.longitude,
          created_at: asset?.created_at,
          deleted_at: asset?.deleted_at,
          date: asset?.date,
          tags: zip(tagIds, tagNumbers).map(([id, name]) => ({ id, name })),
          tagLocations: zip(unitIds, unitNames)
            .map(([id, name]) => ({ id, name }))
        };

        return data;
      });

      this.sourceAssets = assets;
      this.filteredAssets = this.sourceAssets.slice(0, this.loaded);

      console.log('this.filteredAssets', this.filteredAssets)
    } catch (error) {
      console.error(error);
    } finally {
      this.onSearch();
      this.loading = false;
    }
  }
}
