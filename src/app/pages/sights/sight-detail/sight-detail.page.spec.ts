import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { IonicModule } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { of } from 'rxjs';

import { SightDetailPage } from './sight-detail.page';
import { SightsService } from '../sights.service';
import { UserDataService } from '../../../shared/services/user-data.service';

const mockSightsService = {
  fetchSights: jest.fn().mockReturnValue(of([])),
};

describe('SightDetailPage', () => {
  let component: SightDetailPage;
  let fixture: ComponentFixture<SightDetailPage>;
  let storeMock: Store;
  let loadingControllerMock: LoadingController;

  beforeEach(waitForAsync(() => {
    storeMock = {
      dispatch: jest.fn(),
      select: jest.fn().mockReturnValue(of({ sights: [] })),
      pipe: jest.fn(),
    } as Partial<Store> as Store;

    loadingControllerMock = {
      create: jest.fn().mockResolvedValue({
        present: jest.fn().mockResolvedValue(undefined),
        dismiss: jest.fn().mockResolvedValue(undefined),
      }),
      dismiss: jest.fn().mockResolvedValue(undefined),
      getTop: jest.fn().mockResolvedValue(undefined),
    } as Partial<LoadingController> as LoadingController;

    TestBed.configureTestingModule({
      declarations: [ SightDetailPage ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: Store, useValue: storeMock },
        { provide: Title, useValue: { setTitle: jest.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: jest.fn().mockReturnValue('1') } } } },
        { provide: SightsService, useValue: mockSightsService },
        { provide: UserDataService, useValue: { isFavorite: jest.fn(), isVisited: jest.fn(), addFavorite: jest.fn(), removeFavorite: jest.fn(), addVisited: jest.fn(), removeVisited: jest.fn() } },
        { provide: LoadingController, useValue: loadingControllerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SightDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
