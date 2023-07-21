import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database/database.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transaction-detail',
  templateUrl: './transaction-detail.page.html',
  styleUrls: ['./transaction-detail.page.scss'],
})
export class TransactionDetailPage implements OnInit {
  isHeaderVisible: boolean;
  transaction: any;
  // parameter: {
  //   condition: string,
  //   isUploaded: string,
  //   parameterId: string,
  //   recordId: string,
  //   scannedAt: string,
  //   scannedBy: string,
  //   scannedEnd: string,
  //   scannedNotes: string,
  //   scannedWith: string,
  //   scheduleTrxId: string,
  //   syncAt: string,
  //   trxId: string,
  //   value: string,
  // };
  parameter: any[];
  dataParent: {
    assetId: string,
    assetNumber: string,
    assetStatusId: string,
    assetStatusName: string,
    assetTags: any[],
    hasPreview: boolean,
    hasRecordHold: boolean,
    isUnuploaded: boolean,
    isUploaded: boolean,
    scannedEnd: string,
    scheduleFrom: string,
    scheduleTo: string,
    scheduleTrxId: string,
    scheduleType: string,
    shift: string,
    uploadedOn: string,
    abbreviation: string,
    adviceDate: string,
    approvedAt: string,
    approvedBy: string,
    approvedNotes: string,
    area: string,
    areaId: string,
    assetCategoryId: string,
    assetCategoryName: string,
    capacityValue: string,
    detailLocation: string,
    condition: string,
    created_at: string,
    date  : string,
deleted_at: string,
latitude: string,
longitude: string,
photo: string,
reportPhoto: string,
scannedAccuration: string,
scannedAt: string,
scannedBy: string,
scannedNotes: string,
scannedWith: string,
schDays: string,
schFrequency: string,
schManual: string,
schType: string,
schWeekDays: string,
schWeeks: string,
supplyDate: string,
tagId: string,
unit: string,
unitCapacity: string,
unitId: string
  };
  idSchedule: string;
  constructor(
    private utils: UtilsService,
    private route: ActivatedRoute,
    private database: DatabaseService,
    private platform: Platform,
    private alertCtrl: AlertController,
    private routeCtrl: Router,

  ) {
    this.parameter = [];
    this.dataParent= {
      assetId: '',
      assetNumber: '',
      assetStatusId: '',
      assetStatusName: '',
      assetTags: [],
      hasPreview: false,
      hasRecordHold: false,
      isUnuploaded: false,
      isUploaded: false,
      scannedEnd: '',
      scheduleFrom: '',
      scheduleTo: '',
      scheduleTrxId: '',
      scheduleType: '',
      shift: '',
      uploadedOn: '',
      abbreviation: '',
      adviceDate: '',
      approvedAt: '',
      approvedBy: '',
      approvedNotes: '',
      area: '',
      areaId: '',
      assetCategoryId: '',
      assetCategoryName: '',
capacityValue: '',
detailLocation: '',
condition: '',
created_at: '',
date: '',
deleted_at: '',
latitude: '',
longitude: '',
photo: '',
reportPhoto: '',
scannedAccuration: '',
scannedAt: '',
scannedBy: '',
scannedNotes: '',
scannedWith: '',
schDays: '',
schFrequency: '',
schManual: '',
schType: '',
schWeekDays: '',
schWeeks: '',
supplyDate: '',
tagId: '',
unit: '',
unitCapacity: '',
unitId: '',

    };
    this.idSchedule= '';

    const transitionData = this.utils.parseJson(
      this.route.snapshot.paramMap.get('data')
    );
    this.dataParent = transitionData.data;
    this.idSchedule = transitionData.scheduleId;

    console.log('id schedule ', this.idSchedule);
    console.log('asset id ', this.dataParent.assetId);
    
  }

  ngOnInit() {
    this.getData();
  }

  ionViewWillEnter() {
    this.platform.ready().then(() => {
      this.getData();
    });
  }

  async onScroll(e: any) {
    const val = e.detail.scrollTop > 0;

    if (this.isHeaderVisible !== val) {
      this.isHeaderVisible = val;
    }
  }
  async getData(){
    const resultRecords = await this.database.select(
      'record JOIN parameter ON record.parameterId = parameter.parameterId',
      {
        column: [
          'record.parameterId as parameterId',
          'parameterName',
          'description',
          'recordId' ,
          'condition',
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
        groupBy: ['record.parameterId'],
        where: {
          query: 'scheduleTrxId=?',
          params: [this.idSchedule],
        },
      }
    );
    const record = this.database.parseResult(resultRecords);
    this.parameter = record.map((x)=>{
      const data = {
          'parameterName': x.parameterName,
          'description': x.description,
          'recordId': x.recordId,
          'condition': x.condition,
          'parameterId': x.parameterId,
          'scannedAt': x.scannedAt,
          'scannedBy': x.scannedBy,
          'scannedEnd': x.scannedEnd,
          'scannedNotes': x.scannedNotes,
          'scannedWith': x.scannedWith,
          'scheduleTrxId': x.scheduleTrxId,
          'syncAt': x.syncAt,
          'trxId': x.trxId,
          'value': x.value,
          'isUploaded': x.isUploaded,
      }
      return data;


    });
    console.log('parameter', record);


  }
  async getParam(idParameter){
    const result = await this.database.select('parameter', {
      column: [
          'parameterName',
      ],
      where: {
        query: 'parameterId=?',
        params: [idParameter]
      },
    });
    const param = this.database.parseResult(result);
    // console.log('param', param[0].parameterName);
    // result.then(stuff=>{console.log(stuff)})
    return param[0].parameterName;
  }

   //buat testing
   async deleteTransaksi () {
    try {
      const where = { 
        query: 'scheduleTrxId=?',
        params: [this.idSchedule],
      }

      console.log('deleting data from scheduleTrxId = ', this.idSchedule) ;
      
      await this.database.delete('record', where);
  
      await this.database.delete('recordHold', {
        query: 'assetId=?',
        params: [this.dataParent.assetId],
      });
  
      await this.database.delete('recordAttachment', {
        query: 'scheduleTrxId=?',
        params: [this.idSchedule],
      });
  
      await this.database.delete('recordAttachmentPemadam', {
        query: 'scheduleTrxId=?',
        params: [this.idSchedule],
      });

      console.log('sukses bang delete');

      await this.routeCtrl.navigate(['transactions'])
    } catch (error) {
      
      console.error(error)
    }
   
  }
 
  async confirmDelete() {
    let alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'yakin mau di delete ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('GAJADI DELETE');
          }
        },
        {
          text: 'Yes',
          handler: () => {
            console.log('DELETE DATA BANG');
            this.deleteTransaksi(); // call deleteData()

          }
        }
      ]
    });
    alert.present();
  }

}
