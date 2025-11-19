import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Store } from '@ngrx/store';

import { SearchSightsComponent } from './search-sights.component';

describe('SearchSightsComponent', () => {
  let component: SearchSightsComponent;
  let fixture: ComponentFixture<SearchSightsComponent>;
  let storeMock: Store;

  beforeEach(waitForAsync(() => {
    storeMock = {
      dispatch: jest.fn(),
      select: jest.fn(),
      pipe: jest.fn(),
    } as Partial<Store> as Store;

    TestBed.configureTestingModule({
      declarations: [ SearchSightsComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: Store, useValue: storeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchSightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
