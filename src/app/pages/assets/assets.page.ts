/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit, ViewChild } from '@angular/core';
import { Platform, MenuController, IonSearchbar, ModalController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { each, groupBy, intersection, unionBy, uniq, zip } from 'lodash';
import { Route, Router } from '@angular/router';

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

  assetAll:any[];

  constructor(
    private platform: Platform,
    private menuCtrl: MenuController,
    private database: DatabaseService,
    private shared: SharedService,
    private utils: UtilsService,
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
    this.platform.ready().then(() => {
      this.getAssets().finally();
      this.getAssetsAll();
    });
  }

  ionViewDidEnter() {
    console.log('isSearchBar', this.isSearchFocus);
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

  openPage(commands:any[]) {
    return this.router.navigate(commands);
  }

  async openFilter() {
    await this.menuCtrl.enable(true, 'filter-assets');
    return this.menuCtrl.open('filter-assets');
  }

  async showDetails(asset?: any) {
    this.shared.asset = asset;
    console.log('showDetails', asset);
    await this.menuCtrl.enable(true, 'asset-information');
    return this.menuCtrl.open('asset-information');
  }

  async onSearch(event?: any) {
    //this.loading=true
    if (event) {
      this.shared.filterOptions.keyword = event.detail.value;
    }

    this.filteredAssets = this.sourceAssets.filter((sch) => {
      let condition = { 
        assetNumber: sch.assetNumber,
        area: sch.area,
        unit: sch.unit
      }

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
      //  else {
      //   return this.sourceAssets
      // }
      console.log('hasil pencatioan', condition);
      return condition;
      
    })
   this.filteredAssets = this.filteredAssets.slice(0, 10);
   //this.pushData(event) 
   console.log('filtered asset' , this.filteredAssets);
  //  if ( this.filteredAssets.length >= 0) {
  //   this.loading = false
  //  }

  }

  loadingFalse(){
    console.log('this.loading' , this.loading);
    
    this.loading=false
  }

 
  // async onSearch(event?: any) {
  //   if (event) {
  //     console.log('filteraset source', this.sourceAssets)

  //     this.filteredAssets = this.sourceAssets
  //       ?.filter((sch: any) => {
  //         const keyword = this.searchTerm?.toLowerCase();
  //         const matchAssetName = sch?.assetNumber?.toLowerCase()?.includes(keyword);
  //         const matchUnit = sch?.unit?.toLowerCase()?.includes(keyword);
  //         const matchArea = sch?.area?.toLowerCase()?.includes(keyword);

  //         return matchAssetName || matchUnit || matchArea;
  //         // if(matchAssetName!== null || matchUnit!==null || matchArea!==null) {
  //         //   return matchAssetName || matchUnit || matchArea;
  //         // } else {
  //         //   return console.log('tidak nemu')
  //         // }
  //       });
  //     this.filteredAssets = this.filteredAssets.slice(0, 5);
  //   }
  //   console.log('filteraser', this.filteredAssets)
  // }

  pushData(event: any) {
    console.log();
    this.loading=true
    
    //this.temporaryAssets = this.filteredAssets
    setTimeout(async () => {
      const start = this.filteredAssets.length;

      if (start < this.sourceAssets.length) {
        //console.log('temporary Assets',this.temporaryAssets);
        
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
        this.loading=false
      );
    }, 500);
  }

  async getAssetsAll(){
    try {
      const result = await this.database.select('asset' , {
        column: [
          'assetId ',
          'assetCategoryId ',
          'assetCategoryName ',
          'assetName ',
          'assetNumber ',
          'mediaId ',
          'mediaName ',
          'photo ',
          'description ',
          'schManual ',
          'schType ',
          'schWeekDays ',
          'schWeeks ',
          'supplyDate',
          'schMonthly',
          'schFrequency',
          'schYearly',
          'reportPhoto',
          'assetStatusId',
          'assetStatusName',
          'abbreviation',
          'capacityId',
          'capacityValue',
          'unitCapacity',
          'merkName',
          'typeName',
          'tagId',
          'tagNumber',
          'typeTag',
          'areaId',
          'area',
          'unit',
          'unitId',
          'bangunan',
          'location',
          'detailLocation',
          'latitude',
          'longitude',
          'created_at',
          'cctvIP'
        ]
      })
      console.log('result', result)
      this.assetAll = this.database.parseResult(result)
    } catch (error) {
      console.error(error);
    } finally {
      console.log('this asset all SQL lite', this.assetAll)
    }

  }


  // pushDataFiltered(event: any) {
  //   setTimeout(async () => {
  //     const start = this.temporaryAssets.length;

  //     if (start < this.filteredAssets.length) {
  //       console.log('temporary Assets',this.temporaryAssets);
        
  //       let end = start + 20;

  //       end = end > this.filteredAssets.length
  //         ? this.filteredAssets.length
  //         : end;

  //       this.temporaryAssets.push(
  //         ...this.filteredAssets.slice(start, end)
  //       );

  //       if (this.loaded < this.temporaryAssets.length) {
  //         this.loaded = this.temporaryAssets.length;
  //       }
  //     }

  //     event.target.complete(
  //       this.loading=false
  //     );
  //   }, 500);
  // }

  // pushData(event: any) {
  //   setTimeout(async () => {
  //     const start = this.filteredAssets.length;

  //     if (start < this.sourceAssets.length) {
  //       let end = start + 5;

  //       end = end > this.sourceAssets.length
  //         ? this.sourceAssets.length
  //         : end;

  //       this.filteredAssets.push(
  //         ...this.sourceAssets.slice(start, end)
  //       );

  //       if (this.loaded < this.filteredAssets.length) {
  //         this.loaded = this.filteredAssets.length;
  //       }
  //     }

  //     event.target.complete();
  //   }, 500);
  // }

  private async getAssets() {
    try {
      const result = await this.database.select('schedule', {
        column: [
          'scheduleTrxId',
          'abbreviation',
          'adviceDate',
          'approvedAt',
          'approvedBy',
          'approvedNotes',
          'assetId',
          'assetNumber',
          'assetStatusId',
          'assetStatusName',
          'condition',
          'detailLocation',
          'merk',
          'capacityValue',
          'detailLocation',
          'unitCapacity',
          'supplyDate',
          'reportPhoto',
          'scannedAccuration',
          'scannedAt',
          'scannedBy',
          'scannedEnd',
          'scannedNotes',
          'scannedWith',
          'schDays',
          'schFrequency',
          'schManual',
          'schType',
          'schWeekDays',
          'schWeeks',
          'scheduleFrom',
          'scheduleTo',
          'syncAt',
          'tagId',
          'tagNumber',
          'unit',
          'unitId',
          'area',
          'areaId',
          'latitude',
          'longitude',
          'created_at',
          'deleted_at',
          'date'
        ]
      });

      const resAsset = this.database.parseResult(result);
      console.log('resAsset', resAsset);


      const assets = this.database.parseResult(result).map(asset => {
        const tagIds: string[] = asset?.tagId?.length
          ? asset?.tagId?.split?.(',')
          : [];

        const tagNumbers = asset?.tagNumber?.length
          ? asset?.tagNumber?.split?.(',')
          : [];

        const areaIds = asset?.areaId?.length
          ? asset?.areaId?.split?.(',')
          : [];

        const areaNames = asset?.area?.length
          ? asset?.area?.split?.(',')
          : [];

        const unitIds = asset?.unitId?.length
          ? asset?.unitId?.split?.(',')
          : [];

        const unitNames = asset?.unit?.length
          ? asset?.unit?.split?.(',')
          : [];

        // const tagLocationIds = asset?.tagLocationId?.length
        //   ? asset?.tagLocationId?.split?.(',')
        //   : [];

        // const tagLocationNames = asset?.tagLocationName?.length
        //   ? asset?.tagLocationName?.split?.(',')
        //   : [];

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
          //   id: asset?.id,
          //   asset_number: asset?.asset_number,
          //   assetName: asset?.assetName,
          //   assetStatusId: asset?.assetStatusId,
          //   // description: this.utils.parseJson(asset?.description),
          //   description: asset?.description,
          //   // latitude: this.utils.parseFloat(asset?.latitude),
          //   // longitude: this.utils.parseFloat(asset?.longitude),
          //   schManual: this.utils.parseFloat(asset?.sch_manual),
          //   schType: asset?.sch_type,
          //   schFrequency: asset?.sch_frequency,
          //   schWeekDays: asset?.schWeekDays,
          //   schDays: asset?.schDays,
          //   photo: asset?.photo,
          //   more: this.utils.parseJson(asset?.more),
          //   offlinePhoto: null,
          tags: zip(tagIds, tagNumbers).map(([id, name]) => ({ id, name })),
          tagLocations: zip(unitIds, unitNames)
            .map(([id, name]) => ({ id, name }))
          // };
          // console.log(asset)
          // if(asset?.offlinePhoto) {
          //     data.offlinePhoto = Capacitor.convertFileSrc(asset?.offlinePhoto);
          //   }
        };
        return data;
      });
      console.log('assets', assets);
      this.sourceAssets = assets;
      this.filteredAssets = this.sourceAssets.slice(0, this.loaded)
    } catch (error) {
      console.error(error);
    } finally {
      this.onSearch();
     // console.log('filter', this.filteredAssets)
      this.loading = false;
    }
  }

  // private async getAssetsParameterStatuses() {
  //   const assetParameterStatuses: any = {};

  //   try {
  //     const columns = ['assetId', 'showOn'];

  //     const result = await this.database.select('parameter', {
  //       column: columns,
  //       groupBy: columns
  //     });

  //     const parameterStatuses = this.database.parseResult(result);

  //     Object.entries(groupBy(parameterStatuses, 'assetId'))
  //       .forEach(([assetId, parameters]) => {
  //         assetParameterStatuses[assetId] = uniq<string>(
  //           parameters
  //             .map(parameter =>
  //               parameter.showOn?.length ? parameter.showOn?.split?.(',') : []
  //             )
  //             .reduce((prev, curr) => prev.concat(curr), [])
  //         );
  //       });
  //   } catch (error) {
  //     console.error(error);
  //   }

  //   return assetParameterStatuses;
  // }

  // private generateFilterAssetOptions() {
  //   this.shared.filterOptions = {
  //     data: [
  //       {
  //         label: 'Tag',
  //         key: 'tags',
  //         values: []
  //       },
  //       {
  //         label: 'Tag Location',
  //         key: 'tagLocations',
  //         values: []
  //       },
  //     ],
  //     keyword: '',
  //     onReset: () => {
  //       this.shared.filterOptions.data.forEach((group) => {
  //         group.values.forEach(value => value.selected = false);
  //       });

  //       this.onSearch();
  //     },
  //     onApply: () => this.onSearch(),
  //     onCancel: () => this.menuCtrl.close('filter-assets'),
  //   };

  //   console.log('sourceAssets', this.sourceAssets);

  //   this.sourceAssets.forEach((asset) => {
  //     console.log('asset', asset);
  //     this.shared.filterOptions.data
  //       .forEach((filter) => {
  //         console.log('filter', filter);
  //         filter.values = unionBy(
  //           filter.values,
  //           asset[filter.key]
  //             .map(({ id, name }) => ({
  //               text: name,
  //               value: id,
  //               selected: false,
  //             })),
  //           'value'
  //         );
  //       });
  //   });
  // }


}
