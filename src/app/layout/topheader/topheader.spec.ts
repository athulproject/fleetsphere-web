import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Topheader } from './topheader';

describe('Topheader', () => {
  let component: Topheader;
  let fixture: ComponentFixture<Topheader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topheader],
    }).compileComponents();

    fixture = TestBed.createComponent(Topheader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
