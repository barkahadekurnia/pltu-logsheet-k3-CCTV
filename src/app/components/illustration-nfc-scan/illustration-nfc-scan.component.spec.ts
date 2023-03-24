import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { IllustrationNfcScanComponent } from './illustration-nfc-scan.component';

describe('IllustrationNfcScanComponent', () => {
  let component: IllustrationNfcScanComponent;
  let fixture: ComponentFixture<IllustrationNfcScanComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ IllustrationNfcScanComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(IllustrationNfcScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
