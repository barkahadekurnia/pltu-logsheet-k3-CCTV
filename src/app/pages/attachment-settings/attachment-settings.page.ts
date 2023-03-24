import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SharedService, AttachmentSettings } from 'src/app/services/shared/shared.service';

@Component({
  selector: 'app-attachment-settings',
  templateUrl: './attachment-settings.page.html',
  styleUrls: ['./attachment-settings.page.scss'],
})
export class AttachmentSettingsPage implements OnInit {
  isAndroid: boolean;
  attachmentSettings: AttachmentSettings;

  constructor(private platform: Platform, private shared: SharedService) { }

  ngOnInit() {
    this.isAndroid = this.platform.is('android');
    this.attachmentSettings = this.shared.attachmentConfig;
  }

  saveSettings(settings: string) {
    this.shared.setAttachmentConfig({
      [settings]: this.attachmentSettings[settings]
    });
  }
}