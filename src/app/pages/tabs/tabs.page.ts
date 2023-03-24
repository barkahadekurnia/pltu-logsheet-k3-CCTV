import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
// import { UserData } from 'src/app/services/shared/shared.service';
import { SharedService } from 'src/app/services/shared/shared.service';


@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit {
  gruprole = this.shared.user.group;
  constructor(
    private router: Router,
    private shared: SharedService,
  ) {

  }

  ngOnInit() {

    console.log('cek grup user :', this.shared.user.group);

  }

  openScanPage() {
    return this.router.navigate(['rfid-scan']);
  }
}
