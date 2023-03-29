// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  url: {
    base: 'http://114.6.64.2:11241/api/logsheet_new',
    // base: 'http://192.168.4.99',
    // base: 'http://app.logsheet.digital',
    // base: 'http://45.77.45.6/logsheet',
    get login() {
      return this.base + '/api/login';
    },
    get grupoperator() {
      return this.base + `/api/group/getGroupOperatorByUserId/`;
    },
    get category() {
      return this.base + `/api/category/asset/index?assetCategoryType=all`;
    },
    get assets() {
      return this.base + '/api/transaction/schedule/detail';
    },
    get assetsid() {
      return this.base + '/api/asset/assetPerId';
    },
    get changerfid() {
      return this.base + '/api/rfid/change';
    },
    get countassets() {
      return this.base + '/api/asset/jumlah';
    },
    get assetTags() {
      return this.base + `/api/transaction/asset/tagging`;
    },
    get tags() {
      return this.base + '/api/transaction/asset/tagging';
    },
    get tagsscan() {
      return this.base + '/api/transaction/assetTagging/byManyAsset';
    },

    get parameters() {
      return this.base + '/api/transaction/asset/param';
    },
    get schedules() {
      return this.base + `/api/transaction/schedule/detail`;
    },
    get schedulesnonsift() {
      return this.base + `/api/transaction/schedule/nonShift`;
    },
    get schedulesnonmanual() {
      return this.base + `/api/transaction/schedule/scheduleLK3`;
    },
    get records() {
      return this.base + `/api/transaction/schedule/store`;
    },
    get recordAttachment() {
      return this.base + `/api/asset/parameter/uploadAttachmentParameter`;
    },
    get activityLogs() {
      return this.base + `/api/log/activity`;
    },
    get jadwal() {
      return this.base + '/api/schedule/data';
    },
    get jadwaldate() {
      return this.base + '/api/schedule/getAssetByCategory';
    },
    get apar() {
      return this.base + '/api/asset/index';
    }
  },
  values: {
    mapbox: 'pk.eyJ1IjoiYXJpc2NhYWJkdWxhaCIsImEiOiJja3Vuamc3eTgyNXMxMndteDI2MTY3NnBlIn0.7M2M8TyoZrrZuN85yrQPTQ',
    app: 'logsheet01',
    form: 'form__login',
    token: 'auth__token',
    salt: 'nocola__digital_logsheet',
    secureKey: 'enc__secure_key',
    secureIV: 'enc__secure_iv'
  },
  codePushIosKey: 'KCpPn5o6yu-tc1-up8eqrw3-TxBbNHxd2t4GG'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.