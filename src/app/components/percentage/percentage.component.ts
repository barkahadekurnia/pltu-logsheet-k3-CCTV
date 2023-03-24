import { Component, Input, OnInit, OnChanges } from '@angular/core';

@Component({
  selector: 'app-percentage',
  templateUrl: './percentage.component.html',
  styleUrls: ['./percentage.component.scss'],
})
export class PercentageComponent implements OnInit, OnChanges {
  @Input() className?: string;
  @Input() uploaded: number;
  @Input() unuploaded: number;
  @Input() holded: number;
  @Input() unscanned: number;
  @Input() darkMode: boolean;

  chartInstance: any;
  options: any;

  constructor() {
    this.options = {};
  }

  private get uploadedPercentage() {
    if (this.uploaded == null || this.total === 0) {
      return 0;
    }

    return Math.round(this.uploaded / this.total * 100);
  }

  private get unuploadedPercentage() {
    if (this.unuploaded == null || this.total === 0) {
      return 0;
    }

    return Math.round(this.unuploaded / this.total * 100);
  }

  private get holdedPercentage() {
    if (this.holded == null || this.total === 0) {
      return 0;
    }

    return Math.round(this.holded / this.total * 100);
  }

  private get unscannedPercentage() {
    if (this.unscanned == null || this.total === 0) {
      return 0;
    }

    return Math.round(this.unscanned / this.total * 100);
  }

  private get total() {
    let total = 0;

    if (this.uploaded != null) {
      total += this.uploaded;
    }

    if (this.unuploaded != null) {
      total += this.unuploaded;
    }

    if (this.holded != null) {
      total += this.holded;
    }

    if (this.unscanned != null) {
      total += this.unscanned;
    }

    return total;
  }

  ngOnInit() {
    this.loadChart();
  }

  ngOnChanges() {
    this.loadChart(true);
  }

  onChartInit(event: any) {
    this.chartInstance = event;
  }

  private loadChart(onChange = false) {
    const data = [
      {
        value: this.uploadedPercentage,
        name: 'Uploaded',
        itemStyle: {
          color: '#10b981'
        }
      },
      {
        value: this.unuploadedPercentage,
        name: 'Unuploaded',
        itemStyle: {
          color: '#84cc16'
        },
        label: {
          show: false
        }
      },
      {
        value: this.holdedPercentage,
        name: 'Holded',
        itemStyle: {
          color: '#eab308'
        },
        label: {
          show: false
        }
      },
      {
        value: this.unscannedPercentage,
        name: 'Unscanned',
        itemStyle: {
          color: this.darkMode ? '#4B5563' : '#D1D5DB'
        },
        label: {
          show: false
        }
      }
    ];

    if (this.total === 0) {
      data[data.length - 1].value = 1;
    }

    this.options = {
      legend: {
        type: 'plain',
        orient: 'vertical',
        align: 'left',
        top: 'middle',
        right: 30,
        textStyle: {
          fontFamily: 'Pieta',
          color: this.darkMode ? '#000' : '#fff'
        }
      },
      series: [
        {
          type: 'pie',
          center: [96, '50%'],
          radius: ['56%', '80%'],
          startAngle: 225,
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 5,
            borderColor: this.darkMode ? '#1F2937' : '#FFFFFF',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'center',
            formatter: '{c}%',
            fontFamily: 'Pieta',
            fontSize: 24,
            fontWeight: 'bold',
            color: this.darkMode ? '#000' : '#fff'
          },
          data
        }
      ]
    };

    if (onChange) {
      this.chartInstance?.setOption(this.options);
    }
  }
}
