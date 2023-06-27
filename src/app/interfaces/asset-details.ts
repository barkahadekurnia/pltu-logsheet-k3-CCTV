import { Parameter } from './parameter';

/* eslint-disable @typescript-eslint/naming-convention */
export interface AssetDetails {
    assetForm: AssetForm[];
    asset_number: string;
    description: string;
    expireDate: string;
    historyActive: string;
    id: string;
    more: AssetCategoryAndStatus;
    parameter: {
        day: Parameter[];
        lustrum: Parameter[];
        monthly: Parameter[];
        semester: Parameter[];
        threeMonthly: Parameter[];
        week: Parameter[];
        yearly: Parameter[];
    };
    photo: Photo[];
    qr: string;
    sch_frequency: string;
    sch_manual: string;
    sch_type: string;
    supply_date: string;
}

export interface AssetFormDetails {
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
}

export interface TypeForm {
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
}

interface AssetForm {
    assetcategoryid: string;
    assetId: string;
    created_at?: string;
    deleted_at?: string;
    formId: string;
    formLabel: string;
    formType: string;
    formValue: string;
    id: string;
    index: string;
    optionName: string;
    typeId: string;
    updated_at?: string;
}

interface AssetCategoryAndStatus {
    category: {
        code: string;
        id: string;
        name: string;
    };
    status: {
        abbreviation: string;
        id: string;
        name: string;
    };
    tag: DetailAssetTags[];
    tagging: AssetTags[];
    type: {
        id: string;
        name: string;
    };
}

interface AssetTags {
    id: string;
    type: string;
    value?: string;
}

interface DetailAssetTags {
    area: string;
    areaId: string;
    detail_location: string;
    id: string;
    location: string;
    tag_number: string;
    unit: string;
    unitId: string;
}

interface Photo {
    assetphotoid: string;
    assetPhotoType: string;
    created_at?: string;
    historyId: string;
    path: string;
    photo: string;
}
