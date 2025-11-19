import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Store } from '@ngrx/store';

import { SearchSouvenirsComponent } from './search-souvenirs.component';

describe('SearchSouvenirsComponent', () => {
  let component: SearchSouvenirsComponent;
  let fixture: ComponentFixture<SearchSouvenirsComponent>;
  let storeMock: jest.Mocked<Store>;

  beforeEach(waitForAsync(() => {
    storeMock = {
      dispatch: jest.fn(),
      select: jest.fn(),
      pipe: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      declarations: [ SearchSouvenirsComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: Store, useValue: storeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchSouvenirsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

