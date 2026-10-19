import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardHandler } from './dashboard-handler';

describe('DashboardHandler', () => {
  let component: DashboardHandler;
  let fixture: ComponentFixture<DashboardHandler>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHandler],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHandler);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
