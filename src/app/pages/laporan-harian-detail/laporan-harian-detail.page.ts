import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { HttpService, LaporanData } from 'src/app/services/http/http.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import * as moment from 'moment';

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

  constructor(
    private utils: UtilsService,
    private activatedRoute: ActivatedRoute,
    private http: HttpService,
    private alertController: AlertController,
    private loadingCtrl: LoadingController,

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
    this.getLocalAssets(transitionData.data);

  }

  ngOnInit() {
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
            handler: () => this.utils.back(3)
          }]
        })
      alert.present();

        // throw response.data;

      }


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
}
