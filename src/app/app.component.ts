/* eslint-disable radix */
/* eslint-disable @typescript-eslint/naming-convention */
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Platform, IonRouterOutlet, MenuController } from '@ionic/angular';
import { TextZoom } from '@capacitor/text-zoom';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { SharedService, UserData } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { environment } from 'src/environments/environment';
import Viewer from 'viewerjs';
import * as mapboxgl from 'mapbox-gl';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Router } from '@angular/router';
import { HttpService } from './services/http/http.service';

import { register } from 'swiper/element/bundle';

register();

export interface AssetDetails {
  assetCategoryCode: string;
  assetCategoryId: string;
  assetCategoryName: string;
  created_at: string;
  deleted_at: string;
  formId: string;
  formLabel: string;
  formName: string;
  formOption: any[];
  formType: string;
  index: string;
  selected: boolean;
  updated_at: string;
  value: string;
  disabled: boolean;
};

export interface typeForm {
  assetcategoryid: string;
  code: string;
  description: string;
  formId: string;
  formValue: string;
  id: string;
  itemTypeId: string;
  kapasitas: string;
  media: string;
  merk: string;
  more: any[];
  type_name: string;
};


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild(IonRouterOutlet) routerOutlet: IonRouterOutlet;
  @ViewChild('appLoader') appLoader: ElementRef;
  @ViewChild('input') keyInput: { setFocus: () => void };

  progress: number;

  isReadOnly: boolean;

  dataFormDetailAsset: AssetDetails[] = [];
  user: UserData;
  formaset: any[];

  private map: mapboxgl.Map;
  private marker: mapboxgl.Marker;
  private permissions: { [key: string]: any }[];

  constructor(
    private router: Router,
    private platform: Platform,
    private menuCtrl: MenuController,
    private androidPermissions: AndroidPermissions,
    private screenOrientation: ScreenOrientation,
    public shared: SharedService,
    public utils: UtilsService,
    private http: HttpService
  ) {
    // this.user = this.shared.user;
    // console.log('yuhu', shared.user)
    console.log('form asset shared', this.shared.asset.assetForm);
    console.log('cek isi asset shared', this.shared.asset);
    // console.log('form asset json', JSON.parse(this.shared.asset.assetForm))
    // this.formaset = JSON.parse(this.shared.asset.assetForm);
    this.progress = 0;
    this.isReadOnly = true;
    (mapboxgl as any).accessToken = environment.values.mapbox;

    this.permissions = [
      { name: this.androidPermissions.PERMISSION.INTERNET },
      { name: this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE },
      { name: this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE },
      { name: this.androidPermissions.PERMISSION.CAMERA },
      { name: this.androidPermissions.PERMISSION.NFC },
      { name: this.androidPermissions.PERMISSION.POST_NOTIFICATIONS },
      { name: this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION },
      { name: this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION },
    ];

    this.initializeApp();
  }

  get asset() {
    return this.shared.asset;
  }
  get akun() {
    return this.shared.akun;
  }

  get filterOptions() {
    return this.shared.filterOptions;
  }

  async ngAfterViewInit() {
    console.log('current route', this.shared.currentRoute);

    await this.platform.ready();
    this.utils.setRouterOutlet(this.routerOutlet);

    if (this.shared.isInitialCheck) {
      await this.shared.getAppData();
      console.log('yuhu', this.shared.user);

    }

    for (const i of this.utils.generateArray(100)) {
      await this.utils.delay(10);

      if (this.progress === 25) {
        await this.checkAppPermissions();
      }

      if (this.progress === 90 && this.platform.is('capacitor')) {
        const value = this.shared.textZoom;
        TextZoom.set({ value });
      }

      if (this.progress === 99) {
        this.utils.startMonitor();
        await this.animateCSS(this.appLoader?.nativeElement, 'slideOutRight');
      }

      if (this.progress === 100) {
        const options: mapboxgl.MapboxOptions = {
          container: 'map',
          style: 1 + 1 === 4
            ? 'mapbox://styles/mapbox/dark-v10'
            : 'mapbox://styles/mapbox/streets-v11',
          center: [
            +this.shared.asset.longitude,
            +this.shared.asset.latitude
            // 109.0873408, -7.6847873

          ],
          zoom: 14
        };

        this.map = new mapboxgl.Map(options);
      }

      this.progress = i + 1;
    }
  }

  animateCSS(element: HTMLElement, animation: string, prefix = 'animate__') {
    return new Promise<void>(resolve => {
      if (!element) {
        resolve();
      }

      const animationName = `${prefix}${animation}`;
      element.classList.add(`${prefix}animated`, animationName);

      const handleAnimationEnd = (event: AnimationEvent) => {
        event.stopPropagation();
        element.classList.remove(`${prefix}animated`, animationName);
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd, { once: true });
    });
  }
  openPage(commands: any[]) {
    this.menuCtrl.close('sidebar');
    return this.router.navigate(commands);
  }
  async checkAppPermissions() {
    if (this.platform.is('android')) {
      for (const permission of this.permissions) {
        const response = await this.androidPermissions.checkPermission(permission.name);
        permission.hasPermission = response.hasPermission;
      }

      const needRequest = this.permissions.filter(permission => !permission.hasPermission);

      if (needRequest.length) {
        await this.androidPermissions
          .requestPermissions(needRequest.map(permission => permission.name));
      }
    }
  }

  showImageViewer({ target }: Event) {
    const options: Viewer.Options = {
      navbar: false,
      toolbar: false,
      button: false
    };

    const viewer = new Viewer(target as HTMLElement, options);
    viewer.show();
  }

  closeMenu(menuId: string) {
    return this.menuCtrl.close(menuId);
  }

  isString(value: any) {
    return typeof value === 'string';
  }

  onFilterClick(item: any) {
    item.selected = !item.selected;
    this.shared.filterOptions.onApply();
  }

  assetInfoDidClose({ target }: Event) {
    this.shared.currentRoute = null;
    this.isReadOnly = true;
    this.menuCtrl.swipeGesture(true, (target as any).menuId);
    this.marker?.remove();
  }

  assetInfoDidOpen({ target }: Event) {
    this.menuCtrl.swipeGesture(false, (target as any).menuId);
  }

  assetInfoWillOpen() {
    this.map.resize();

    this.map.setStyle(
      1 + 1 === 4
        ? 'mapbox://styles/mapbox/dark-v10'
        : 'mapbox://styles/mapbox/streets-v11'
    );
    // [109.0873408, -7.6847873]
    parseInt(this.shared.asset.longitude);
    parseInt(this.shared.asset.latitude);
    console.log('this shared asset', this.shared.asset);
    console.log('this asset di app comp', this.asset);

    this.marker = new mapboxgl.Marker()

      .setLngLat([
        +this.shared.asset.longitude,
        +this.shared.asset.latitude
        // 109.0873408, -7.6847873
      ])
      .addTo(this.map);

    this.map.setCenter([
      +this.shared.asset.longitude,
      +this.shared.asset.latitude
      // 109.0873408, -7.6847873

    ]);

    this.map.setZoom(14);
  }

  private initializeApp() {
    this.platform.ready().then(() => {
      this.utils.overrideBackButton();

      if (this.platform.is('ios')) {
        StatusBar.setStyle({ style: Style.Light });
      } else {
        StatusBar.setBackgroundColor({ color: '#000000' });
      }
      this.screenOrientation.lock(
        this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  closeReader() {
    document.body.classList.remove('qrscanner');
    BarcodeScanner.showBackground();
    BarcodeScanner.stopScan();
  }

  private async putDetailLocation(tagId, body) {
    try {
      const response = await this.http.uploadDetailLocation(tagId, body);

      if (![200, 201].includes(response.status)) {
        throw response;
      }

      const alert = await this.utils.createCustomAlert({
        type: 'success',
        color: 'success',
        header: 'Update Berhasil',
        message: `${(response.data as any)?.message}. Perubahan efektif terjadi setelah dilakukan sinkronisasi.`,
        backdropDismiss: false,
        buttons: [
          {
            text: 'Tutup',
            handler: () => alert.dismiss()
          }
        ]
      });

      await alert.present();
    } catch (err) {
      console.error(err);
      const alert = await this.utils.createCustomAlert({
        type: 'error',
        color: 'danger',
        header: 'Kesalahan',
        message: this.http.getErrorMessage(err),
        backdropDismiss: false,
        buttons: [
          {
            text: 'Tutup',
            handler: () => alert.dismiss()
          }
        ]
      });

      await alert.present();
    }
  }

}
