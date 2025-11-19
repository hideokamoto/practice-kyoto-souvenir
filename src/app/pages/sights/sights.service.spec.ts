import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { LoadingController } from '@ionic/angular';

import { SightsService } from './sights.service';

describe('SightsService', () => {
  let service: SightsService;
  let storeMock: Store;
  let loadingControllerMock: LoadingController;

  beforeEach(() => {
    storeMock = {
      dispatch: jest.fn(),
      select: jest.fn(),
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
      providers: [
        { provide: Store, useValue: storeMock },
        { provide: LoadingController, useValue: loadingControllerMock },
      ],
    });
    service = TestBed.inject(SightsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
