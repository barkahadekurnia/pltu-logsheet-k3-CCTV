/* eslint-disable @typescript-eslint/naming-convention */
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ssp.logsheet.k3.CCTV',
  appName: 'CCTV Logsheet',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav',
    },
    CapacitorHttp: {
      enabled: false,
    },
  }
};

export default config;
