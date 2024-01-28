/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit } from '@angular/core';

import { Platform, NavController } from '@ionic/angular';

import { Capacitor } from '@capacitor/core';

import { reduce, uniq, uniqBy } from 'lodash';
import * as moment from 'moment';

import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { HttpService } from 'src/app/services/http/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.page.html',
  styleUrls: ['./schedules.page.scss'],
})

export class SchedulesPage implements OnInit {
  calendar: {
    date: Date;
    daysInLastMonth: any[];
    daysInThisMonth: any[];
    daysInNextMonth: any[];
    title: string;
  };

  assetCategory: any[];
  schedules: any[];
  dataShiftPerDay: any[];

  isHeaderVisible: boolean;
  loading: boolean;
  selectedDate: any;

  usersData: any;

  constructor(
    private platform: Platform,
    private database: DatabaseService,
    public shared: SharedService,
    private utils: UtilsService,
    private navCtrl: NavController,
    private http: HttpService,
    private router: Router,
  ) {
    this.calendar = {
      date: null,
      daysInLastMonth: [],
      daysInThisMonth: [],
      daysInNextMonth: [],
      title: '',
    };

    // if (router.getCurrentNavigation()) {
    //   const navValues = this.router.getCurrentNavigation();
    //   console.log('navValues ', navValues);
    // }

    this.schedules = [];

    this.isHeaderVisible = false;
    this.loading = true;
    this.selectedDate = {};

    this.usersData = this.shared.user;
  }

  async ngOnInit() {
    await this.platform.ready();
    await this.getManualSchedules();
    await this.getKategori();
  }

  async ionViewWillEnter() {
    await this.platform.ready();
    if (!this.assetCategory?.length) {
      this.getKategori();
    }
  }

  doRefresh(e: any) {
    this.getKategori().finally(() => e.target.complete());
  }

  async onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

  selectDate(item: any) {
    this.selectedDate.selected = false;

    this.scheduleShift(item);

    this.selectedDate = item;
    this.selectedDate.selected = true;

    this.calendar.date = new Date(
      this.calendar.date.getFullYear(),
      this.calendar.date.getMonth(),
      this.selectedDate.date
    );

    const dataSchedulePerDay = this.selectedDate.schedules;
    const dataGroupByAreaId = uniqBy(dataSchedulePerDay, 'areaId');
    this.selectedDate.lokasi = dataGroupByAreaId;

    console.log('this selected date lokasi', this.selectedDate.lokasi)
  }
  
  //barkah maintance add shift schedule
  async scheduleShift(item: any) {
    console.log('item when select date' , item)
    if (item.schedules.length > 0) {
      const loader = await this.utils.presentLoader();

      const idScheduleShift = item.schedules[0].idschedule;

      try {
        const response = await this.http.getSchedulesShift(idScheduleShift);

        if (![200, 201].includes(response.status)) {
          throw response;
        }

        const bodyResponse = response.data?.data;
        this.dataShiftPerDay = bodyResponse;
        console.log('dataShiftPerDay', this.dataShiftPerDay);


      } catch (err) {
        console.error(err);
      } finally {
        await loader.dismiss();
      }
    } else {
      console.log('schedule belum ada, silahkan tanyakan pada admin');
    }
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

  viewAssetsCategory(routerPath: string, schedulePerDay: any[], assetCategory: any[]) {
    this.navCtrl.navigateForward(routerPath, {
      state: {
        schedulePerDay,
        assetCategory
      }
    });
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
        ?.map(kat => {
          const data = {
            assetCategoryId: kat?.assetCategoryId,
            assetCategoryName: kat?.assetCategoryName,
            description: kat?.description,
            kode: kat?.kode,
            urlImage: kat?.urlImage,
           urlOffline: Capacitor.convertFileSrc(kat?.urlOffline)
            //urlOffline:  kat?.urlOffline
          };
          return data;
        });

      this.assetCategory = category;
      console.log('assetCategory', this.assetCategory);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  private async getManualSchedules() {
    this.schedules = [];
    const now = this.utils.getTime();

    try {
      const result = await this.database.select(
        'schedule',
        {
          column: [
            'idschedule',
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
        }
      );

      const schedules = this.database.parseResult(result);
      console.log('isi dari sql lite schedules', schedules)
      const assetIds = uniq(schedules.map(schedule => schedule.assetId));
      const assetTags = await this.getAssetTags(assetIds);
      const holdedRecords = await this.getHoldedRecords(assetIds);

      const scheduleTrxIds = schedules.map(schedule => schedule.scheduleTrxId);
      const uploadedRecords = await this.getUploadedRecords(scheduleTrxIds);
      const unuploadedRecords = await this.getUnuploadedRecords(scheduleTrxIds);

      for (const schedule of schedules) {
        const data = {
          idschedule: schedule.idschedule,
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
          unitId: schedule.unitId,
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

  //barkah maintance add shift schedule
  lowerCaseLetter(string) {
    let lower = ''
    if(string) {
      lower = string.toLowerCase() 
    } 
    return lower
  }

  lowerCaseLetterUnit(string) {
    let split = string.split(' ')

    let depan = split[0].toLowerCase() 
    let belakang = split[1].toUpperCase() 

    let join = depan + ' ' + belakang
    return join
  }

  jumlahAssetShift(shift) {
    //const total = shift.assetData.reduce((a, b) => a + b);
    let total = 0

    for ( let i = 0 ; i < shift.length ; i++) {
      total = total + shift[i].assetData.length
    }

    //console.log('ini total shift di asset', shift.length);
    
    return total
  }
}
