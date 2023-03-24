import { Component, OnInit } from '@angular/core';
import { Platform, MenuController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { groupBy, intersection, unionBy, uniq, zip } from 'lodash';
import { HttpService } from 'src/app/services/http/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-jadwal',
  templateUrl: './jadwal.page.html',
  styleUrls: ['./jadwal.page.scss'],
})
export class JadwalPage implements OnInit {
  assets: any[];
  filteredAssets: any[];
  sourceAssets: any[];
  isiaset: any[];

  isHeaderVisible: boolean;
  loaded: number;
  loading: boolean;

  constructor(
    private platform: Platform,
    private menuCtrl: MenuController,
    private database: DatabaseService,
    private shared: SharedService,
    private utils: UtilsService,
    private http: HttpService,
    private router: Router


  ) {
    this.assets = [];
    this.filteredAssets = [];
    this.sourceAssets = [];

    this.isHeaderVisible = false;
    this.loaded = 5;
    this.loading = true;
  }

  ngOnInit() {

    this.platform.ready().then(() => {
      this.getAssets().finally(() => this.generateFilterAssetOptions());
    });
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

  async openFilter() {
    await this.menuCtrl.enable(true, 'filter-assets');
    return this.menuCtrl.open('filter-assets');
  }

  async showDetails(asset?: any) {
    this.shared.asset = asset;
    await this.menuCtrl.enable(true, 'asset-information');
    return this.menuCtrl.open('asset-information');
  }
  async updaterfid(asset?: any) {
    // const data = JSON.stringify({
    //   asset: asset,
    // });
    // console.log('data json :', JSON.parse(asset));
    return this.router.navigate(['rfid', { asset }]);
  }

  async onSearch(event?: any) {
    if (event) {
      this.shared.filterOptions.keyword = event.detail.value;
    }

    const keyword = this.shared.filterOptions.keyword.toLowerCase();

    this.filteredAssets = this.sourceAssets.filter(asset => {
      let condition = asset?.assetNumber?.toLowerCase?.().includes(keyword);

      if (this.isString(asset?.assetNumber)) {
        condition = condition || asset?.assetNumber?.toLowerCase?.().includes(keyword);
      } else {
        for (const item of asset.assetNumber) {
          condition = condition || item?.value?.toLowerCase?.().includes(keyword);
        }
      }

      const filteredData = this.shared.filterOptions.data
        .map(filter => {
          const values = filter.values
            .filter(value => value.selected)
            .map(value => value.value);

          return { key: filter.key, values };
        })
        .filter(filter => filter.values.length);

      if (filteredData.length) {
        condition =
          condition &&
          !Boolean(
            filteredData
              .map(({ key, values }) =>
                intersection(
                  asset[key]?.map?.((item: any) => item.id),
                  values
                )
              )
              .find((data) => data.length === 0)
          );
      }

      return condition;
    });

    this.assets = this.filteredAssets.slice(0, this.loaded);
  }

  pushData(event: any) {
    setTimeout(async () => {
      const start = this.assets.length;

      if (start < this.filteredAssets.length) {
        let end = start + 5;

        end = end > this.filteredAssets.length
          ? this.filteredAssets.length
          : end;

        this.assets.push(
          ...this.filteredAssets.slice(start, end)
        );

        if (this.loaded < this.assets.length) {
          this.loaded = this.assets.length;
        }
      }

      event.target.complete();
    }, 500);
  }

  private async getAssets() {
    try {
      this.http.requests({
        requests: [
          () => this.http.getapar()
        ],
        onSuccess: ([response]) => {
          if (response.status >= 400) {
            throw response;
          }

          console.log('cek :', response.data.data)
          this.isiaset = response.data.data;

        },
        onError: (error) => {
          this.shared.addLogActivity({
            activity: 'User synchronizes assets with server',
            data: {
              message: this.http.getErrorMessage(error),
              status: 'failed'
            },
          });

          // this.utils.presentToast('Failed to synchronize assets with server', 'danger');   },
          // onComplete: () => console.log('complete'),
        }
      })
      this.sourceAssets = this.isiaset.map(asset => {
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
      // console.log('assets', assets);
      // this.sourceAssets = assets;

    } catch (error) {
      console.error(error);
    } finally {
      this.onSearch();
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

  private generateFilterAssetOptions() {
    this.shared.filterOptions = {
      data: [
        {
          label: 'Tag',
          key: 'tags',
          values: []
        },
        {
          label: 'Tag Location',
          key: 'tagLocations',
          values: []
        },
      ],
      keyword: '',
      onReset: () => {
        this.shared.filterOptions.data.forEach((group) => {
          group.values.forEach(value => value.selected = false);
        });

        this.onSearch();
      },
      onApply: () => this.onSearch(),
      onCancel: () => this.menuCtrl.close('filter-assets'),
    };

    console.log('sourceAssets', this.sourceAssets);

    this.sourceAssets.forEach((asset) => {
      console.log('asset', asset);
      this.shared.filterOptions.data
        .forEach((filter) => {
          console.log('filter', filter);
          filter.values = unionBy(
            filter.values,
            asset[filter.key]
              .map(({ id, name }) => ({
                text: name,
                value: id,
                selected: false,
              })),
            'value'
          );
        });
    });
  }
}
