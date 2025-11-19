import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { IonicModule } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { of } from 'rxjs';

import { SouvenirDetailPage } from './souvenir-detail.page';
import { SouvenirService } from '../souvenir.service';
import { UserDataService } from '../../../shared/services/user-data.service';

const mockSouvenirService = {
  fetchSouvenirs: jest.fn().mockReturnValue(of([])),
};

describe('SouvenirDetailPage', () => {
  let component: SouvenirDetailPage;
  let fixture: ComponentFixture<SouvenirDetailPage>;
  let storeMock: jest.Mocked<Store>;
  let loadingControllerMock: jest.Mocked<LoadingController>;

  beforeEach(waitForAsync(() => {
    storeMock = {
      dispatch: jest.fn(),
      select: jest.fn().mockReturnValue(of({ souvenirs: [] })),
      pipe: jest.fn(),
    } as any;

    loadingControllerMock = {
      create: jest.fn().mockResolvedValue({
        present: jest.fn().mockResolvedValue(undefined),
        dismiss: jest.fn().mockResolvedValue(undefined),
      }),
      dismiss: jest.fn().mockResolvedValue(undefined),
    } as any;

    TestBed.configureTestingModule({
      declarations: [ SouvenirDetailPage ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: Store, useValue: storeMock },
        { provide: Title, useValue: { setTitle: jest.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: jest.fn().mockReturnValue('1') } } } },
        { provide: SouvenirService, useValue: mockSouvenirService },
        { provide: UserDataService, useValue: { isFavorite: jest.fn(), isVisited: jest.fn(), addFavorite: jest.fn(), removeFavorite: jest.fn(), addVisited: jest.fn(), removeVisited: jest.fn() } },
        { provide: LoadingController, useValue: loadingControllerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SouvenirDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
