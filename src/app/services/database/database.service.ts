import { Injectable, Injector } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { UtilsService } from 'src/app/services/utils/utils.service';

type QuerySet = {
  query: string;
  params: any[];
};

type SelectExtra = {
  column?: string[];
  where?: QuerySet;
  groupBy?: string[];
  orderBy?: {
    column: string;
    desc?: boolean;
  }[];
  limit?: number;
};

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private database: SQLiteObject;

  constructor(
    private injector: Injector,
    private platform: Platform,
    private sqlite: SQLite
  ) { }

  private get tables() {
    return {
      schedule: `
        CREATE TABLE IF NOT EXISTS schedule(
                  abbreviation TEXT,
                  adviceDate TEXT,
                  approvedAt TEXT,
                  approvedBy TEXT,
                  approvedNotes TEXT,
                  area TEXT,
                  areaId TEXT,
                  assetCategoryId TEXT,
                  assetCategoryName TEXT,
                  assetForm TEXT,
                  assetId TEXT,
                  assetNumber TEXT,
                  assetStatusId TEXT,
                  assetStatusName TEXT,
                  capacityValue TEXT,
                  condition TEXT,
                  detailLocation TEXT,
                  created_at TEXT,
                  date TEXT,
                  deleted_at TEXT,
                  idschedule TEXT,
                  latitude TEXT,
                  longitude TEXT,
                  merk TEXT,
                  photo TEXT,
                  reportPhoto TEXT,
                  scannedAccuration TEXT,
                  scannedAt TEXT,
                  scannedBy TEXT,
                  scannedEnd TEXT,
                  scannedNotes TEXT,
                  scannedWith TEXT,
                  schDays TEXT,
                  schFrequency TEXT,
                  schManual TEXT,
                  schType TEXT,
                  schWeekDays TEXT,
                  schWeeks TEXT,
                  scheduleFrom TEXT,
                  scheduleTo TEXT,
                  scheduleTrxId TEXT,
                  supplyDate TEXT,
                  syncAt TEXT,
                  tagId TEXT,
                  tagNumber TEXT,
                  unit TEXT,
                  unitCapacity TEXT,
                  unitId TEXT
        )
      `,
      asset: `
        CREATE TABLE IF NOT EXISTS asset(
          assetId TEXT NOT NULL,
          assetCategoryId TEXT NOT NULL,
          assetCategoryName TEXT NOT NULL,
          assetName TEXT ,
          assetNumber TEXT ,
          mediaId TEXT,
          mediaName TEXT,
          photo TEXT,
          description TEXT,
          schManual TEXT,
          schType TEXT,
          schWeekDays TEXT,
          schWeeks TEXT,
          supplyDate TEXT,
          schMonthly TEXT,
          schFrequency TEXT,
          schYearly TEXT,
          reportPhoto TEXT,
          assetStatusId TEXT,
          assetStatusName TEXT,
          abbreviation TEXT,
          capacityId TEXT,
          capacityValue TEXT,
          unitCapacity TEXT,
          merkName TEXT,
          typeName TEXT,
          tagId TEXT,
          tagNumber TEXT,
          typeTag TEXT,
          areaId TEXT,
          area TEXT,
          unit TEXT,
          unitId TEXT,
          bangunan TEXT,
          location TEXT,
          detailLocation TEXT,
          latitude TEXT,
          longitude TEXT,
          created_at TEXT,
          cctvIP TEXT
        )
      `,
      tag: `
        CREATE TABLE IF NOT EXISTS tag(
          tagId TEXT NOT NULL,
          tagNumber TEXT
        )
      `,
      tagLocation: `
        CREATE TABLE IF NOT EXISTS tagLocation(
          areaId TEXT NOT NULL,
          UnitId TEXT NOT NULL,
          area TEXT NOT NULL,
          unit TEXT NOT NULL,
          latitude TEXT,
          longitude TEXT
        )
      `,
      parameter: `
        CREATE TABLE IF NOT EXISTS parameter(
          assetId TEXT NOT NULL,
          assetNumber TEXT NOT NULL,
          description TEXT,
          inputType TEXT NOT NULL,
          max INTEGER,
          min INTEGER,
          normal TEXT,
          abnormal TEXT,
          option TEXT,
          parameterId TEXT NOT NULL,
          parameterName TEXT NOT NULL,
          schType TEXT NOT NULL,
          showOn TEXT,
          sortId INTEGER,
          uom TEXT,
          workInstruction TEXT,
          tagId,
          unit TEXT,
          unitId INTEGER,
          area TEXT,
          areaId INTEGER,
          created_at TEXT,
          updated_at TEXT,
          parameterGroup TEXT
        )
      `,
      assetTag: `
        CREATE TABLE IF NOT EXISTS assetTag(
          assetTaggingId TEXT NOT NULL,
          assetId TEXT NOT NULL,
          assetTaggingValue TEXT NOT NULL,
          assetTaggingType TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `,
      recordHold: `
        CREATE TABLE IF NOT EXISTS recordHold(
          assetId TEXT NOT NULL,
          parameterId TEXT NOT NULL,
          value TEXT NOT NULL,
          scannedAt TEXT NOT NULL,
          scannedWith TEXT NOT NULL,
          scannedNotes TEXT
        )
      `,
      record: `
        CREATE TABLE IF NOT EXISTS record(
          recordId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          condition TEXT NOT NULL,
          parameterId TEXT NOT NULL,
          scannedAt TEXT NOT NULL,
          scannedBy TEXT NOT NULL,
          scannedEnd TEXT NOT NULL,
          scannedNotes TEXT,
          scannedWith TEXT NOT NULL,
          scheduleTrxId TEXT NOT NULL,
          syncAt TEXT NOT NULL,
          trxId TEXT NOT NULL,
          value TEXT NOT NULL,
          isUploaded INTEGER NOT NULL
        )
      `,
      recordAttachment: `
        CREATE TABLE IF NOT EXISTS recordAttachment(
          recordAttachmentId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          scheduleTrxId TEXT NOT NULL,
          trxId TEXT,
          notes TEXT,
          type TEXT,
          timestamp TEXT NOT NULL,
          filePath TEXT NOT NULL,
          isUploaded INTEGER NOT NULL,
          parameterId TEXT
        )
      `,
      recordAttachmentPemadam: `
        CREATE TABLE IF NOT EXISTS recordAttachmentPemadam(
          recordAttachmentId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          scheduleTrxId TEXT NOT NULL,
          trxId TEXT,
          notes TEXT,
          type TEXT,
          timestamp TEXT NOT NULL,
          filePath TEXT NOT NULL,
          isUploaded INTEGER NOT NULL
        )
      `,
      activityLog: `
        CREATE TABLE IF NOT EXISTS activityLog(
          logId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          activity TEXT NOT NULL,
          assetId TEXT,
          data TEXT NOT NULL,
          ip TEXT,
          userId TEXT,
          time TEXT,
          isUploaded TEXT NOT NULL,
          created_at TEXT
        )
      `,
      category: `
        CREATE TABLE IF NOT EXISTS category(
          assetCategoryId TEXT  NOT NULL,
          assetCategoryName TEXT NOT NULL,
          description TEXT,
          kode TEXT,
          urlImage TEXT,
          urlOffline TEXT,
          schType TEXT,
          assetCategoryType TEXT
        )
      `,
      jumlah: `
        CREATE TABLE IF NOT EXISTS category(
          jumlahId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          jumlahNama TEXT NOT NULL,
          jumlahCount INTEGER
        )
      `,
      assetsCCTV: `
        CREATE TABLE IF NOT EXISTS assetsCCTV(
          assetId TEXT NOT NULL,
          assetForm TEXT,
          assetNumber TEXT,
          expireDate TEXT,
          more TEXT,
          photo TEXT,
          supplyDate TEXT,
          cctvIP TEXT
        )
      `,
      assetsDetail: `
      CREATE TABLE IF NOT EXISTS assetsDetail(
        id TEXT NOT NULL,
        asset_number TEXT ,
        supply_date TEXT ,
        expireDate TEXT ,
        photo TEXT ,
        description TEXT,
        sch_manual TEXT,
        sch_type TEXT,
        sch_frequency TEXT,
        historyActive TEXT,
        lastScannedAt TEXT,
        lastScannedBy TEXT,
        parameter TEXT,
        assetForm TEXT,
        more TEXT,
        qr TEXT,
        foto TEXT
      )
    `,
    };
  }

  async executeSQL(querySet: QuerySet) {
    if (!this.platform.is('capacitor')) {
      throw new Error('Platform not supported!');
    }

    if (!this.database) {
      this.database = await this.sqlite.create({
        name: 'sqlite.db',
        location: 'default'
      });
    }

    const { query, params } = querySet;
    return this.database.executeSql(query, params);
  }
  insertbatch(table: string, data: { [key: string]: any }[], chunkSize = 200): Promise<any> | void {
    const querySets = [];

    for (let i = 0; i < data?.length; i += chunkSize) {
      const sliced = data.slice(i, i + chunkSize);
      querySets.push(...this.buildInsertQuery(table, sliced));
    }


    if (querySets.length > 1) {
      return this.executeSQLBatch(querySets);
    }

    if (querySets.length) {
      const [querySet] = querySets;
      return this.executeSQL(querySet);
    }
  }
  async executeSQLBatch(querySets: QuerySet[]) {
    if (!this.platform.is('capacitor')) {
      throw new Error('Platform not supported!');
    }

    if (!this.database) {
      this.database = await this.sqlite.create({
        name: 'sqlite.db',
        location: 'default'
      });
    }

    const sqlStatements = querySets.map(querySet => [querySet.query, querySet.params]);
    return this.database.sqlBatch(sqlStatements);
  }

  initTables() {
    const querySets: QuerySet[] = Object.values(this.tables)
      .map(query => ({ query, params: [] }));

    return this.executeSQLBatch(querySets);
  }

  destroyTables(options?: { exceptions: string[] }) {
    const exceptions = options?.exceptions || [];

    const querySets: QuerySet[] = Object.keys(this.tables)
      .filter(table => !exceptions.includes(table))
      .map(table => ({
        query: `DROP TABLE IF EXISTS ${table}`,
        params: []
      }));

    return this.executeSQLBatch(querySets);
  }

  checkTable(table: string) {
    return this.select('sqlite_master', {
      column: ['COUNT(*) as result'],
      where: {
        query: 'type=? AND name=?',
        params: ['table', table]
      }
    });
  }

  emptyTable(table: string) {
    return this.executeSQL({ query: `DELETE FROM ${table}`, params: [] });
  }

  select(table: string, extra: SelectExtra) {
    const querySet = this.buildSelectQuery(table, extra);
    return this.executeSQL(querySet);
  }

  insert(table: string, data: { [key: string]: any }[]) {
    const querySets = this.buildInsertQuery(table, data);
    return this.executeSQLBatch(querySets);
  }

  update(table: string, data: { [key: string]: any }, where: QuerySet) {
    const querySet = this.buildUpdateQuery(table, data, where);
    return this.executeSQL(querySet);
  }

  delete(table: string, where: QuerySet) {
    const querySet: QuerySet = {
      query: `DELETE FROM ${table} WHERE ${where.query}`,
      params: where.params
    };

    return this.executeSQL(querySet);
  }

  vacuum() {
    return this.executeSQL({ query: 'VACUUM', params: [] });
  }

  parseResult(res: any): any[] {
    const result = [];

    for (let i = 0; i < res.rows.length; i++) {
      result.push(res.rows.item(i));
    }

    return result;
  }

  buildSelectQuery(table: string, extra: SelectExtra): QuerySet {
    const querySet: QuerySet = {
      query: '',
      params: []
    };

    querySet.query = 'SELECT ';
    querySet.query += extra.column?.length ? extra.column.join(',') : '*';
    querySet.query += ` FROM ${table}`;

    if (extra.where && Object.keys(extra.where).length) {
      querySet.query += ` WHERE ${extra.where.query}`;
      querySet.params.push(...extra.where.params);
    }

    if (extra.groupBy?.length) {
      querySet.query += ' GROUP BY ';
      querySet.query += extra.groupBy.join(',');
    }

    if (extra.orderBy?.length) {
      querySet.query += ' ORDER BY ';

      querySet.query += extra.orderBy
        .map(order => order.column + (order.desc ? ' DESC' : ''))
        .join(',');
    }

    if (!isNaN(extra.limit) && extra.limit >= 0) {
      querySet.query += ' LIMIT ?';
      querySet.params.push(extra.limit);
    }

    return querySet;
  }

  buildInsertQuery(table: string, data: { [key: string]: any }[]): QuerySet[] {
    const group: { [key: string]: QuerySet } = {};

    for (const item of data) {
      const keys = Object.keys(item);
      const values = Object.values(item);
      const key = keys.join(',');
      const marks = this.marks(keys.length).join(',');

      if (group[key]) {
        group[key].query += `,(${marks})`;
        group[key].params.push(...values);
      } else {
        group[key] = {
          query: `INSERT INTO ${table} (${key}) VALUES (${marks})`,
          params: values
        };
      }
    }

    return Object.values(group);
  }

  buildUpdateQuery(table: string, data: { [key: string]: any }, where: QuerySet): QuerySet {
    const querySet: QuerySet = {
      query: '',
      params: []
    };

    querySet.query = `UPDATE ${table} SET `;

    Object.entries(data)
      .forEach(([key, value], i, source) => {
        querySet.query += `${key}=?${i < source.length - 1 ? ',' : ''}`;
        querySet.params.push(value);
      });

    querySet.query += ` WHERE ${where.query}`;
    querySet.params.push(...where.params);
    return querySet;
  }

  marks(length: number) {
    const utils = this.injector.get(UtilsService);
    return utils.generateArray(length).map(() => '?');
  }
}
