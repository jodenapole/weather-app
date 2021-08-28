import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharlieWeatherComponent } from './charlie-weather.component';

describe('CharlieWeatherComponent', () => {
  let component: CharlieWeatherComponent;
  let fixture: ComponentFixture<CharlieWeatherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CharlieWeatherComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CharlieWeatherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
