import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform, LoadingController, MenuController } from '@ionic/angular';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { point } from '@turf/helpers';
import turf_distance from '@turf/distance';
import * as moment from 'moment';

@Component({
  selector: 'app-equipment-schedules',
  templateUrl: './equipment-schedules.page.html',
  styleUrls: ['./equipment-schedules.page.scss'],
})
export class EquipmentSchedulesPage implements OnInit {
  count: {
    uploaded: number;
    unuploaded: number;
    holded: number;
    unscanned: number;
  };

  isHeaderVisible: boolean;
  asset: any;
  loading: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private menuCtrl: MenuController,
    private database: DatabaseService,
    private shared: SharedService,
    private utils: UtilsService
  ) {
    this.count = {
      uploaded: 0,
      unuploaded: 0,
      holded: 0,
      unscanned: 0,
    };

    this.isHeaderVisible = false;
    this.asset = {};
    this.loading = true;
  }

  ngOnInit() {
    this.asset = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );

    if (!this.asset) {
      return this.utils.back();
    }

    this.shared.asset = this.asset;
  }

  ionViewWillEnter() {
    this.platform.ready().then(async () => {
      await this.getAssetTags();
      await this.getSchedules();

      if (this.asset.scheduleGroups.length) {
        await this.menuCtrl.enable(true, 'asset-information');
        await this.menuCtrl.swipeGesture(true, 'asset-information');
      }
    });
  }

  async ionViewWillLeave() {
    await this.menuCtrl.enable(false, 'asset-information');
    await this.menuCtrl.swipeGesture(false, 'asset-information');
  }

  doRefresh(e: any) {
    this.getSchedules().finally(() => e.target.complete());
  }

  onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

  showAssetInfo() {
    return this.menuCtrl.open('asset-information');
  }

  openPreview(scheduleTrxId: string) {
    const data = JSON.stringify({ scheduleTrxId });
    // console.log(scheduleTrxId);
    // console.log('sidata', data);
    return this.router.navigate(['form-preview', { data }]);
  }

  async openForm(type: string = 'data-hold') {
    if (type === 'data-hold') {
      const data = JSON.stringify({
        data: this.asset.assetId
      });

      this.router.navigate(['scan-form', { data }]);
    }

    if (type === 'coordinat') {
      const loader = await this.loadingCtrl.create({
        message: 'Get location ...',
        mode: 'ios'
      });

      loader.present();

      try {
        const { coords } = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 10000
        });

        const assetTag = this.asset.assetTags
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
            data: this.asset.assetId
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
            }]
          });

          alert.present();
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

        alert.present();
      } finally {
        loader.dismiss();
      }
    }
  }

  private async getAssetTags() {
    try {
      const result = await this.database.select('assetTag', {
        column: [
          'assetTaggingType',
          'assetTaggingValue'
        ],
        where: {
          query: 'assetId=?',
          params: [this.asset?.assetId],
        },
      });

      this.asset.assetTags = this.database.parseResult(result);
    } catch (error) {
      console.error(error);
    }
  }

  private async getSchedules() {
    try {
      const count = {
        uploaded: 0,
        unuploaded: 0,
        holded: 0,
        unscanned: 0
      };

      const result = await this.database.select('schedule', {
        column: [
          'scheduleTrxId',
          'schType',
          'schWeeks',
          'schWeekDays',
          'schDays',
          'scheduleFrom',
          'scheduleTo',
          'scannedEnd',
          'syncAt',
        ],
        where: {
          query: 'assetId=?',
          params: [this.asset?.assetId]
        },
      });

      const now = this.utils.getTime();
      const dateInThisMonth = this.getDateInThisMonth(now);
      const lastWeek = Math.max(...dateInThisMonth.map(item => item.week));
      const scheduleGroups = [];

      const assetSchedules = this.database.parseResult(result)
        .filter(schedule =>
          this.filterSchedule(schedule, now, dateInThisMonth, lastWeek)
        );

      const hasRecordHold = await this.hasRecordHold(this.asset?.assetId);
      const scheduleTrxIds = assetSchedules.map(schedule => schedule.scheduleTrxId);
      const unuploadedRecords = await this.getUnuploadedRecords(scheduleTrxIds);

      for (const schedule of assetSchedules) {
        let shiftFormat = 'HH:mm';

        if (schedule.schType?.toLowerCase() === 'weekly') {
          shiftFormat = '[W]-w';
        } else if (schedule.schType?.toLowerCase() === 'monthly') {
          shiftFormat = 'MMMM';
        }

        const data = {
          scheduleTrxId: schedule.scheduleTrxId,
          shift: moment(schedule.scheduleFrom).format(shiftFormat),
          scheduleFrom: schedule.scheduleFrom,
          scheduleTo: schedule.scheduleTo,
          scannedEnd: null,
          syncAt: schedule.syncAt,
          isUploaded: false,
          isUnuploaded: false,
          hasPreview: false,
          hasRecordHold: false,
          isUnscanned: false,
          hasCoordinatTagging: false
        };

        const start = new Date(schedule.scheduleFrom).getTime();
        const end = new Date(schedule.scheduleTo).getTime();
        const isScheduleNow = moment(now).isBetween(start, end);

        if (schedule.syncAt != null) { // Uploaded
          count.uploaded++;
          data.isUploaded = true;
          data.hasPreview = await this.hasPreview(schedule.scheduleTrxId);
          data.scannedEnd = moment(schedule.scannedEnd, 'YYYY-MM-DD HH:mm:ss')
            .format('D MMMM YYYY HH:mm');
        } else if (schedule.scheduleTrxId in unuploadedRecords) { // Unuploaded
          count.unuploaded++;
          data.isUnuploaded = true;
          data.hasPreview = true;
          const scannedEnd = unuploadedRecords[schedule.scheduleTrxId];

          if (scannedEnd) {
            data.scannedEnd = moment(scannedEnd, 'YYYY-MM-DD HH:mm:ss')
              .format('D MMMM YYYY HH:mm');
          }
        } else if (hasRecordHold) { // Holded | Unscanned
          data.hasRecordHold = isScheduleNow;
          data.isUnscanned = !data.hasRecordHold;
          const key = data.hasRecordHold ? 'holded' : 'unscanned';
          count[key]++;
        } else { // Unscanned
          data.isUnscanned = true;
          count.unscanned++;

          if (isScheduleNow) {
            data.hasCoordinatTagging = Boolean(
              this.asset.assetTags
                .find((tag: any) => tag.assetTaggingType === 'coordinat')
            );
          }
        }

        const label = schedule.schType?.toLowerCase?.() === 'daily'
          ? moment(schedule.scheduleEnd).format('D MMMM YYYY')
          : schedule.schType;

        const scheduleGroupIndex = scheduleGroups
          .findIndex(group => group.label === label);

        if (scheduleGroupIndex < 0) {
          const scheduleGroup = {
            label,
            date: moment(schedule.scheduleEnd).format('YYYY-MM-DD'),
            schedules: [data]
          };

          scheduleGroups.push(scheduleGroup);
        } else {
          scheduleGroups[scheduleGroupIndex].schedules.push(data);
        }
      }

      this.asset.scheduleGroups = scheduleGroups
        .map(data => {
          const schedules = data.schedules
            .sort((a: any, b: any) => a.scheduleFrom < b.scheduleFrom ? -1 : 1);

          return { ...data, schedules };
        })
        .sort((a: any, b: any) => this.sortScheduleGroups(a, b));

      this.count = count;
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  private async getUnuploadedRecords(scheduleTrxIds: string[]) {
    const unuploadedRecords: any = {};

    try {
      const marks = this.database.marks(scheduleTrxIds.length).join(',');

      const result = await this.database.select('record', {
        column: [
          'scheduleTrxId',
          'scannedEnd'
        ],
        where: {
          query: `isUploaded=? AND scheduleTrxId IN (${marks})`,
          params: [0, ...scheduleTrxIds],
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

  private async hasRecordHold(assetId: string) {
    let hasRecordHold = false;

    try {
      const recordHold = await this.database.select('recordHold', {
        column: ['assetId'],
        where: {
          query: 'assetId=?',
          params: [assetId]
        },
        groupBy: ['assetId'],
        limit: 1,
      });

      const recordAtachmentHold = await this.database.select('recordAttachment', {
        column: ['scheduleTrxId'],
        where: {
          query: 'scheduleTrxId=?',
          params: [assetId]
        },
        groupBy: ['scheduleTrxId'],
        limit: 1,
      });

      hasRecordHold = (recordHold.rows.length + recordAtachmentHold.rows.length) > 0;
    } catch (error) {
      console.error(error);
    }

    return hasRecordHold;
  }

  private async hasPreview(scheduleTrxId: string) {
    let hasPreview = false;

    try {
      const result = await this.database.select('record', {
        column: ['scheduleTrxId'],
        where: {
          query: 'scheduleTrxId=?',
          params: [scheduleTrxId]
        },
        groupBy: ['scheduleTrxId'],
        limit: 1
      });

      hasPreview = result.rows.length > 0;
    } catch (error) {
      console.error(error);
    }

    return hasPreview;
  }

  private sortScheduleGroups(a: any, b: any) {
    const aIsValidDate = moment(a.label, 'D MMMM YYYY').isValid();
    const bIsValidDate = moment(b.label, 'D MMMM YYYY').isValid();

    if (aIsValidDate && bIsValidDate) {
      return a.date < b.date ? -1 : 1;
    }

    if (aIsValidDate && !bIsValidDate) {
      return -1;
    }

    if (!aIsValidDate && bIsValidDate) {
      return 1;
    }

    const order = ['Monthly', 'Weekly'];
    return order.indexOf(a.label) > order.indexOf(b.label) ? -1 : 1;
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
