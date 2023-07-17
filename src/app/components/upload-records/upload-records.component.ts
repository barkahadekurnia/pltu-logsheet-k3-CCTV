import { Component, OnInit } from '@angular/core';
import { Platform, NavParams, PopoverController } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database/database.service';
import { HttpService } from 'src/app/services/http/http.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { SharedService } from 'src/app/services/shared/shared.service';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-upload-records',
  templateUrl: './upload-records.component.html',
  styleUrls: ['./upload-records.component.scss'],
})
export class UploadRecordsComponent implements OnInit {
  id: string;

  assetId: string;
  assetName: string;
  scheduleTrxId: string;

  loading: boolean;
  remember: boolean;
  uploadStatus: string;

  constructor(
    public shared: SharedService,
    private platform: Platform,
    private navParams: NavParams,
    private popoverCtrl: PopoverController,
    private database: DatabaseService,
    private http: HttpService,
    private utils: UtilsService,
    private routeCtrl:Router,
  ) {
    this.loading = true;
    this.remember = false;
  }

  ngOnInit() {
    this.id = this.navParams.get('id');

    const data = this.navParams.get('data');
    this.assetId = data?.assetId;
    this.assetName = data?.assetName;
    this.scheduleTrxId = data?.scheduleTrxId;

    this.platform.ready().then(() => {
      this.getData().finally(async () => {
        for (const record of this.shared.records) {
          if (record.requests.find((request: any) => request.status === 'failed')) {
            record.status = 'uploading';
          }
        }

        for (const record of this.shared.records) {
          for (const index of record.requests.keys()) {
            if (['initial', 'failed'].includes(record.requests[index].status) && record.requests[index].type === 'record') {
              await this.uploadRecords(record, index);
            } else if (['initial', 'failed'].includes(record.requests[index].status)) {
              await this.uploadRecordAttachments(record, index);
            }
          }

          if (record.requests.find((request: any) => request.status === 'uploading')) {
            record.status = 'uploading';
          } else if (!record.requests.find((request: any) => request.status === 'failed')) {
            record.status = 'success';
          } else {
            record.status = 'failed';
          }
        };

        if (this.shared.records.find(r => r.status === 'uploading')) {
          this.uploadStatus = 'uploading';
        } else if (!this.shared.records.find(r => r.status === 'failed')) {
          this.uploadStatus = 'success';
        } else {
          this.uploadStatus = 'failed';
        }

        this.shared.onUploadRecordsCompleted();
      });
    });
  }

  async getData() {
    try {
      this.uploadStatus = 'uploading';
      this.shared.records = this.shared.records.filter(r => r.status !== 'success')
        .map(r => {
          const status = r.status === 'uploading' ? 'initial' : r.status;

          const requests = r.requests.map((request: any) => {
            const requestStatus = request.status === 'uploading' ? 'initial' : request.status;
            return { ...request, status: requestStatus };
          });

          return { ...r, status, requests };
        });

      const record = {
        scheduleTrxId: this.scheduleTrxId,
        assetId: this.assetId,
        assetName: this.assetName,
        status: 'uploading',
        decimal: 0,
        percentage: 0,
        requests: [{
          type: 'record',
          status: 'initial',
          data: await this.getUnuploadedRecords(this.scheduleTrxId)
        }]
      };

      record.requests.push(...
        (await this.getUnuploadedRecordAttachments(this.scheduleTrxId))
          .map(item => ({
            type: 'recordAttachment',
            status: 'initial',
            data: item
          }))
      );

      this.shared.records.push(record);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async retry() {
    this.uploadStatus = 'uploading';

    for (const record of this.shared.records) {
      if (record.requests.find((request: any) => request.status === 'failed')) {
        record.status = 'uploading';
      }
    }

    for (const record of this.shared.records) {
      for (const index of record.requests.keys()) {
        if (record.requests[index].status === 'failed' && record.requests[index].type === 'record') {
          await this.uploadRecords(record, index);
        } else if (record.requests[index].status === 'failed') {
          await this.uploadRecordAttachments(record, index);
        }
      }

      if (record.requests.find((request: any) => request.status === 'uploading')) {
        record.status = 'uploading';
      } else if (!record.requests.find((request: any) => request.status === 'failed')) {
        record.status = 'success';
      } else {
        record.status = 'failed';
      }
    };

    if (this.shared.records.find(r => r.status === 'uploading')) {
      this.uploadStatus = 'uploading';
    } else if (!this.shared.records.find(r => r.status === 'failed')) {
      this.uploadStatus = 'success';
    } else {
      this.uploadStatus = 'failed';
    }

    this.shared.onUploadRecordsCompleted();
  }

  dismissPopover() {
    if (this.remember) {
      this.shared.setActionAfterSave('local');
    }

    return this.popoverCtrl.dismiss(undefined, undefined, this.id);
  }

  private async getUnuploadedRecords(scheduleTrxId: string) {
    const records: any[] = [];

    try {
      const now = this.utils.getTime();
      const syncAt = moment(now).format('YYYY-MM-DD HH:mm:ss');

      const result = await this.database.select('record', {
        where: {
          query: 'scheduleTrxId=? AND isUploaded=?',
          params: [scheduleTrxId, 0]
        }
      });

      records.push(
        ...this.database.parseResult(result)
          .map(record => ({
            trxId: record.trxId,
            scheduleTrxId: record.scheduleTrxId,
            parameterId: record.parameterId,
            value: record.value, syncAt,
            scannedAt: record.scannedAt,
            scannedEnd: record.scannedEnd,
            scannedBy: record.scannedBy,
            scannedWith: record.scannedWith,
            scannedNotes: record.scannedNotes,
            condition: record.condition
          }))
      );
    } catch (error) {
      console.error(error);
    }

    return records;
  }

  private async getUnuploadedRecordAttachments(scheduleTrxId: string) {
    const recordAttachments: any[] = [];

    try {
      const result = await this.database.select('recordAttachment', {
        where: {
          query: 'scheduleTrxId=? AND isUploaded=?',
          params: [scheduleTrxId, 0]
        }
      });

      recordAttachments.push(
        ...this.database.parseResult(result)
          .map(attachment => ({
            recordAttachmentId: attachment.recordAttachmentId,
            scheduleTrxId: attachment.key,
            trxId: attachment.trxId || null,
            notes: attachment.notes,
            type: attachment.type,
            filePath: attachment.filePath,
            timestamp: attachment.timestamp
          }))
      );
    } catch (error) {
      console.error(error);
    }

    return recordAttachments;
  }

  private uploadRecords(record: any, index: number) {
    record.status = 'uploading';
    record.requests[index].status = 'uploading';
console.log('record',record);
console.log('index',index);
console.log('all',record.requests[index].data);
    return this.http.requests({
      requests: [() => this.http.uploadRecords(record.requests[index].data)],
      onSuccess: ([response]) => {
        if (response.status >= 400) {
          throw response;
        }

        const uploaded = response.data?.data?.sch200
          ?.map?.((schedule: any) => schedule.scheduleId);

        const activityLogs = response.data?.data?.sch200
          ?.map?.((schedule: any) => ({
            scheduleTrxId: schedule.scheduleId,
            status: 'success',
            message: 'Success add data'
          }))
          || [];

        activityLogs.push(...(
          response?.data?.data?.sch404
            ?.map?.((schedule: any) => ({
              scheduleTrxId: schedule.scheduleId,
              status: 'failed',
              message: 'Failed to add data'
            }))
          || []
        ));

        if (uploaded?.length) {
          const now = this.utils.getTime();
          const marks = this.database.marks(uploaded.length).join(',');

          const where = {
            query: `scheduleTrxId IN (${marks})`,
            params: uploaded
          };

          this.database.update(
            'schedule',
            { syncAt: moment(now).format('YYYY-MM-DD HH:mm:ss') },
            where
          );

          this.database.update('record', { isUploaded: 1 }, where);

          record.requests[index].status = 'success';
        } else {
          record.requests[index].status = 'failed';
        }

        this.shared.addLogActivity({
          activity: 'User uploads recording data to server',
          data: activityLogs
        });
      },
      onError: (error) => {
        record.requests[index].status = 'failed';

        this.shared.addLogActivity({
          activity: 'User uploads recording data to server',
          data: [{
            scheduleTrxId: record.scheduleTrxId,
            status: 'failed',
            message: this.http.getErrorMessage(error)
          }]
        });
      },
      onComplete: () => {
        const uploaded = record.requests.filter((request: any) => request.status === 'success').length;
        record.decimal = record.requests.length ? uploaded / record.requests.length : 0;
        record.percentage = Math.round(record.decimal * 100);
        this.dismissPopover()
        this.routeCtrl.navigate(['transactions'])
      }
    });
  }

  private uploadRecordAttachments(record: any, index: number) {
    record.status = 'uploading';
    record.requests[index].status = 'uploading';
    const { recordAttachmentId, ...data } = record.requests[index].data;

    return this.http.requests({
      requests: [() => this.http.uploadRecordAttachment(data)],
      onSuccess: ([response]) => {
        if (response.status >= 400) {
          throw response;
        }

        record.requests[index].status = 'success';

        this.database.update(
          'recordAttachment',
          { isUploaded: 1 },
          {
            query: `recordAttachmentId=?`,
            params: [recordAttachmentId]
          }
        );

        this.shared.addLogActivity({
          activity: 'User uploads recording data to server',
          data: [{
            recordAttachmentId,
            status: 'success',
            message: `Success upload record attachment`
          }]
        });
      },
      onError: (error) => {
        record.requests[index].status = 'failed';

        this.shared.addLogActivity({
          activity: 'User uploads recording data to server',
          data: [{
            recordAttachmentId,
            status: 'failed',
            message: error?.data
              ? this.http.getErrorMessage(error.data)
              : this.http.getErrorMessage(error)
          }]
        });
      },
      onComplete: () => {
        const uploaded = record.requests.filter((request: any) => request.status === 'success').length;
        record.decimal = record.requests.length ? uploaded / record.requests.length : 0;
        record.percentage = Math.round(record.decimal * 100);
        console.log('sukses');
        
      }
    });
  }
}
