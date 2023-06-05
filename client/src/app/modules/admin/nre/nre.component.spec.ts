import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NreComponent } from './nre.component';

describe('NreComponent', () => {
  let component: NreComponent;
  let fixture: ComponentFixture<NreComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NreComponent]
    });
    fixture = TestBed.createComponent(NreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
