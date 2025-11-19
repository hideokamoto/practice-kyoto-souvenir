import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { LoadingController } from '@ionic/angular';

import { SouvenirService } from './souvenir.service';

describe('SouvenirService', () => {
  let service: SouvenirService;
  let storeMock: jest.Mocked<Store>;
  let loadingControllerMock: jest.Mocked<LoadingController>;

  beforeEach(() => {
    storeMock = {
      dispatch: jest.fn(),
      select: jest.fn(),
      pipe: jest.fn(),
    } as jest.Mocked<Store>;

    loadingControllerMock = {
      create: jest.fn().mockResolvedValue({
        present: jest.fn().mockResolvedValue(undefined),
        dismiss: jest.fn().mockResolvedValue(undefined),
      }),
      dismiss: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<LoadingController>;

    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: storeMock },
        { provide: LoadingController, useValue: loadingControllerMock },
      ],
    });
    service = TestBed.inject(SouvenirService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
