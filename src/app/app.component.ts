import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Platform, IonRouterOutlet, MenuController } from '@ionic/angular';
import { TextZoom } from '@capacitor/text-zoom';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { NfcService } from 'src/app/services/nfc/nfc.service';
import { SharedService, UserData } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { environment } from 'src/environments/environment';
import Viewer from 'viewerjs';
import * as mapboxgl from 'mapbox-gl';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild(IonRouterOutlet) routerOutlet: IonRouterOutlet;
  @ViewChild('appLoader') appLoader: ElementRef;

  progress: number;

  private map: mapboxgl.Map;
  private marker: mapboxgl.Marker;
  private permissions: { [key: string]: any }[];
  user: UserData;
  formaset: any[];

  constructor(
    private router: Router,
    private platform: Platform,
    private menuCtrl: MenuController,
    private androidPermissions: AndroidPermissions,
    private screenOrientation: ScreenOrientation,
    private nfc: NfcService,
    public shared: SharedService,
    private utils: UtilsService,
  ) {
    // this.user = this.shared.user;
    // console.log('yuhu', shared.user)
    console.log('form asset shared', this.shared.asset.assetForm)
    // console.log('form asset json', JSON.parse(this.shared.asset.assetForm))
    // this.formaset = JSON.parse(this.shared.asset.assetForm);
    this.progress = 0;
    (mapboxgl as any).accessToken = environment.values.mapbox;

    this.permissions = [
      { name: this.androidPermissions.PERMISSION.INTERNET },
      { name: this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE },
      { name: this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE },
      { name: this.androidPermissions.PERMISSION.CAMERA },
      { name: this.androidPermissions.PERMISSION.NFC }
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
    // console.log('yuhu', this.shared.user)

    await this.platform.ready();
    this.utils.setRouterOutlet(this.routerOutlet);

    if (this.shared.isInitialCheck) {
      await this.shared.getAppData();
      console.log('yuhu', this.shared.user)

    }

    for (const i of this.utils.generateArray(100)) {
      await this.utils.delay(10);

      if (this.progress === 25) {
        await this.checkAppPermissions();
      }

      if (this.progress === 50) {
        // if (this.platform.is('android')) {
        //   await this.nfc.setup();
        // }
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
    this.menuCtrl.close('sidebar')
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

}
