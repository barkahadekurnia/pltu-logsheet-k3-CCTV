import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, LoadingController, MenuController, ToastController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
// import { StatusBar, Style } from '@capacitor/status-bar';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { intersection, unionBy, uniq, zip } from 'lodash';
import { point } from '@turf/helpers';
import turf_distance from '@turf/distance';
import * as moment from 'moment';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
})
export class TransactionsPage {
  segment: 'unuploaded' | 'uploaded';

  isHeaderVisible: boolean;
  loaded: number;
  loading: boolean;
  isFirstEnter: boolean;

  schedules: any[];
  filteredSchedules: any[];
  sourceSchedules: any[];

  constructor(
    private router: Router,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private menuCtrl: MenuController,
    private toastCtrl: ToastController,
    private database: DatabaseService,
    private shared: SharedService,
    private utils: UtilsService
  ) {
    this.segment = 'unuploaded';

    this.isHeaderVisible = false;
    this.loaded = 10;
    this.loading = true;
    this.isFirstEnter = true;

    this.schedules = [];
    this.filteredSchedules = [];
    this.sourceSchedules = [];
  }

  ionViewWillEnter() {
    this.platform.ready().then(() => {
      // StatusBar.setStyle({
      //   style: Style.Light
      // });

      // StatusBar.setBackgroundColor({
      //   color: '#1d4ed8'
      // });

      this.getSchedules().finally(() => {
        if (this.isFirstEnter) {
          this.generateFilterAssetOptions();
        }

        this.menuCtrl.enable(true, 'filter-assets')
          .then(() => this.menuCtrl.swipeGesture(true, 'filter-assets'));

        this.isFirstEnter = false;
      });
    });
  }

  ionViewWillLeave() {
    // StatusBar.setBackgroundColor({
    //   color: '#ffffff'
    // });

    // StatusBar.setStyle({
    //   style: Style.Light
    // });

    this.menuCtrl.swipeGesture(false, 'filter-assets')
      .then(() => this.menuCtrl.enable(false, 'filter-assets'));
  }

  onSegmentChanged(event: any) {
    this.segment = event.detail.value;
    this.onSearch();
  }

  doRefresh(e: any) {
    this.getSchedules().finally(() => e.target.complete());
  }

  onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }

    // if (this.isHeaderVisible) {
    //   StatusBar.setStyle({
    //     style: Style.Dark
    //   });
    // } else {
    //   StatusBar.setStyle({
    //     style: Style.Light
    //   });
    // }
  }

  pushData(event: any) {
    setTimeout(async () => {
      const start = this.schedules.length;

      if (start < this.filteredSchedules.length) {
        let end = start + 20;

        end = end > this.filteredSchedules.length
          ? this.filteredSchedules.length
          : end;

        this.schedules.push(
          ...this.filteredSchedules.slice(start, end)
        );

        if (this.loaded < this.schedules.length) {
          this.loaded = this.schedules.length;
        }
      }
      // else {
      //   const toast = await this.toastCtrl.create({
      //     message: 'All data has been loaded',
      //     duration: 3000,
      //     color: 'dark',
      //     mode: 'ios',
      //     position: 'bottom',
      //   });

      //   toast.present();
      // }

      event.target.complete();
    }, 500);
  }

  openPreview(scheduleTrxId: string) {
    const data = JSON.stringify({ scheduleTrxId });
    return this.router.navigate(['form-preview', { data }]);
  }

  async openForm(asset: any, type: string = 'data-hold') {
    if (type === 'data-hold') {
      const data = JSON.stringify({
        data: asset.assetId,
        offset: -1,
      });

      this.router.navigate(['scan-form', { data }]);
    }

    if (type === 'coordinat') {
      const loader = await this.loadingCtrl.create({
        message: 'Get location ...',
        mode: 'ios',
      });

      loader.present();

      try {
        const { coords } = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 2000
        });

        const assetTag = asset.assetTags
          .find((tag: any) => tag.assetTaggingType === 'coordinat');

        const [latitude, longitude] = assetTag?.assetTaggingValue
          ?.split?.(',')
          .map((coord: string) => coord.trim())
          .map((coord: string) => this.utils.parseFloat(coord))
          || [0, 0];

        const from = point([coords.latitude, coords.longitude]);
        const to = point([latitude, longitude]);
        const units = 'kilometers';

        const distance = turf_distance(from, to, { units }) * 1000;

        if (distance <= 50) {
          const data = JSON.stringify({
            type: 'coordinat',
            data: asset.assetId,
            offset: -1,
          });

          this.router.navigate(['scan-form', { data }]);
        } else {
          const alert = await this.utils.createCustomAlert({
            type: 'warning',
            header: 'Oops',
            message:
              'Your location is too far from the asset, try to get closer and try again!',
            buttons: [{
              text: 'Close',
              handler: () => alert.dismiss()
            }],
          });
        }
      } catch (error) {
        const alert = await this.utils.createCustomAlert({
          type: 'error',
          header: 'Error',
          message: error.message
            || 'An error occurred while getting the location',
          buttons: [{
            text: 'Close',
            handler: () => alert.dismiss()
          }],
        });
      } finally {
        loader.dismiss();
      }
    }
  }

  openFilter() {
    return this.menuCtrl.open('filter-assets');
  }

  onSearch(event?: any) {
    if (event) {
      this.shared.filterOptions.keyword = event.detail.value;
    }

    this.filteredSchedules = this.sourceSchedules.filter((schedule) => {
      let condition = {
        uploaded: schedule.isUploaded,
        unuploaded: schedule.isUnuploaded,
        holded: schedule.hasRecordHold
      }[this.segment];

      condition = condition && schedule.assetNumber?.toLowerCase?.()
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
        condition =
          condition &&
          !Boolean(
            filteredData
              .map(({ key, values }) =>
                intersection(
                  schedule[key]?.map?.((item: any) => item.id),
                  values
                )
              )
              .find((data) => data.length === 0)
          );
      }

      return condition;
    });

    this.schedules = this.filteredSchedules.slice(0, this.loaded);
    console.log('schedules', this.schedules);

  }

  async getSchedules() {
    try {
      const resultSchedules = await this.database.select(
        'schedule',
        {
          column: [
            'scheduleTrxId',
            'scheduleFrom',
            'scheduleTo',
            'schedule.schManual as schManual',
            'schedule.schType as schType',
            'schWeeks',
            'schWeekDays',
            'schDays',
            'syncAt',
            'scannedEnd',
            'schedule.assetId as assetId',
            'assetNumber',
            'schedule.assetStatusId as assetStatusId',
            'schedule.assetStatusName as assetStatusName',
            'tagId',
            'tagNumber',
            // 'tagLocationId',
            // 'tagLocationName',
          ],
          groupBy: ['scheduleTrxId']
        }
      );

      const now = this.utils.getTime();
      const dateInThisMonth = this.getDateInThisMonth(now);
      const lastWeek = Math.max(...dateInThisMonth.map(item => item.week));
      const schedules = this.database.parseResult(resultSchedules)
        .filter(schedule => this.filterSchedule(schedule, now, dateInThisMonth, lastWeek));

      const assetIds = uniq(schedules.map((schedule) => schedule.assetId));
      const assetTags = await this.getAssetTags(assetIds);
      const holdedRecords = await this.getHoldedRecords(assetIds);

      const scheduleTrxIds = schedules.map((schedule) => schedule.scheduleTrxId);
      const uploadedRecords = await this.getUploadedRecords(scheduleTrxIds);
      const unuploadedRecords = await this.getUnuploadedRecords();

      this.sourceSchedules = schedules
        .map((schedule) => {
          const tagIds = schedule?.tagId?.length
            ? schedule?.tagId?.split?.(',')
            : [];

          const tagNumber = schedule?.tagNumber?.length
            ? schedule?.tagNumber?.split?.(',')
            : [];

          // const tagLocationIds = schedule?.tagLocationId?.length
          //   ? schedule?.tagLocationId?.split?.(',')
          //   : [];

          // const tagLocationNames = schedule?.tagLocationName?.length
          //   ? schedule?.tagLocationName?.split?.(',')
          //   : [];

          const data = {
            scheduleTrxId: schedule.scheduleTrxId,
            assetId: schedule.assetId,
            assetNumber: schedule.assetNumber,
            assetStatusId: schedule.assetStatusId,
            assetStatusName: schedule.assetStatusName,
            assetTags: assetTags
              .filter(assetTag => assetTag.assetId === schedule.assetId),
            shift: null,
            scheduleType: 'Manual',
            scheduleFrom: moment(schedule.scheduleFrom)
              .format('D MMMM YYYY HH:mm'),
            scheduleTo: moment(schedule.scheduleTo)
              .format('D MMMM YYYY HH:mm'),
            uploadedOn: schedule.syncAt != null
              ? moment(schedule.syncAt).format('D MMMM YYYY HH:mm')
              : '-',
            scannedEnd: null,
            tags: zip(tagIds, tagNumber).map(([id, name]) => ({ id, name })),
            // tagLocations: zip(tagLocationIds, tagLocationNames)
            // .map(([id, name]) => ({ id, name })),
            isUploaded: false,
            isUnuploaded: false,
            hasPreview: false,
            hasRecordHold: false
          };

          if (!schedule.scheduleManual) {
            let shiftFormat = 'HH:mm';

            if (schedule.schType?.toLowerCase() === 'weekly') {
              shiftFormat = '[W]-w';
            } else if (schedule.schType?.toLowerCase() === 'monthly') {
              shiftFormat = 'MMMM';
            }

            data.shift = moment(schedule.scheduleFrom).format(shiftFormat);
            data.scheduleType = 'Automatic';
          }

          if (schedule.syncAt != null) { // Uploaded
            data.isUploaded = true;
            data.hasPreview = uploadedRecords.includes(schedule.scheduleTrxId);
            data.scannedEnd = moment(schedule.scannedEnd, 'YYYY-MM-DD HH:mm:ss')
              .format('D MMMM YYYY HH:mm');
          } else if (schedule.scheduleTrxId in unuploadedRecords) { // Unuploaded
            data.isUnuploaded = true;
            data.hasPreview = true;
            const scannedEnd = unuploadedRecords[schedule.scheduleTrxId];

            if (scannedEnd) {
              data.scannedEnd = moment(scannedEnd, 'YYYY-MM-DD HH:mm:ss')
                .format('D MMMM YYYY HH:mm');
            }
          } else if (holdedRecords.includes(schedule.assetId)) { // Holded
            const start = new Date(schedule.scheduleFrom).getTime();
            const end = new Date(schedule.scheduleTo).getTime();
            data.hasRecordHold = moment(now).isBetween(start, end);
          }

          if (!data.scannedEnd) {
            data.scannedEnd = '-';
          }

          return data;
        })
        .filter(schedule => schedule.isUploaded || schedule.isUnuploaded || schedule.hasRecordHold);
    } catch (error) {
      console.error(error);
    } finally {
      this.onSearch();
      this.loading = false;
    }
  }

  private async getUploadedRecords(scheduleTrxIds: string[]) {
    const records: string[] = [];

    try {
      const marks = this.database.marks(scheduleTrxIds.length).join(',');

      const result = await this.database.select('record', {
        column: ['scheduleTrxId'],
        where: {
          query: `isUploaded=? AND scheduleTrxId IN (${marks})`,
          params: [1, ...scheduleTrxIds],
        },
        groupBy: ['scheduleTrxId'],
      });

      records.push(
        ...this.database.parseResult(result).map(record => record.scheduleTrxId)
      );
    } catch (error) {
      console.error(error);
    }

    return records;
  }

  private async getUnuploadedRecords() {
    const unuploadedRecords: any = {};

    try {
      const result = await this.database.select('record', {
        column: [
          'scheduleTrxId',
          'scannedEnd'
        ],
        where: {
          query: `isUploaded=?`,
          params: [0]
        },
        groupBy: ['scheduleTrxId'],
      });

      this.database.parseResult(result).forEach(schedule => {
        unuploadedRecords[schedule.scheduleTrxId] = schedule.scannedEnd;
      });
    } catch (error) {
      console.error(error);
    }

    return unuploadedRecords;
  }

  private async getHoldedRecords(assetIds: string[]) {
    const records: string[] = [];

    try {
      const marks = this.database.marks(assetIds.length).join(',');

      const recordHold = await this.database.select('recordHold', {
        column: ['assetId'],
        where: {
          query: `assetId IN (${marks})`,
          params: assetIds,
        },
        groupBy: ['assetId'],
      });

      const recordAtachmentHold = await this.database.select('recordAttachment', {
        column: ['trxId'],
        where: {
          query: `isUploaded=? AND trxId IN (${marks})`,
          params: [-1, ...assetIds],
        },
        groupBy: ['trxId'],
      });

      records.push(...uniq([
        ...this.database.parseResult(recordHold).map((record) => record.assetId),
        ...this.database.parseResult(recordAtachmentHold).map((attachment) => attachment.key),
      ]));
    } catch (error) {
      console.error(error);
    }

    return records;
  }

  private async getAssetTags(assetIds: string[]) {
    const assetTags: any[] = [];

    try {
      const marks = this.database.marks(assetIds.length).join(',');

      const result = await this.database.select('assetTag', {
        column: [
          'assetId',
          'assetTaggingType',
          'assetTaggingValue'
        ],
        where: {
          query: `assetId IN (${marks})`,
          params: assetIds,
        },
      });

      assetTags.push(
        ...this.database.parseResult(result)
      );
    } catch (error) {
      console.error(error);
    }

    return assetTags;
  }

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

    // this.sourceSchedules.forEach((asset) => {
    //   this.shared.filterOptions.data
    //     .forEach((filter) => {
    //       filter.values = unionBy(
    //         filter.values,
    //         asset[filter.key]
    //           .map(({ id, name }) => ({
    //             text: name,
    //             value: id,
    //             selected: false,
    //           })),
    //         'value'
    //       );
    //     });
    // });
  }

  private filterSchedule(schedule: any, now: number, dateInThisMonth: any[], lastWeek: number) {
    const schType = schedule.schType?.toLowerCase?.();
    const weekdays = schedule?.schWeekDays ? schedule.schWeekDays?.toLowerCase?.().split(',') : [];

    if (schType === 'weekly') {
      const dateNow = dateInThisMonth.find(item => item.date === moment(now).date());
      const isWeekNow = moment(now).week() === moment(schedule.scheduleFrom, 'YYYY-MM-DD HH:mm:ss').week();
      return isWeekNow && weekdays.includes(dateNow?.day);
    }

    if (schType === 'monthly') {
      let isIncluded = true;

      const isMonthNow =
        moment(now).month() ===
        moment(schedule.scheduleFrom, 'YYYY-MM-DD HH:mm:ss').month();

      if (schedule.schWeeks || schedule.schWeekDays) {
        const weeks = this.getSchWeeksAndDays(schedule.schWeeks, lastWeek);
        const dateNow = dateInThisMonth.find(item => item.date === moment(now).date());
        const matchWeek = weeks.includes(dateNow?.week);
        const matchWeekDay = weekdays.includes(dateNow?.day);

        isIncluded = matchWeek && matchWeekDay;
      }

      if (schedule.schDays) {
        const schDays = schedule.schDays
          ? schedule.schDays?.toLowerCase?.().split(',')
          : [];

        const checkLast = schDays?.includes?.('last');
        isIncluded = schDays?.includes?.(moment(now).date().toString());

        if (checkLast) {
          const lastDateInThisMonth = moment(now)
            .month(moment(now).month() + 1)
            .date(0)
            .date();

          isIncluded = isIncluded || moment(now).date() === lastDateInThisMonth;
        }
      }

      return isMonthNow && isIncluded;
    }

    return true;
  }

  private getDateInThisMonth(now: number) {
    const end = moment(now)
      .month(moment(now).month() + 1)
      .date(0)
      .date();

    const dateInThisMonth = this.utils.generateArray(end)
      .map(item => {
        const date = moment(now).date(item);
        const day = date.format('dd').toLowerCase();
        const week = date.week();

        return { date: item, day, week };
      });

    const [firstDay] = dateInThisMonth;
    const firstWeek = firstDay.week;
    const maxWeek = Math.max(...dateInThisMonth.map(item => item.week));

    return dateInThisMonth.map(item => {
      item.week = item.week - (firstWeek - 1);

      if (item.week < 1) {
        item.week = item.week + maxWeek;
      }

      return item;
    });
  }

  private getSchWeeksAndDays(schWeeks: string, lastWeek: number) {
    let weeks: any[] = schWeeks ? schWeeks?.toLowerCase?.().split(',') : [];

    weeks = weeks.map(item => {
      if (item === 'first') {
        item = 1;
      } else if (item === 'second') {
        item = 2;
      } else if (item === 'third') {
        item = 3;
      } else if (item === 'fourth') {
        item = 4;
      } else if (item === 'fifth') {
        item = 5;
      } else if (item === 'last') {
        item = lastWeek;
      }

      return item;
    });

    return weeks;
  }
}
