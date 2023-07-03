import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy, iosTransitionAnimation } from '@ionic/angular';

import { NgxEchartsModule } from 'ngx-echarts';

import { AES256 } from '@awesome-cordova-plugins/aes-256/ngx';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { ForegroundService } from '@awesome-cordova-plugins/foreground-service/ngx';
import { Media } from '@awesome-cordova-plugins/media/ngx';
import { MediaCapture } from '@awesome-cordova-plugins/media-capture/ngx';
import { NFC } from '@awesome-cordova-plugins/nfc/ngx';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { VideoPlayer } from '@awesome-cordova-plugins/video-player/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { BadgeStatComponentModule } from './components/badge-stat/badge-stat.component.module';
import { CustomAlertComponentModule } from './components/custom-alert/custom-alert.component.module';
import { IllustrationAttachFileComponentModule } from './components/illustration-attach-file/illustration-attach-file.component.module';
import { IllustrationNfcScanComponentModule } from './components/illustration-nfc-scan/illustration-nfc-scan.component.module';
import { IllustrationNoDataComponentModule } from './components/illustration-no-data/illustration-no-data.component.module';
import { IllustrationPreferencesComponentModule } from './components/illustration-preferences/illustration-preferences.component.module';
import { IllustrationProgressComponentModule } from './components/illustration-progress/illustration-progress.component.module';
import { IllustrationQrScanComponentModule } from './components/illustration-qr-scan/illustration-qr-scan.component.module';
import { IllustrationSynchronizeComponentModule } from './components/illustration-synchronize/illustration-synchronize.component.module';
import { PercentageComponentModule } from './components/percentage/percentage.component.module';
import { SaveOptionsComponentModule } from './components/save-options/save-options.component.module';
import { ScreenViewComponentModule } from './components/screen-view/screen-view.component.module';
import { SynchronizeCardComponentModule } from './components/synchronize-card/synchronize-card.component.module';
import { UploadRecordsComponentModule } from './components/upload-records/upload-records.component.module';
import { StreamingMedia } from '@awesome-cordova-plugins/streaming-media/ngx';
@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
    IonicModule.forRoot({
      mode: 'ios',
      navAnimation: iosTransitionAnimation,
      swipeBackEnabled: true,
      backButtonIcon: 'chevron-back-outline',
      backButtonText: '',
      scrollAssist: false,
      scrollPadding: false
    }),
    AppRoutingModule,
    FormsModule,
    BadgeStatComponentModule,
    CustomAlertComponentModule,
    IllustrationAttachFileComponentModule,
    IllustrationNfcScanComponentModule,
    IllustrationNoDataComponentModule,
    IllustrationPreferencesComponentModule,
    IllustrationProgressComponentModule,
    IllustrationQrScanComponentModule,
    IllustrationSynchronizeComponentModule,
    PercentageComponentModule,
    SaveOptionsComponentModule,
    ScreenViewComponentModule,
    SynchronizeCardComponentModule,
    UploadRecordsComponentModule
  ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy
    },
    AES256,
    AndroidPermissions,
    ForegroundService,
    MediaCapture,
    Media,
    NFC,
    PhotoViewer,
    ScreenOrientation,
    SQLite,
    VideoPlayer,
    StreamingMedia
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
