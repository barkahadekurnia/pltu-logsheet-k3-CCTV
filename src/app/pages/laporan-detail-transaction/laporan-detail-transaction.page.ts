import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database/database.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/services/http/http.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-laporan-detail-transaction',
  templateUrl: './laporan-detail-transaction.page.html',
  styleUrls: ['./laporan-detail-transaction.page.scss'],
})
export class LaporanDetailTransactionPage implements OnInit {
 
  isHeaderVisible: boolean;
  transaction: any;
  parameter: any[];
  dataParent: any;
  idSchedule: string;
  dataAsset:any = {isUploaded:''};
  dataParameter:any = {parameter : [] ,scannedWith:'', scannedBy:''}; 
  public loaded:boolean = false;
  constructor(
    private utils: UtilsService,
    private route: ActivatedRoute,
    private database: DatabaseService,
    private platform: Platform,
    private alertCtrl: AlertController,
    private routeCtrl: Router,
    private http: HttpService,

  ) {
    this.parameter = [];

//     this.dataParent= {
//       assetId: '',
//       assetNumber: '',
//       assetStatusId: '',
//       assetStatusName: '',
//       assetTags: [],
//       hasPreview: false,
//       hasRecordHold: false,
//       isUnuploaded: false,
//       isUploaded: false,
//       scannedEnd: '',
//       scheduleFrom: '',
//       scheduleTo: '',
//       scheduleTrxId: '',
//       scheduleType: '',
//       shift: '',
//       uploadedOn: '',
//       abbreviation: '',
//       adviceDate: '',
//       approvedAt: '',
//       approvedBy: '',
//       approvedNotes: '',
//       area: '',
//       areaId: '',
//       assetCategoryId: '',
//       assetCategoryName: '',
// capacityValue: '',
// detailLocation: '',
// condiuktion: '',
// created_at: '',
// date: '',
// deleted_at: '',
// latitude: '',
// longitude: '',
// photo: '',
// reportPhoto: '',
// scannedAccuration: '',
// scannedAt: '',
// scannedBy: '',
// scannedNotes: '',
// scannedWith: '',
// schDays: '',
// schFrequency: '',
// schManual: '',
// schType: '',
// schWeekDays: '',
// schWeeks: '',
// supplyDate: '',
// tagId: '',
// unit: '',
// unitCapacity: '',
// unitId: '',

//   };
  this.idSchedule= '';

  const transitionData = this.utils.parseJson(
    this.route.snapshot.paramMap.get('data')
  );
  this.dataParent = transitionData.data;
  this.idSchedule = transitionData.scheduleId;

  console.log('id schedule ', this.idSchedule);
  console.log('asset id ', this.dataParent.assetId);
  console.log('data Parent', this.dataParent);
  
}

  ngOnInit() {
    this.getData();
    console.log('loaded',this.loaded)
  }

  // ionViewWillEnter() {
  //   this.platform.ready().then(() => {
  //     // this.getData();
  //   });
  // }

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

    await this.getDetail()
    // const parameter = this.getParameter()
  }

  async getDetail(){
    this.http.requests({
      requests: [
        () => this.http.getAnyData(`${environment.url.assetsid}/${this.dataParent.assetId}`),
        () => this.http.getAnyData(`${environment.url.assetParameterTransaksi}/${this.dataParent.trxParentId}/${this.dataParent.scheduleTrxId}`),
      ],
      onSuccess: async (responses) => {
        const [
          responseAsset,
          responseParameter,
        ] = responses;

        if (![200, 201].includes(responseAsset.status)) {
          throw responseAsset;
        }
        if (![200, 201].includes(responseParameter.status)) {
          throw responseParameter;
        }

        console.log('response Asset' , responseAsset.data.data)
        console.log('response transaksi' , responseParameter.data.data)
        console.log('response Parameter' , responseParameter.data.data.parameter)
        this.dataAsset = responseAsset.data.data
        this.dataParameter.parameter = responseParameter.data.data.parameter

        //masukin data yang ada di API sebelah
        this.dataAsset.schType = responseParameter.data.data.schType
        this.dataAsset.scheduleFrom = responseParameter.data.data.scheduleFrom
        this.dataAsset.scannedEnd = responseParameter.data.data.scannedEnd

        //nambah scannedWith dan scannedBy
        this.dataParameter.scannedWith = responseParameter.data.data.scannedWith
        this.dataParameter.scannedBy = responseParameter.data.data.scannedBy


        console.log('this data aset' , this.dataAsset)
        console.log('this data parameter' , this.dataParameter)

        if (this.dataAsset){
          this.loaded = true
          console.log('loaded' , this.loaded)
        }

        this.dataAsset.isUploaded = '1'
        console.log('this data assete . is uploaded' , this.dataAsset.isUploaded)
      },
      onError: (err) => {
        console.log('error bang')
        console.error(err);
    }
      
    })
  }

  async getParameter(){
    this.http.requests({
      requests: [
        () => this.http.getAnyData(`${environment.url.formAssetCategory}/`),
        () => this.http.getAnyData(`${environment.url.assetsdetail}/`),
      ],
      onSuccess: async (responses) => {
        const [
          responseAssetCategory,
          responseAssetDetail,
        ] = responses;

        if (![200, 201].includes(responseAssetCategory.status)) {
          throw responseAssetCategory;
        }
        if (![200, 201].includes(responseAssetDetail.status)) {
          throw responseAssetDetail;
        }
      }

      })
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
      console.log('mas error mas')
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

