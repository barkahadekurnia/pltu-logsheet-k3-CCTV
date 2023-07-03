import { SharedService } from 'src/app/services/shared/shared.service';
import { Component, OnInit, Injector } from '@angular/core';
import { NavParams } from '@ionic/angular';

export interface CustomAlertOptions {
  type?: 'success' | 'warning' | 'error' | 'info' | 'radio';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  img?: string;
  main?: string;
  spinner?: boolean;
  header?: string;
  message?: string;
  buttons?: CustomAlertButton[];
  param?: any;
}

export type CustomAlertButton = {
  text: string;
  handler: any | void;
};

@Component({
  selector: 'app-custom-alert',
  templateUrl: './custom-alert.component.html',
  styleUrls: ['./custom-alert.component.scss'],
})
export class CustomAlertComponent implements OnInit {
  options: CustomAlertOptions;
  primaryButton: any;
  secondaryButton: any;
  ngdata: any;
  constructor(
    private navParams: NavParams,
    private injector:Injector,
    private shared: SharedService,

  ) {
    this.options = this.navParams.get('options');
    [this.primaryButton, this.secondaryButton] = this.options?.buttons || [];
  }

  ngOnInit() {
    if (this.options) {
      const img = this.getImg();
      const color = this.getColor();

      this.options = { ...this.options, img, color };
    }
    console.log('param',this.options.param)
  }

  private getImg() {
    if (this.options?.img) {
      return this.options.img;
    }

    if (this.options?.type === 'success') {
      return 'assets/img/success.svg';
    }

    if (this.options?.type === 'warning') {
      return 'assets/img/warning.svg';
    }

    if (this.options?.type === 'error') {
      return 'assets/img/error.svg';
    }

    if (this.options?.type === 'info') {
      return 'assets/img/info.svg';
    }

    return undefined;
  }

  private getColor() {
    if (this.options?.color) {
      return this.options.color;
    }

    if (this.options.type === 'success') {
      return 'success';
    }

    if (this.options.type === 'warning') {
      return 'warning';
    }

    if (this.options.type === 'error') {
      return 'danger';
    }

    return 'primary';
  }
  radioSelect(value){
    console.log('cek', value?.detail?.value)

    this.shared.setSchType({
      type: value?.detail?.value,
    });
    console.log('cek simpan', this.shared.schtype.type)
  }


}
