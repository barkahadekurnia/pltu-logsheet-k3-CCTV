import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { HttpService, LaporanData } from 'src/app/services/http/http.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import * as moment from 'moment';
import { intersection, unionBy, uniq, zip, uniqBy, groupBy, orderBy } from 'lodash';
import { DatabaseService } from 'src/app/services/database/database.service';

@Component({
  selector: 'app-laporan-harian-detail',
  templateUrl: './laporan-harian-detail.page.html',
  styleUrls: ['./laporan-harian-detail.page.scss'],
})
export class LaporanHarianDetailPage implements OnInit {
  laporan: {
    approvedAt: string,
    approvedBy: string,
    approvedNotes: string,
    notes: string,
    reportDate: string,
    scannedAt: string,
    scannedBy: string,
    scannedDate: string,
    scannedNotes: string,
    scannedWith: string,
    syncAt: string,
    trxData: any[],
    trxParentId: string
  };
  catatan: string;
  isHeaderVisible: boolean;
  loading: boolean;
  form: LaporanData;

  sourceSchedules: any[];
  schedules:any[];

  constructor(
    private utils: UtilsService,
    private activatedRoute: ActivatedRoute,
    private http: HttpService,
    private alertController: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private database: DatabaseService,

  ) {
    const transitionData = this.utils.parseJson(
      this.activatedRoute.snapshot.paramMap.get('data')
    );
    this.form = {
      reportDate: '',
      parentNotes: ''
    };
    this.isHeaderVisible = false;
    this.laporan= {
      approvedAt: '',
      approvedBy: '',
      approvedNotes: '',
      notes: '',
      reportDate: '',
      scannedAt: '',
      scannedBy: '',
      scannedDate: '',
      scannedNotes: '',
      scannedWith: '',
      syncAt: '',
      trxData: [],
      trxParentId: ''
    };
    this.catatan = '';
    console.log(transitionData)
    this.loading = true;

    this.sourceSchedules = [];
    this.schedules = [] ;

    this.getLocalAssets(transitionData.data);

  }

  ngOnInit() {
    //this.getSchedules() 
  }

  async onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }   
  }

  async send(data){
    const now = this.utils.getTime();
    const time = moment(now).format('YYYY-MM-DD HH:mm:ss');
    // this.form.parentNotes = data;
    // this.form.reportDate = time;
    this.form = {
      reportDate: time,
      parentNotes: data
    };
    console.log('send', data)
    const loader = await this.loadingCtrl.create({
      message: 'Harap Tunggu...',
      spinner: 'dots',
      cssClass: 'dark:ion-bg-gray-800',
      mode: 'ios',
    });

    loader.present();
    try {
      const response = await this.http.kirimlaporan(this.laporan.trxParentId, this.form);
      console.log('respon kirim',response)

      if (response.data?.status !== 200) {
        const alert = await this.utils.createCustomAlert({
          type: 'error',
          header: 'Error',
          message: response.data.messages.error,
          buttons: [{
            text: 'Close',
            handler: () => this.utils.back()
          }]
        })
      alert.present();
      this.utils.back()
        // throw response.data;
      }

      const alert = await this.utils.createCustomAlert({
        type: 'success',
        header: 'Berhasil',
        message: 'Sukses Kirim Laporan',
        buttons: [{
          text: 'Close',
          handler: () =>  alert.dismiss()
        }]
        })
      alert.present();
      this.utils.back()

    } catch (error) {
      const alert = await this.utils.createCustomAlert({
        type: 'error',
        header: 'Error',
        message: this.http.getErrorMessage(error),
        buttons: [{
          text: 'Close',
          handler: () => alert.dismiss()
        }]
      });

      alert.present();
    } finally {
      loader.dismiss();
    }
  }
  async sendModal(){
    const alert = await this.alertController.create({
      header: 'Kirim Laporan',
      buttons: [{
        cssClass: 'buttoncancel',
        text: 'Batal',
        role: 'cancel'
      },{
        cssClass: 'buttonsend',
        text: 'Kirim',
        handler: (data) => this.send(data.note)
      }],
      backdropDismiss: false,
      inputs: [
        {
          name: "note",
          type: 'textarea',
          placeholder: 'Tulis Catatan Disini',
        },
      ],
    });

    await alert.present();

  }
  private async getLocalAssets(id) {
    try {
      this.http.requests({
        requests: [
          () => this.http.getDetailLaporan(id),
        ],
        onSuccess: async ([responseDetail]) => {
          if (responseDetail.status >= 400) {
            throw responseDetail;
          }
          console.log('responseDetail', responseDetail.data.data);
          if(responseDetail?.data?.data){
            this.laporan.approvedAt = responseDetail.data.data.approvedAt;
            this.laporan.approvedBy = responseDetail.data.data.approvedBy;
            this.laporan.approvedNotes = responseDetail.data.data.approvedNotes;
            this.laporan.notes = responseDetail.data.data.notes;
            this.laporan.reportDate = responseDetail.data.data.reportDate;
            this.laporan.scannedAt = responseDetail.data.data.scannedAt;
            this.laporan.scannedBy = responseDetail.data.data.scannedBy;
            this.laporan.scannedDate = responseDetail.data.data.scannedDate;
            this.laporan.scannedNotes = responseDetail.data.data.scannedNotes;
            this.laporan.scannedWith = responseDetail.data.data.scannedWith;
            this.laporan.syncAt = responseDetail.data.data.syncAt;
            this.laporan.trxData = responseDetail.data.data.trxData;
            this.laporan.trxParentId = responseDetail.data.data.trxParentId;
          }
        },
        onError: error => console.error(error)
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async openDetail(item){

    await  this.getSchedules(item);

    console.log('cek detail', item)
    const data = JSON.stringify({
      data: item,
    })
    // const data = JSON.stringify({
    //   data: this.schedules[0],
    //   scheduleId: item.scheduleTrxId,
    //   parentId: item.trxParentId,
    // })

 
    // console.log('data json :', JSON.parse(data));


    // const data = this.schedules[0]
    // JSON.stringify(data)

    // console.log('dataaaaaa' , data);

    return this.router.navigate(['laporan-detail-transaction',  {data} ]);
  }

  async getSchedules(item) {
    try {
      const resultSchedules = await this.database.select(
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
            'photo',
            'assetCategoryId',
            'assetCategoryName'
          ],
          // join:

          where: {
            query: `scheduleTrxId=?`,
            params: [item.scheduleTrxId]
          },
          groupBy: ['scheduleTrxId'],
        }
      );
      const schedules = this.database.parseResult(resultSchedules);
      console.log('schedule', schedules)

      console.log('isi json string',item.scheduleTrxId);
      

      //const filterLaporan = schedules.filter()

      console.log('result schedules',resultSchedules);

      this.schedules= schedules
      

      const resultRecord = await this.database.select(
        'record',
        {
          column: [
          'recordId' ,
          'condition',
          'parameterId',
          'scannedAt',
          'scannedBy',
          'scannedEnd',
          'scannedNotes',
          'scannedWith',
          'scheduleTrxId',
          'syncAt',
          'trxId',
          'value',
          'isUploaded',
          ],
          // join:
          groupBy: ['scheduleTrxId']
        }
      );
      const record = this.database.parseResult(resultRecord);
      console.log('record', record)

      const scheduleTrxIds = record.map((schedule) => schedule.scheduleTrxId);
      console.log('scheduleTrxIds', scheduleTrxIds)
      // const assetIds = uniqBy(scheduleTrxIds);
      // uniq(scheduleTrxIds.map((schedule) => schedule, console.log(schedule)));
      // console.log('assetIds', assetIds)

      const uploadedRecords = await this.getUploadedRecords(scheduleTrxIds);
      console.log('uploadedRecords', uploadedRecords)
      const unuploadedRecords = await this.getUnuploadedRecords();
      console.log('uploadedRecords', unuploadedRecords)

      const now = this.utils.getTime();
      // const dateInThisMonth = this.getDateInThisMonth(now);
      // const lastWeek = Math.max(...dateInThisMonth.map(item => item.week));
      // const schedules = this.database.parseResult(resultSchedules)
      //   .filter(schedule => this.filterSchedule(schedule, now, dateInThisMonth, lastWeek));
        //tes
      const assetIds = uniq(schedules.map((schedule) => schedule.assetId));
      const assetTags = await this.getAssetTags(assetIds);
      const holdedRecords = await this.getHoldedRecords(assetIds);

      // this.sourceSchedules
      this.sourceSchedules = schedules.map((schedule) => {
          const tagIds = schedule?.tagId?.length
            ? schedule?.tagId?.split?.(',')
            : [];

          //console.log('schedule isi ',schedule);
          

          const tagNumber = schedule?.tagNumber;
          const data = {
            scheduleTrxId: schedule.scheduleTrxId,
            assetId: schedule.assetId,
            assetNumber: schedule.assetNumber,
            assetStatusId: schedule.assetStatusId,
            assetStatusName: schedule.assetStatusName,
           // assetTags: assetTags
           //   .filter(assetTag => assetTag.assetId === schedule.assetId),
            shift: null,
            scheduleType: 'Manual',
            scheduleFrom: moment(schedule.scheduleFrom)
              .format('D MMMM YYYY HH:mm'),
            scheduleTo: moment(schedule.scheduleTo)
              .format('D MMMM YYYY HH:mm'),
            uploadedOn: schedule.syncAt != null
              ? moment(schedule.syncAt).format('D MMMM YYYY HH:mm')
              : '-',
            scannedEnd: schedule.scannedEnd,
            tags: zip(tagIds, tagNumber).map(([id, name]) => ({ id, name })),
            isUploaded: false,
            isUnuploaded: false,
            hasPreview: false,
            hasRecordHold: false,
            abbreviation: schedule.abbreviation,
            adviceDate: schedule.adviceDate,
            approvedAt: schedule.approvedAt,
            approvedBy: schedule.approvedBy,
            approvedNotes: schedule.approvedNotes,
            condition: schedule.condition,
            capacityValue: schedule.capacityValue,
            detailLocation: schedule?.detailLocation,
            unitCapacity: schedule.unitCapacity,
            supplyDate: moment(schedule.supplyDate).format('D MMMM YYYY'),
            reportPhoto: schedule.reportPhoto,
            scannedAccuration: schedule.scannedAccuration,
            scannedAt: schedule.scannedAt,
            scannedBy: schedule.scannedBy,
            scannedNotes: schedule.scannedNotes,
            scannedWith: schedule.scannedWith,
            schDays: schedule.schDays,
            schFrequency: schedule.schFrequency,
            schManual: schedule.schManual,
            schType: schedule.schType,
            schWeekDays: schedule.schWeekDays,
            schWeeks: schedule.schWeeks,
            tagId: schedule.tagId,
            photo: schedule.photo,
            unit: schedule.unit,
            unitId: schedule.unitId,
            area: schedule.area,
            areaId: schedule.areaId,
            latitude: schedule.latitude,
            longitude: schedule.longitude,
            created_at: schedule.created_at,
            deleted_at: schedule.deleted_at,
            date: schedule.schedule,
            assetCategoryId: schedule.assetCategoryId,
            assetCategoryName: schedule.assetCategoryName
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
       //.filter(schedule => schedule.isUnuploaded);

        console.log('cek semua', this.sourceSchedules);

       // this.dataSudah = [];

       // this.dataBelum=this.sourceSchedules;
          } catch (error) {
            console.error(error);
          } finally {
         //   this.onSearch();
            this.loading = false;
          }
                  //lodash disini

          const res = orderBy(this.sourceSchedules, [(o) => new Date(o.uploadedOn)], ["desc"]);
          this.sourceSchedules = res
          // [{date:"2022-09-01"},{date:"2022-05-03"},{date:"2021-05-01"}]
          console.log('ini transaksi schedule sorting',res);
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

    console.log('unuploadedRecords',unuploadedRecords);
    

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

}
