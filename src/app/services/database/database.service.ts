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
          scheduleTrxId TEXT,
          idschedule TEXT,
          abbreviation TEXT,
          adviceDate TEXT,
          approvedAt TEXT,
          approvedBy TEXT,
          approvedNotes TEXT,
          assetId TEXT,
          photo TEXT,
          assetNumber TEXT,
          assetStatusId TEXT,
          assetStatusName TEXT,
          condition TEXT,
          supplyDate TEXT,
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
          syncAt TEXT,
          tagId TEXT,
          tagNumber TEXT,
          unit TEXT,
          unitId TEXT,
          area TEXT,
          areaId TEXT,
          location TEXT,
          locationId TEXT,
          detailLocation TEXT,
          assetCategoryId TEXT,
          assetCategoryName TEXT,
          latitude TEXT,
          longitude TEXT,
          created_at TEXT,
          deleted_at TEXT,
          date TEXT,
          assetForm TEXT
        )
      `,
      asset: `
        CREATE TABLE IF NOT EXISTS asset(
          assetId TEXT NOT NULL,
          assetNumber TEXT,
          assetForm TEXT,
          description TEXT,
          expireDate TEXT,
          historyActive TEXT,
          ipAddress TEXT,
          lastScannedAt TEXT,
          lastScannedBy TEXT,
          more TEXT,
          password TEXT,
          photo TEXT,
          schFrequency TEXT,
          schManual TEXT,
          schType TEXT,
          supplyDate TEXT,
          username TEXT,
          updatedAt TEXT,
          isUploaded INTEGER NOT NULL
        )
      `,
      parameter: `
        CREATE TABLE IF NOT EXISTS parameter(
          abnormal TEXT,
          area TEXT,
          areaId TEXT,
          assetId TEXT NOT NULL,
          assetNumber TEXT NOT NULL,
          created_at TEXT,
          deleted_at TEXT,
          description TEXT,
          idx TEXT,
          inputType TEXT NOT NULL,
          max INTEGER,
          min INTEGER,
          normal TEXT,
          option TEXT,
          parameterGroup TEXT,
          parameterId TEXT NOT NULL,
          parameterName TEXT NOT NULL,
          schType TEXT NOT NULL,
          showOn TEXT,
          tagId TEXT,
          unit TEXT,
          unitId TEXT,
          uom TEXT,
          updated_at TEXT,
          work_instruction TEXT
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
      formAssetsCategory: `
        CREATE TABLE IF NOT EXISTS formAssetsCategory(
          formId TEXT,
          idx TEXT,
          formLabel TEXT,
          formName TEXT,
          formType TEXT,
          formOption TEXT,
          assetCategoryId TEXT,
          assetCategoryCode TEXT,
          assetCategoryName TEXT,
          created_at TEXT,
          updated_at TEXT,
          deleted_at TEXT
        )
      `,
      unit: `
        CREATE TABLE IF NOT EXISTS unit(
          id TEXT NOT NULL,
          unit TEXT,
          kode TEXT,
          deskripsi TEXT,
          updated_at TEXT
        )
      `,
      area: `
        CREATE TABLE IF NOT EXISTS area(
          id TEXT NOT NULL,
          idUnit TEXT,
          area TEXT,
          kode TEXT,
          deskripsi TEXT,
          updated_at TEXT
        )
      `,
      markSign: `
        CREATE TABLE IF NOT EXISTS markSign(
          id TEXT,  
          idArea TEXT, 
          tag_number TEXT,   
          unit TEXT, 
          area TEXT,  
          type_tag TEXT,   
          location TEXT,   
          detail_location TEXT,   
          latitude TEXT,   
          longitude TEXT,  
          tagCategory TEXT,   
          more TEXT,
          photos TEXT
        )
      `,
      assetStatus: `
        CREATE TABLE IF NOT EXISTS assetStatus(
          abbreviation TEXT,
          assetCategoryId TEXT,
          asset_status_name TEXT,
          description TEXT,
          id TEXT
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

    for (let i = 0; i < res?.rows?.length; i++) {
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
