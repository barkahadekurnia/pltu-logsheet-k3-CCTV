/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit } from '@angular/core';

import { Platform, NavController } from '@ionic/angular';

import { Capacitor } from '@capacitor/core';

import { chain, uniq, uniqBy } from 'lodash';
import * as moment from 'moment';

import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.page.html',
  styleUrls: ['./schedules.page.scss'],
})

export class SchedulesPage implements OnInit {
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
  segment: 'automatic' | 'manual';
  datakategori: any[];

  constructor(
    private platform: Platform,
    private database: DatabaseService,
    public shared: SharedService,
    private utils: UtilsService,
    private navCtrl: NavController,
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
    this.loading = true;
    this.isAssetsExpanded = false;
    this.isFirstEnter = true;
    this.selectedDate = {};
    this.segment = 'manual';
    // this.shared.setBackButtonVisible = true;
  }

  ngOnInit() {
    this.shared.onUploadRecordsCompleted = () =>
      this.getManualSchedules();
    this.getKategori();
  }

  ionViewWillEnter() {
    // if (this.router.url.includes('tabs')) {
    //   this.shared.setBackButtonVisible = false;
    // }
    this.platform.ready().then(() => {
      this.getManualSchedules();
      this.getKategori();
    });
  }

  ionViewWillLeave() {

  }

  doRefresh(e: any) {
    this.getManualSchedules().finally(() => e.target.complete());
    this.getKategori().finally(() => e.target.complete());
    // this.selectDate(this.calendar?.daysInThisMonth)

  }

  async onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

  selectDate(item: any) {
    this.selectedDate.selected = false;

    console.log('selectDate', item);

    this.selectedDate = item;
    this.selectedDate.selected = true;
    console.log('this.selectedDate ', this.selectedDate);

    this.calendar.date = new Date(
      this.calendar.date.getFullYear(),
      this.calendar.date.getMonth(),
      this.selectedDate.date
    );

    const schdata1 = this.selectedDate.schedules;

    // Group the elements of Array based on `color` property
    // .groupBy("color")
    const grup = uniqBy(schdata1, 'areaId');
    console.log('grup ', grup);
    this.selectedDate.lokasi = grup;
    const filteredSchedule = [];
    const isigrup = [];
    const isifilter = [];
    console.log('cek per tgl :', schdata1);


    grup.forEach((values) => {
      isigrup.push(values);
    });
    isigrup.forEach((b, ind) => {
      const schdatalokasi = schdata1.filter((v) => v.area === b.area && v.unit === b.unit);
      this.datakategori.forEach((value, i) => {
        const scanned = schdatalokasi.filter((f) => f.assetCategoryId === value.assetCategoryId && f.isUploaded === true);
        const unscanned = schdatalokasi.filter((f) => f.assetCategoryId === value.assetCategoryId && f.isUploaded === false);
        const data = {
          countScanned: scanned.length,
          scanned,
          countUnscanned: unscanned.length,
          unscanned,
          index: ind
        };
        filteredSchedule.push(data);
      });
    });

    this.countsc = chain(filteredSchedule).groupBy('index').map(res => res).value();
    console.log(chain(this.countsc).groupBy('index').map(res => res).value());

    console.log('isigr', isigrup);
    console.log('countsc', this.countsc);
  }

  showNextMonth(item?: any) {
    let date = item?.date;

    if (date == null) {
      const maxDate = new Date(
        this.calendar.date.getFullYear(),
        this.calendar.date.getMonth() + 2,
        0
      ).getDate();

      date = this.calendar.date.getDate() > maxDate
        ? maxDate
        : this.calendar.date.getDate();
    }

    this.showCalendar(
      new Date(
        this.calendar.date.getFullYear(),
        this.calendar.date.getMonth() + 1,
        date
      )
    );
  }
  showLastMonth(item?: any) {
    let date = item?.date;

    if (date == null) {
      const maxDate = new Date(
        this.calendar.date.getFullYear(),
        this.calendar.date.getMonth(),
        0
      ).getDate();

      date = this.calendar.date.getDate() > maxDate
        ? maxDate
        : this.calendar.date.getDate();
    }

    this.showCalendar(
      new Date(
        this.calendar.date.getFullYear(),
        this.calendar.date.getMonth() - 1,
        date
      )
    );
  }

  private async getKategori() {
    try {
      const result = await this.database.select('category', {
        column: [
          'assetCategoryId',
          'assetCategoryName',
          'description',
          'kode',
          'urlImage',
          'urlOffline'
        ]
      });


      const category = this.database.parseResult(result)
        .map(kat => {
          const data = {
            assetCategoryId: kat?.assetCategoryId,
            assetCategoryName: kat?.assetCategoryName,
            description: kat?.description,
            kode: kat?.kode,
            urlImage: kat?.urlImage,
            urlOffline: Capacitor.convertFileSrc('file://' + kat?.urlOffline)
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

  private async getManualSchedules() {
    this.schedules = [];
    try {
      this.schedules = [];
      const result = await this.database.select(
        'schedule',
        {
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
            'date',
            'assetCategoryId',
            'assetCategoryName'
          ],
          // where: {
          //   query: 'schedule.schManual=?',
          //   params: [1],
          // },
          // groupBy: ['scheduleTrxId'],
        }
      );

      const schedules = this.database.parseResult(result);
      const assetIds = uniq(schedules.map(schedule => schedule.assetId));
      const assetTags = await this.getAssetTags(assetIds);
      const holdedRecords = await this.getHoldedRecords(assetIds);

      const scheduleTrxIds = schedules.map(schedule => schedule.scheduleTrxId);
      const uploadedRecords = await this.getUploadedRecords(scheduleTrxIds);
      const unuploadedRecords = await this.getUnuploadedRecords(scheduleTrxIds);

      for (const schedule of schedules) {
        const data = {
          scheduleTrxId: schedule.scheduleTrxId,
          abbreviation: schedule.abbreviation,
          approvedAt: schedule.approvedAt,
          approvedBy: schedule.approvedBy,
          approvedNotes: schedule.approvedNotes,
          assetId: schedule.approvedBy,
          areaId: schedule.areaId,
          assetNumber: schedule.assetNumber,
          assetName: schedule.assetNumber,
          condition: schedule.condition,
          supplyDate: schedule.supplyDate,
          area: schedule.area,
          latitude: schedule.latitude,
          longitude: schedule.longitude,
          detailLocation: schedule.detailLocation,
          tagNumber: schedule.tagNumber,
          scannedAt: schedule.scannedAt,
          scannedBy: schedule.scannedBy,
          scannedEnd: schedule.scannedEnd,
          scannedNotes: schedule.scannedNotes,
          scannedWith: schedule.scannedWith,
          tagId: schedule.tagId,
          unit: schedule.unit,
          assetStatusId: schedule.assetStatusId,
          assetStatusName: schedule.assetStatusName,
          assetTags: assetTags.filter(assetTag => assetTag.assetId === schedule.assetId),
          scheduleFrom: moment(schedule.date).format('D MMMM YYYY HH:mm'),
          scheduleTo: moment(schedule.scheduleTo).format('D MMMM YYYY HH:mm'),
          adviceDate: schedule.date
            ? moment(schedule.date).format('D MMMM YYYY')
            : moment(schedule.date).format('D MMMM YYYY'),
          isUploaded: false,
          isUnuploaded: false,
          hasPreview: false,
          hasRecordHold: false,
          hasCoordinatTagging: false,
          isUnscanned: false,
          assetCategoryId: schedule.assetCategoryId,
          assetCategoryName: schedule.assetCategoryName,
          syncAt: schedule.syncAt
        };

        const now = this.utils.getTime();
        const start = new Date(schedule.scheduleFrom).getTime();
        const end = new Date(schedule.scheduleTo).getTime();
        const isScheduleNow = moment(now).isBetween(start, end);

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
          data.hasRecordHold = isScheduleNow;
          data.isUnscanned = !data.hasRecordHold;
        } else { // Unscanned
          data.isUnscanned = true;

          if (isScheduleNow) {
            data.hasCoordinatTagging = Boolean(
              assetTags.find(
                (tag: any) =>
                  tag.assetId === schedule.assetId &&
                  tag.assetTaggingType === 'coordinat'
              )
            );
          }
        }

        this.schedules.push(data);
      }

    } catch (error) {
      console.error(error);
    } finally {
      if (this.calendar.date == null) {
        const now = this.utils.getTime();
        this.calendar.date = new Date(now);
      }

      this.showCalendar(this.calendar.date);
      this.loading = false;
      console.log('schedules', this.schedules);
    }
  }

  private showCalendar(date: Date) {
    try {
      this.calendar.date = date;
      this.calendar.daysInLastMonth = [];
      this.calendar.daysInThisMonth = [];
      this.calendar.daysInNextMonth = [];
      this.calendar.title = moment(date).format('MMMM');

      const firstDayOnThisMonth = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      ).getDay();

      const lastDayOnThisMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDay();

      const prevMonthDays = new Date(
        date.getFullYear(),
        date.getMonth(),
        0
      ).getDate();

      const thisMonthDays = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();

      for (let i = prevMonthDays - (firstDayOnThisMonth - 1); i <= prevMonthDays; i++) {
        this.calendar.daysInLastMonth.push({
          date: i,
          label: moment()
            .year(date.getFullYear())
            .month(date.getMonth() - 1)
            .date(i)
            .format('D MMMM YYYY'),
          schedules: [],
          hasUploaded: false,
          hasUnuploaded: false,
          hasUnscanned: false,
          selected: false
        });
      }

      for (let i = 1; i <= thisMonthDays; i++) {
        const label = moment()
          .year(date.getFullYear())
          .month(date.getMonth())
          .date(i)
          .format('D MMMM YYYY');

        const schedulesPerDate = this.schedules
          .filter(schedule => schedule.adviceDate === label);
        // console.log('schedulesPerDate', param);
        this.calendar.daysInThisMonth.push({
          date: i,
          label,
          schedules: schedulesPerDate,
          hasUploaded: Boolean(
            schedulesPerDate.find(schedule => schedule.isUploaded)
          ),
          hasUnuploaded: Boolean(
            schedulesPerDate.find(schedule => schedule.isUnuploaded)
          ),
          hasRecordHold: Boolean(
            schedulesPerDate.find(schedule => schedule.hasRecordHold)
          ),
          hasUnscanned: Boolean(
            schedulesPerDate.find(schedule => schedule.isUnscanned)
          ),
          selected: false
        });

        // this.selectDate(this.calendar?.daysInThisMonth)

      }

      console.log('daysInThisMonth', this.calendar.daysInThisMonth);


      for (let i = 1; i <= 6 - lastDayOnThisMonth; i++) {
        this.calendar.daysInNextMonth.push({
          date: i,
          label: moment()
            .year(date.getFullYear())
            .month(date.getMonth() + 1)
            .date(i)
            .format('D MMMM YYYY'),
          schedules: [],
          hasUploaded: false,
          hasUnuploaded: false,
          hasUnscanned: false,
          selected: false
        });
      }
      const datein = moment().format('DD');
      // eslint-disable-next-line radix
      const idx = parseInt(datein) - 1;
      this.selectDate(this.calendar?.daysInThisMonth[idx]);
    } catch (error) {
      console.error(error);
    } finally {
      this.selectedDate = this.calendar.daysInThisMonth
        .find(item => item.date === date.getDate());

      if (this.selectedDate) {
        this.selectedDate.selected = true;
      }
    }
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
          params: assetIds
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

      const recordAtachmentHold = await this.database.select(
        'recordAttachment',
        {
          column: ['scheduleTrxId'],
          where: {
            query: `isUploaded=? AND scheduleTrxId IN (${marks})`,
            params: [-1, ...assetIds],
          },
          groupBy: ['scheduleTrxId'],
        }
      );

      records.push(...uniq([
        ...this.database.parseResult(recordHold).map((record) => record.assetId),
        ...this.database.parseResult(recordAtachmentHold).map((attachment) => attachment.key)
      ]));
    } catch (error) {
      console.error(error);
    }

    return records;
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

  navPage(path, params, listDataScan) {
    this.navCtrl.navigateForward(path, { state: { params, listDataScan } });
  }
  navPageAset(path, params, listDataScan, kategori, countsc) {
    console.log('params klik', params)
    console.log('listDataScan klik', listDataScan)
    console.log('kategori klik', kategori)
    console.log('countsc klik', countsc)

    this.navCtrl.navigateForward(path, { state: { params, listDataScan, kategori, countsc } });
  }

}
