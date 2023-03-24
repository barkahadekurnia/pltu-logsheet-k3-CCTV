import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { HttpService } from 'src/app/services/http/http.service';
import { SharedService } from 'src/app/services/shared/shared.service';

@Component({
  selector: 'app-test-connection',
  templateUrl: './test-connection.page.html',
  styleUrls: ['./test-connection.page.scss'],
})
export class TestConnectionPage implements OnInit {
  connecting: boolean;
  result: any;

  selectedTest: {
    label: string;
    request: () => any | void;
  };

  testList: {
    label: string;
    request: () => any | void;
  }[];

  constructor(
    private platform: Platform,
    private http: HttpService,
    private shared: SharedService
  ) {
    this.testList = [];
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      if (this.shared.isAuthenticated) {
        this.testList.push({
          label: 'Get Assets',
          request: () => this.http.getAssets()
        });

        if (!this.selectedTest) {
          this.selectedTest = this.testList[0];
        }
      }

      this.testConnection();
    });
  }

  doRefresh(e: any) {
    this.testConnection();
    e.target.complete();
  }

  async testConnection() {
    this.connecting = true;

    if (this.selectedTest) {
      await this.http.requests({
        requests: [this.selectedTest.request],
        onSuccess: ([response]) => {
          if (response.status >= 400) {
            throw response;
          }

          this.result = {
            ok: true,
            message: 'You have successfully connected to the server'
          };
        },
        onError: (error) => this.result = {
          ok: false,
          message: this.http.getErrorMessage(error)
        },
        onComplete: () => setTimeout(() => this.connecting = false, 1000)
      });
    }
  }
}