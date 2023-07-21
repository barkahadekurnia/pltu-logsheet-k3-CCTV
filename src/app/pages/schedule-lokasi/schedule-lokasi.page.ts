import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { NavController, Platform } from '@ionic/angular';

import { uniq } from 'lodash';
import * as moment from 'moment';

import { DatabaseService } from 'src/app/services/database/database.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';

@Component({
  selector: 'app-schedule-lokasi',
  templateUrl: './schedule-lokasi.page.html',
  styleUrls: ['./schedule-lokasi.page.scss'],
})
export class ScheduleLokasiPage implements OnInit {
  isHeaderVisible: boolean;

  assetCategory: any[];
  schedulePerDay: any[];
  scheduleDetails: any;

  constructor(
    private platform: Platform,
    private database: DatabaseService,
    public shared: SharedService,
    private utils: UtilsService,
    private navCtrl: NavController,
    private router: Router,
  ) {
    this.isHeaderVisible = false;

    this.assetCategory = [];
    this.schedulePerDay = [];

    if (router.getCurrentNavigation().extras.state) {
      const navValues = this.router.getCurrentNavigation().extras.state;
      console.log('navValues ', navValues);
      console.log('navValues LIAT ', this.router.getCurrentNavigation());
      this.assetCategory = navValues?.assetCategory;

      const dataSchedules = navValues?.schedulePerDay;
      this.parseSchedulePerDay(dataSchedules);
    } else {
      this.assetCategory = [];
    }
  }

  ngOnInit() { }

  async parseSchedulePerDay(schedules: any[]) {
    const mappedSchedules = [];
    await this.platform.ready();

    if (!schedules.length) {
      this.assetCategory = [];
      return;
    }

    try {
      const assetIds = uniq(schedules.map((item) => item.assetId));
      const assetTags = await this.getAssetTags(assetIds);
      const holdedRecords = await this.getHoldedRecords(assetIds);

      const scheduleTrxIds = schedules.map((item) => item.scheduleTrxId);
      const uploadedRecords = await this.getUploadedRecords(scheduleTrxIds);
      const unuploadedRecords = await this.getUnuploadedRecords(scheduleTrxIds);

      for (const schedule of schedules) {
        const data = ({
          ...schedule,
          date: moment(schedule.date).format('D MMMM YYYY'),
          scheduleFrom: moment(schedule.date).format('D MMMM YYYY HH:mm'),
          scheduleTo: moment(schedule.scheduleTo)
            .format('D MMMM YYYY HH:mm'),
          adviceDate: moment(schedule.date).format('D MMMM YYYY'),
          isUploaded: false,
          isUnuploaded: false,
          hasPreview: false,
          hasRecordHold: false,
          hasCoordinatTagging: false,
          isUnscanned: false,
        });

        const now = this.utils.getTime();
        const start = new Date(schedule.scheduleFrom).getTime();
        const end = new Date(schedule.scheduleTo).getTime();
        const isScheduleNow = moment(now).isBetween(start, end);

        if (schedule.syncAt != null) { // Uploaded
          data.isUploaded = true;
          data.hasPreview = uploadedRecords?.includes(schedule.scheduleTrxId);
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
        mappedSchedules.push(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.countAssetSchedulePerDay(mappedSchedules);
    }
  }

  async countAssetSchedulePerDay(schedules: any[]) {
    const assetSchedules = [];

    this.assetCategory?.forEach?.((item) => {
      const scanned = schedules?.filter?.(
        (params) =>
          params.assetCategoryId === item.assetCategoryId &&
          params.isUploaded === true
      );
      const unscanned = schedules?.filter?.(
        (params) =>
          params.assetCategoryId === item.assetCategoryId &&
          params.isUploaded === false
      );
      const data = {
        countScanned: scanned.length,
        scanned,
        countUnscanned: unscanned.length,
        unscanned,
        index: 0
      };
      assetSchedules.push(data);
    });
    this.schedulePerDay = assetSchedules;
    this.scheduleDetails = schedules[0];
    console.log('schedulePerDay', this.schedulePerDay);
  }

  async onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }

  navPage(path, paramsm, listDataScan) {
    this.navCtrl.navigateForward(path, { state: { paramsm, listDataScan } });
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }

    return unuploadedRecords;
  }
}
