import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AssetCredentials } from 'src/app/pages/asset-detail/asset-detail.page';

import * as mapboxgl from 'mapbox-gl';
import { PopoverController } from '@ionic/angular';


@Component({
  selector: 'app-map-picker',
  templateUrl: './map-picker.component.html',
  styleUrls: ['./map-picker.component.scss'],
})
export class MapPickerComponent implements OnInit, AfterViewInit {
  @ViewChild('mapElement') mapElement: ElementRef;

  asset: AssetCredentials;

  map: mapboxgl.Map;
  marker: mapboxgl.Marker;

  constructor(private popoverCtrl: PopoverController) { }

  ngOnInit() { }

  ngAfterViewInit(): void {
    const lngLat: mapboxgl.LngLatLike = [this.asset.longitude, this.asset.latitude];

    this.map = new mapboxgl.Map({
      container: 'mapElement',
      style: 'mapbox://styles/mapbox/streets-v11',
    });

    this.marker = new mapboxgl.Marker({
      draggable: true
    })
      .setLngLat(lngLat)
      .addTo(this.map);

    setTimeout(() => {
      this.map.resize().setCenter(lngLat).setZoom(16);
    }, 100);

    const onDragEnd = () => {
      const locationResult = this.marker.getLngLat();
      this.asset.latitude = locationResult.lat;
      this.asset.longitude = locationResult.lng;
      this.asset.locationStatus = 'Lokasi terpilih';
    };

    this.marker.on('dragend', onDragEnd);
  }

  dismiss() {
    this.popoverCtrl.dismiss();
  }

  select() {
    this.popoverCtrl.dismiss(this.asset);
  }

}
