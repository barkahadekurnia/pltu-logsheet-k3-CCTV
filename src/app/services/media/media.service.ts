import { Injectable, Injector } from '@angular/core';
import { Platform, LoadingController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Camera, ImageOptions, CameraResultType, CameraSource } from '@capacitor/camera';
import { ForegroundService } from '@awesome-cordova-plugins/foreground-service/ngx';

import {Directory} from "@capacitor/filesystem";
import write_blob from "capacitor-blob-writer";
import {
  MediaCapture,
  CaptureAudioOptions,
  CaptureVideoOptions,
  MediaFile
} from '@awesome-cordova-plugins/media-capture/ngx';

import { Media, MediaObject } from '@awesome-cordova-plugins/media/ngx';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { VideoPlayer, VideoOptions } from '@awesome-cordova-plugins/video-player/ngx';
import { SharedService } from 'src/app/services/shared/shared.service';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { StreamingAudioOptions, StreamingMedia, StreamingVideoOptions } from '@awesome-cordova-plugins/streaming-media/ngx';
@Injectable({
  providedIn: 'root'
})
export class MediaService {
  constructor(
    private injector: Injector,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private foregroundService: ForegroundService,
    private mediaCapture: MediaCapture,
    private media: Media,
    private photoViewer: PhotoViewer,
    private videoPlayer: VideoPlayer,
    private stream: StreamingMedia
  ) { }

  async getPicture() {
    let path: string;

    try {
      const shared = this.injector.get(SharedService);

      const {
        imageMaxWidth,
        imageMaxHeight,
        imageQuality
      } = shared.attachmentConfig;

      const options: ImageOptions = {
        width: imageMaxWidth,
        height: imageMaxHeight,
        quality: imageQuality,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        correctOrientation: true,
        saveToGallery: false,
        allowEditing: false
      };

      if (this.platform.is('android')) {
        this.foregroundService.start(
          'Mobile Scanner',
          'Taking a picture...',
          'ic_notification_camera',
          3
        );
      }

      const result = await Camera.getPhoto(options);
      path = result.path;
    } catch (error) {
      if (error.message !== 'User cancelled photos app') {
        const utils = this.injector.get(UtilsService);

        const alert = await utils.createCustomAlert({
          type: 'error',
          header: 'Error',
          message: error.message,
          buttons: [{
            text: 'Close',
            handler: () => alert.dismiss()
          }]
        });

        alert.present();
      }
    } finally {
      if (this.platform.is('android')) {
        this.foregroundService.stop();
      }
    }

    return path;
  }

  async captureAudio() {
    let audio: MediaFile;

    try {
      const shared = this.injector.get(SharedService);
      const { audioMaxDuration } = shared.attachmentConfig;

      const options: CaptureAudioOptions = {
        limit: 1,
        duration: audioMaxDuration
      };

      if (this.platform.is('android')) {
        this.foregroundService.start(
          'Mobile Scanner',
          'Recording audio...',
          'ic_notification_mic',
          3
        );
      }

      [audio] = await this.mediaCapture.captureAudio(options) as MediaFile[];
    } catch (error) {
      const message = this.getCaptureMediaError('video', error.code);

      if (message) {
        const utils = this.injector.get(UtilsService);

        const alert = await utils.createCustomAlert({
          type: 'error',
          header: 'Error',
          message,
          buttons: [{
            text: 'Close',
            handler: () => alert.dismiss()
          }]
        });

        alert.present();
      }
    } finally {
      if (this.platform.is('android')) {
        this.foregroundService.stop();
      }
    }

    return audio;
  }

  async captureVideo() {
    let video: MediaFile;

    try {
      const shared = this.injector.get(SharedService);

      const {
        videoHighResolution,
        videoMaxDuration
      } = shared.attachmentConfig;

      const options: CaptureVideoOptions = {
        limit: 1,
        duration: videoMaxDuration,
        quality: videoHighResolution ? 1 : 0
      };

      if (this.platform.is('android')) {
        this.foregroundService.start(
          'Mobile Scanner',
          'Recording video...',
          'ic_notification_videocam',
          3
        );
      }

      [video] = await this.mediaCapture.captureVideo(options) as MediaFile[];
    } catch (error) {
      const message = this.getCaptureMediaError('video', error.code);

      if (message) {
        const utils = this.injector.get(UtilsService);

        const alert = await utils.createCustomAlert({
          type: 'error',
          header: 'Error',
          message,
          buttons: [{
            text: 'Close',
            handler: () => alert.dismiss()
          }]
        });

        alert.present();
      }
    } finally {
      if (this.platform.is('android')) {
        this.foregroundService.stop();
      }
    }

    return video;
  }

  async showPicture(source: string) {
    try {
      if (!this.platform.is('capacitor')) {
        throw new Error('Platform not supported');
      }

      this.photoViewer.show(source);
    } catch (error) {
      const utils = this.injector.get(UtilsService);

      const alert = await utils.createCustomAlert({
        type: 'error',
        header: 'Error',
        message: error?.message ? error.message : error,
        buttons: [{
          text: 'Close',
          handler: () => alert.dismiss()
        }]
      });

      alert.present();
    }
  }

  async playAudio(filePath: string) {
    const loader = await this.loadingCtrl.create({
      spinner: 'dots',
      message: 'Playing audio...',
      cssClass: 'dark:ion-bg-gray-800',
      mode: 'ios'
    });

    loader.present();

    const file = this.media.create(filePath);

    file.onSuccess.subscribe(() => {
      file.release();
      loader.dismiss();
    });
console.log('file',file)
    file.onError.subscribe(async error => {
      console.log('error', error)
      const message = this.getMediaError(error);
      console.log('message', message)

      if (message) {
        const utils = this.injector.get(UtilsService);

        const alert = await utils.createCustomAlert({
          type: 'error',
          header: 'Error',
          message,
          buttons: [{
            text: 'Close',
            handler: () => alert.dismiss()
          }]
        });

        alert.present();
      }

      file.release();
      loader.dismiss();
    });

    file.play();
  }

  async playVideo(filePath: string) {
    try {
      console.log(filePath);

      // if (!this.platform.is('android')) {
      //   const file: MediaObject = this.media.create(filePath);
      //   // to listen to plugin events:

      //   file.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes

      //   file.onSuccess.subscribe(() => console.log('Action is successful'));

      //   file.onError.subscribe(error => console.log('Error!', error));

      //   // play the file
      //   file.play();

      //   // pause the file
      //   file.pause();

      //   // get current playback position
      //   file.getCurrentPosition().then((position) => {
      //     console.log(position);
      //   });

      //   // get file duration
      //   const duration = file.getDuration();
      //   console.log(duration);

      //   // skip to 10 seconds (expects int value in ms)
      //   file.seekTo(10000);

      //   // stop playing the file
      //   file.stop();

      //   // release the native audio resource
      //   // Platform Quirks:
      //   // iOS simply create a new instance and the old one will be overwritten
      //   // Android you must call release() to destroy instances of media when you are done
      //   file.release();
      //   // throw new Error('Platform not supported');
      // }

      // const videoOptions: VideoOptions = {
      //   volume: 0.5
      // };

      // await this.videoPlayer.play(filePath, videoOptions);

      const options: StreamingVideoOptions = {
        shouldAutoClose: true,
        controls: true,
      };

      this.stream.playVideo(filePath, options);
    } catch (error) {
      const utils = this.injector.get(UtilsService);

      const alert = await utils.createCustomAlert({
        type: 'error',
        header: 'Error',
        message: error?.message ? error.message : error,
        buttons: [{
          text: 'Close',
          handler: () => alert.dismiss()
        }]
      });

      alert.present();
    }
  }
  async convertFileToBlob(path: string) {
    const webPath = Capacitor.convertFileSrc(path);
    const response = await fetch(webPath);
    const blob = await response.blob();
    return blob;
  }
  getCaptureMediaError(type: 'audio' | 'video', code: number) {
    if (code === 3) { // CaptureError.CAPTURE_NO_MEDIA_FILES
      return null;
    }

    let media = type === 'audio' ? 'Microphone' : 'Camera or microphone';

    if (code === 1) { // CaptureError.CAPTURE_APPLICATION_BUSY
      media = type === 'audio' ? 'Audio capture' : 'Camera or audio capture';
      return `${media} application is currently serving another capture request`;
    }

    if (code === 2) { // CaptureError.CAPTURE_INVALID_ARGUMENT
      return 'Limit can\'t be less than 1';
    }

    if (code === 20) { // CaptureError.CAPTURE_NOT_SUPPORTED
      return 'Requested capture operation is not supported';
    }

    if (code === 4) { // CaptureError.CAPTURE_PERMISSION_DENIED
      return 'Permission denied';
    }

    return `${media} failed to capture image or sound`;
  }

  getMediaError(code: number) {
    console.log('error', code);
    if (code === this.media.MEDIA_ERR_ABORTED) {
      return null;
    }

    if (code === this.media.MEDIA_ERR_DECODE) {
      return 'An error occurred while decoding the audio';
    }

    if (code === this.media.MEDIA_ERR_NETWORK) {
      return 'An error occurred while accessing the audio file';
    }

    if (code === this.media.MEDIA_ERR_NONE_SUPPORTED) {
      return 'Audio format not supported';
    }

    return 'An error occurred while playing audio';
  }
}
