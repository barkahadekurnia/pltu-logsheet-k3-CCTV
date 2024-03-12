// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  url: {
    base: 'http://114.6.64.2:11241/api/logsheet_dev',
    baseUrl: 'http://103.250.10.4/app/cctv',
    telegramUrl: 'https://api.telegram.org',

    get login() {
      return this.baseUrl + '/api/login';
    },
    get grupoperator() {
      return this.baseUrl + `/api/group/getGroupOperatorByUserId`;
    },
    get category() {
      return this.baseUrl + `/api/category/asset/index?assetCategoryType=all`;
    },
    get assets() {
      return this.baseUrl + '/api/transaction/schedule/detail';
    },
    get assetsid() {
      return this.baseUrl + '/api/asset/assetPerId';
    },
    get assetsdetail() {
      return this.baseUrl + '/api/asset/show';
    },
    get changerfid() {
      return this.baseUrl + '/api/rfid/change';
    },
    get countassets() {
      return this.baseUrl + '/api/asset/jumlah';
    },
    get laporanpetugas() {
      return this.baseUrl + '/api/transaction/schedule/indexTrxParent';
    },
    get detaillaporan() {
      return this.baseUrl + '/api/transaction/schedule/viewTrxParent';
    },
    get kirimlaporan() {
      return this.baseUrl + '/api/transaction/schedule/reportTrxParent';
    },
    get assetTags() {
      return this.baseUrl + `/api/transaction/asset/tagging`;
    },
    get tags() {
      return this.baseUrl + '/api/transaction/asset/tagging';
    },
    get tagsscan() {
      return this.baseUrl + '/api/transaction/assetTagging/byManyAsset';
    },
    get attach() {
      return this.baseUrl + '/api/transaction/attachment';
    },
    get parameters() {
      return this.baseUrl + '/api/transaction/asset/param';
    },
    get schedules() {
      return this.baseUrl + `/api/transaction/schedule/detail`;
    },
    get records() {
      return this.baseUrl + `/api/transaction/schedule/store`;
    },
    get recordAttachment() {
      return this.baseUrl + `/api/asset/parameter/uploadAttachmentParameter`;
    },
    get activityLogs() {
      return this.baseUrl + `/api/log/activity`;
    },
    get jadwal() {
      return this.baseUrl + '/api/schedule/data';
    },
    get jadwaldate() {
      return this.baseUrl + '/api/schedule/getAssetByCategory';
    },
    get allAssets() {
      return this.baseUrl + '/api/asset/index';
    },
    get statusAsset() {
      return this.baseUrl + '/api/asset/status/category-asset';
    },
    get updateLocation() {
      return this.baseUrl + '/api/tag/updateDetailLocation';
    },
    get formAssetCategory() {
      return this.baseUrl + '/api/assetform/assetCategory';
    },
    get formType() {
      return this.baseUrl + '/api/type/getDataByForm';
    },
    get uploadFormType() {
      return this.baseUrl + '/api/asset/updateAssetType';
    },
    get updateDetailAsset() {
      return this.baseUrl + '/api/asset/update';
    },
    get schedulesShift() {
      return this.baseUrl + `/api/schedule/getTeamSchedule`;
    },
    get selectionUnit() {
      return this.baseUrl + '/api/unit';
    },
    get selectionArea() {
      return this.baseUrl + '/api/area/show';
    },
    get selectionTandaPemasangan() {
      return this.baseUrl + '/api/tag/getTagByArea?area=';
    },
    get allTandaPemasangan() {
      return this.baseUrl + '/api/tag/index?search=undefined';
    },
    get updateAssetTag() {
      return this.baseUrl + '/api/asset/updateAssetTag';
    },
    get assetParameterTransaksi() {
      return this.baseUrl + '/api/transaction/schedule/view';
    },
    get assetsAll() {
      return this.baseUrl + '/api/asset/all';
    },
    get newAssets() {
      return this.baseUrl + '/api/asset/getAllDataAsset';
    },
    get formAssetCategoryAll() {
      return this.baseUrl + '/api/assetform/index';
    },
    get updateAsset() {
      return this.baseUrl + '/api/asset/update_new';
    },
  },
  values: {
    mapbox: 'pk.eyJ1IjoiYXJpc2NhYWJkdWxhaCIsImEiOiJja3Vuamc3eTgyNXMxMndteDI2MTY3NnBlIn0.7M2M8TyoZrrZuN85yrQPTQ',
    app: 'logsheet01',
    form: 'form__login',
    token: 'auth__token',
    salt: 'nocola__digital_logsheet',
    secureKey: 'enc__secure_key',
    secureIV: 'enc__secure_iv',
    telegramToken: '7113767015:AAEGZ4hc4asWKj43jciZbqoAdQL1wBQMP_Y',
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
