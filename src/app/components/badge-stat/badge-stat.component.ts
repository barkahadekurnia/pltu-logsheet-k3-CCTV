import { Component, Input, OnInit, OnChanges } from '@angular/core';

type Theme = 'success' | 'lime' | 'warning' | 'info' | 'error' | 'dark';

@Component({
  selector: 'app-badge-stat',
  templateUrl: './badge-stat.component.html',
  styleUrls: ['./badge-stat.component.scss'],
})
export class BadgeStatComponent implements OnInit, OnChanges {
  @Input() count: number;
  @Input() countSudah: number;
  @Input() countBelum: number;
  @Input() label: string;
  @Input() theme: Theme;
  @Input() icon: string;
  @Input() inverse: boolean;
  @Input() ripple: boolean;
  @Input() vertical: boolean;
  @Input() type: 'shadow' | 'outline';
  @Input() large: boolean;

  color: {
    bg: string;
    text: string;
  };

  constructor() {
    this.color = {
      bg: '',
      text: ''
    };
  }

  ngOnInit() {
    this.color = this.getTheme();
  }

  ngOnChanges() {
    this.color = this.getTheme();
  }

  private getTheme() {
    if (this.theme === 'success') {
      return {
        bg: 'bg-success',
        text: 'text-success'
      };
    }

    if (this.theme === 'lime') {
      return {
        bg: 'bg-lime-500',
        text: 'text-lime-500'
      };
    }

    if (this.theme === 'warning') {
      return {
        bg: 'bg-warning',
        text: 'text-warning'
      };
    }

    if (this.theme === 'error') {
      return {
        bg: 'bg-error',
        text: 'text-error'
      };
    }

    if (this.theme === 'dark') {
      return {
        bg: 'bg-gray-600',
        text: 'text-gray-600'
      };
    }

    return {
      bg: 'bg-info',
      text: 'text-info'
    };
  }
}
