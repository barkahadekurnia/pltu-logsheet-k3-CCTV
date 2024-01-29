import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { DatabaseService } from 'src/app/services/database/database.service';

interface CCTV {
  cctvId: string,
  cctvIp: string,
  cctvQr: string,
  cctvName: string,
  cctvLokasi: string,
  attachment: string,
}

@Component({
  selector: 'app-add-cctv',
  templateUrl: './add-cctv.page.html',
  styleUrls: ['./add-cctv.page.scss'],
})
export class AddCctvPage implements OnInit {
  form: CCTV
  cctv: CCTV
  cctvForm: FormGroup
  constructor(
    private database: DatabaseService,
    private router: Router,

  ) {

    this.form = {
      cctvId: "",
      cctvIp: "",
      cctvQr: "",
      cctvName: "",
      cctvLokasi: "",
      attachment: "",
    };
  }

  ngOnInit() {
  }

  openPage(commands: any[]) {
    return this.router.navigate(commands);
  }

  addCCTV() {
    console.log('tombol tambah cctv')
    console.log('cctv form value', this.form)
  }
}
