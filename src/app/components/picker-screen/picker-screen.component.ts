/* eslint-disable arrow-body-style */
import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import { groupBy } from 'lodash';

@Component({
  selector: 'app-picker-screen',
  templateUrl: './picker-screen.component.html',
  styleUrls: ['./picker-screen.component.scss'],
})
export class PickerScreenComponent implements OnInit {
  pickerType: string;
  pickerData: any[];
  multiselect: boolean;

  dataLoading: boolean;

  dataResult: any[];
  dataSource: any[];
  filteredData: any[];

  searchText: string;
  searchInitated = false;
  canProceed = false;

  selectedData: any[];
  selectedNames: any[];
  selectedDescription: any[];
  selectedPhotos: any[];

  constructor(
    private popover: PopoverController,
  ) {
    this.dataSource = [];
    this.filteredData = [];
    this.dataResult = [];

    this.selectedData = [];
    this.selectedNames = [];
    this.selectedDescription = [];
    this.selectedPhotos = [];
  }

  ngOnInit() {
    this.dataLoading = true;

    this.arrangeNames(this.pickerData);
    setTimeout(() => {
      this.dataLoading = false;
    }, 500);
  }

  search(event) {
    const key = event.target.value;
    if (key.length > 0) {
      this.searchInitated = true;
      this.filteredData = this.dataSource?.filter?.((item: any) => {
        return item?.name?.toLowerCase()?.includes(key?.toLowerCase()) ||
          item?.description?.toLowerCase()?.includes(key?.toLowerCase()) ||
          item?.id?.toLowerCase()?.includes(key?.toLowerCase());
      });
    } else {
      this.searchInitated = false;
    }
  }

  resetSearch() {
    this.filteredData = [];
    this.searchInitated = false;
  }

  closePicker(): void {
    this.popover.dismiss();
  }

  arrangeNames(list: any[]) {
    let resultId: any | string;
    let resultName: string;
    let resultDescription: string;
    let resultPhoto: string;

    const mappedData = list?.map((item) => {
      if (this.pickerType === 'unit') {
        resultId = item?.id;
        resultName = item?.unit;
        resultDescription = item?.deskripsi;
        resultPhoto = 'business-outline';
      } else if (this.pickerType === 'area') {
        resultId = item?.id;
        resultName = item?.area;
        resultDescription = item?.deskripsi;
        resultPhoto = 'locate-outline';
      } else if (this.pickerType === 'mark-sign') {
        resultId = item?.id;
        resultName = item?.tag_number;
        resultDescription = item?.detail_location;
        resultPhoto = 'location-outline';
      }
      const cObj = {
        id: resultId,
        name: resultName,
        description: resultDescription,
        photo: resultPhoto,
      };
      return cObj;
    });

    this.dataSource = mappedData;
    const groupedData = groupBy(mappedData, (item: any) => item?.name?.substr(0, 1));
    const arr = Object.entries(groupedData).reverse();
    arr.sort((a, b) => {
      const textA = a[0];
      const textB = b[0];
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
    this.dataResult = arr;
  }

  async doSelection(item: any) {
    const itemId = item.id;
    const itemName = item.name;
    const itemDescription = item.description;
    const photo = item.photo;

    if (!this.multiselect) {
      if (this.selectedData.length !== 0) {
        if (this.selectedData.includes(itemId)) {
          this.selectedData = [];
          this.selectedNames = [];
          this.selectedDescription = [];
          this.selectedPhotos = [];
        } else {
          this.selectedData[0] = itemId;
          this.selectedNames[0] = itemName;
          this.selectedDescription[0] = itemDescription;
          this.selectedPhotos[0] = photo;
        }
      } else {
        this.selectedData.push(itemId);
        this.selectedNames.push(itemName);
        this.selectedDescription.push(itemDescription);
        this.selectedPhotos.push(photo);
      }
    } else {
      if (this.selectedData.length !== 0) {
        if (this.selectedData.indexOf(itemId) === -1) {
          this.selectedData.push(itemId);
          this.selectedNames.push(itemName);
          this.selectedDescription.push(itemDescription);
          this.selectedPhotos.push(photo);
        } else {
          const num = this.selectedData.indexOf(itemId);
          this.selectedData.splice(num, 1);
          this.selectedNames.splice(num, 1);
          this.selectedDescription.splice(num, 1);
          this.selectedPhotos.splice(num, 1);
        }
      } else {
        this.selectedData.push(itemId);
        this.selectedNames.push(itemName);
        this.selectedDescription.push(itemDescription);
        this.selectedPhotos.push(photo);
      }
    }

    this.canProceed = true;

    setTimeout(() => {
      this.proceed();
    }, 100);
  }

  isSelected(id: string) {
    return this.selectedData?.includes(id) ? true : false;
  }

  async proceed() {
    const output = {
      ids: this.selectedData,
      texts: this.selectedNames,
      desc: this.selectedDescription,
      photos: this.selectedPhotos,
    };
    this.popover.dismiss(output, this.pickerType);
  }
}
