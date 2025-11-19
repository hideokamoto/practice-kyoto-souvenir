import { Component, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store, createSelector } from '@ngrx/store';
import { UserDataService } from '../../shared/services/user-data.service';
import { selectSouvenirFeature } from '../souvenir/store';
import { selectSightsFeature } from '../sights/store';
import { Souvenir, SouvenirService } from '../souvenir/souvenir.service';
import { Sight, SightsService } from '../sights/sights.service';
import { Subscription, combineLatest, EMPTY, of, forkJoin } from 'rxjs';
import { filter, take, switchMap, catchError, tap, finalize } from 'rxjs/operators';
import { truncateText } from '../../shared/pipes/truncate.pipe';

type ContentType = 'sights' | 'souvenirs';

interface RandomSuggestion {
  id: string;
  name: string;
  description: string;
  type: 'sight' | 'souvenir';
  photo?: string;
  address?: string;
  price?: string;
  name_kana?: string;
  reason?: 'favorite' | 'unvisited' | 'random';
  isFavorite?: boolean;
  isVisited?: boolean;
}

@Component({
    selector: 'app-discover',
    templateUrl: './discover.page.html',
    styleUrls: ['./discover.page.scss'],
    standalone: false
})
export class DiscoverPage implements OnDestroy {
  private readonly userDataService = inject(UserDataService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly sightsService = inject(SightsService);
  private readonly souvenirService = inject(SouvenirService);

  public contentType: ContentType = 'sights';
  public sights$ = this.store.select(createSelector(selectSightsFeature, state => state.items));
  public souvenirs$ = this.store.select(createSelector(selectSouvenirFeature, state => state.items));
  
  public randomSuggestions: RandomSuggestion[] = [];
  public expandedDescriptions: { [key: string]: boolean } = {}; // デフォルトは折りたたみ
  
  private allSights: Sight[] = [];
  private allSouvenirs: Souvenir[] = [];
  private subscriptions = new Subscription();
  public isLoading = false;
  public hasError = false;
  public errorMessage = '';


  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    // 両方のストアの状態を一度に監視し、必要なデータを並行してフェッチ
    const loadSubscription = combineLatest([
      this.store.select(selectSightsFeature),
      this.store.select(selectSouvenirFeature)
    ]).pipe(
      take(1),
      switchMap(([sightState, souvenirState]) => {
        const needsSights = !sightState?.items || sightState.items.length === 0;
        const needsSouvenirs = !souvenirState?.items || souvenirState.items.length === 0;

        // 必要なデータがない場合のみfetchを実行（並行実行）
        const fetchObservables: Array<ReturnType<typeof this.sightsService.fetchSights | typeof this.souvenirService.fetchSouvenirs>> = [];
        
        if (needsSights) {
          fetchObservables.push(
            this.sightsService.fetchSights(false).pipe(
              catchError(error => {
                console.error('観光地データの読み込みに失敗しました:', error);
                this.hasError = true;
                this.errorMessage = '観光地データの読み込みに失敗しました';
                return EMPTY;
              })
            )
          );
        }
        
        if (needsSouvenirs) {
          fetchObservables.push(
            this.souvenirService.fetchSouvenirs(false).pipe(
              catchError(error => {
                console.error('お土産データの読み込みに失敗しました:', error);
                if (!this.hasError) {
                  this.hasError = true;
                  this.errorMessage = 'お土産データの読み込みに失敗しました';
                }
                return EMPTY;
              })
            )
          );
        }

        // fetchが必要な場合は forkJoin で並行実行し、完了後にストアからデータを取得
        if (fetchObservables.length > 0) {
          return forkJoin(fetchObservables).pipe(
            switchMap(() => 
              combineLatest([
                this.store.select(selectSightsFeature),
                this.store.select(selectSouvenirFeature)
              ]).pipe(take(1))
            )
          );
        }

        // 既にデータがある場合はそのまま返す
        return of([sightState, souvenirState]);
      }),
      // データが揃うまで待つ
      filter(([sightState, souvenirState]) => 
        sightState?.items && sightState.items.length > 0 &&
        souvenirState?.items && souvenirState.items.length > 0
      ),
      take(1),
      tap(([sightState, souvenirState]) => {
        this.allSights = sightState.items as Sight[];
        this.allSouvenirs = souvenirState.items as Souvenir[];
        this.getRandomSuggestions();
        this.hasError = false;
      }),
      catchError(error => {
        console.error('データの読み込みに失敗しました:', error);
        this.hasError = true;
        this.errorMessage = 'データの読み込みに失敗しました';
        return EMPTY;
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();

    this.subscriptions.add(loadSubscription);
  }

  getRandomSuggestions() {
    if (this.allSights.length === 0 && this.allSouvenirs.length === 0) {
      console.warn('観光地とお土産のデータがまだ読み込まれていません');
      return;
    }

    const visits = this.userDataService.getVisits();
    const favorites = this.userDataService.getFavorites();
    
    // 訪問済み・お気に入りのIDを取得（観光地とお土産の両方）
    const visitedSightIds = visits
      .filter(v => v.itemType === 'sight')
      .map(v => v.itemId);
    const visitedSouvenirIds = visits
      .filter(v => v.itemType === 'souvenir')
      .map(v => v.itemId);
    
    const favoriteSightIds = favorites
      .filter(f => f.itemType === 'sight')
      .map(f => f.itemId);
    const favoriteSouvenirIds = favorites
      .filter(f => f.itemType === 'souvenir')
      .map(f => f.itemId);

    // 観光地の優先順位プール
    const favoriteUnvisitedSights = this.allSights.filter(
      sight => favoriteSightIds.includes(sight.id) && !visitedSightIds.includes(sight.id)
    );
    const unvisitedSights = this.allSights.filter(
      sight => !visitedSightIds.includes(sight.id)
    );

    // お土産の優先順位プール
    const favoriteUnvisitedSouvenirs = this.allSouvenirs.filter(
      souvenir => favoriteSouvenirIds.includes(souvenir.id) && !visitedSouvenirIds.includes(souvenir.id)
    );
    const unvisitedSouvenirs = this.allSouvenirs.filter(
      souvenir => !visitedSouvenirIds.includes(souvenir.id)
    );

    // 統合されたプールを作成（観光地とお土産を混在）
    type ItemWithType = { item: Sight | Souvenir; type: 'sight' | 'souvenir' };
    let itemsPool: ItemWithType[] = [];

    // 優先順位1: お気に入りで未訪問のアイテム（観光地とお土産）
    const favoriteUnvisitedItems: ItemWithType[] = [
      ...favoriteUnvisitedSights.map(sight => ({ item: sight, type: 'sight' as const })),
      ...favoriteUnvisitedSouvenirs.map(souvenir => ({ item: souvenir, type: 'souvenir' as const }))
    ];

    // 優先順位2: 未訪問のアイテム（観光地とお土産）
    const unvisitedItems: ItemWithType[] = [
      ...unvisitedSights.map(sight => ({ item: sight, type: 'sight' as const })),
      ...unvisitedSouvenirs.map(souvenir => ({ item: souvenir, type: 'souvenir' as const }))
    ];

    // 優先順位3: 全アイテム
    const allItems: ItemWithType[] = [
      ...this.allSights.map(sight => ({ item: sight, type: 'sight' as const })),
      ...this.allSouvenirs.map(souvenir => ({ item: souvenir, type: 'souvenir' as const }))
    ];

    // 優先順位に従ってプールを決定
    if (favoriteUnvisitedItems.length > 0) {
      itemsPool = favoriteUnvisitedItems;
    } else if (unvisitedItems.length > 0) {
      itemsPool = unvisitedItems;
    } else {
      itemsPool = allItems;
    }

    // プールが3つ未満の場合は、全アイテムから補完
    if (itemsPool.length < 3) {
      const additionalItems = allItems.filter(
        item => !itemsPool.some(poolItem => 
          poolItem.type === item.type && poolItem.item.id === item.item.id
        )
      );
      const shuffledAdditional = [...additionalItems].sort(() => Math.random() - 0.5);
      itemsPool = [...itemsPool, ...shuffledAdditional.slice(0, 3 - itemsPool.length)];
    }

    // 3つの提案を取得（重複なし、観光地とお土産のバランスを考慮）
    const shuffled = [...itemsPool].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, Math.min(3, shuffled.length));

    this.randomSuggestions = selectedItems.map(({ item, type }) => {
      // 選ばれた理由を判定
      let reason: 'favorite' | 'unvisited' | 'random' = 'random';
      if (type === 'sight') {
        const sight = item as Sight;
        if (favoriteUnvisitedSights.length > 0 && favoriteUnvisitedSights.includes(sight)) {
          reason = 'favorite';
        } else if (unvisitedSights.length > 0 && unvisitedSights.includes(sight)) {
          reason = 'unvisited';
        }

        return {
          id: sight.id,
          name: sight.name,
          description: sight.description,
          type: 'sight' as const,
          photo: sight.photo,
          address: sight.address,
          price: sight.price,
          name_kana: sight.name_kana,
          reason: reason,
          isFavorite: this.userDataService.isFavorite(sight.id, 'sight'),
          isVisited: this.userDataService.isVisited(sight.id, 'sight')
        };
      } else {
        const souvenir = item as Souvenir;
        if (favoriteUnvisitedSouvenirs.length > 0 && favoriteUnvisitedSouvenirs.includes(souvenir)) {
          reason = 'favorite';
        } else if (unvisitedSouvenirs.length > 0 && unvisitedSouvenirs.includes(souvenir)) {
          reason = 'unvisited';
        }

        return {
          id: souvenir.id,
          name: souvenir.name,
          description: souvenir.description,
          type: 'souvenir' as const,
          name_kana: souvenir.name_kana,
          reason: reason,
          isFavorite: this.userDataService.isFavorite(souvenir.id, 'souvenir'),
          isVisited: this.userDataService.isVisited(souvenir.id, 'souvenir')
        };
      }
    });
  }

  getRouterLink(suggestion: RandomSuggestion): string {
    return suggestion.type === 'sight' ? `/sights/${suggestion.id}` : `/souvenir/${suggestion.id}`;
  }

  getPhotoPath(photo: string | undefined): string | null {
    if (!photo || photo.trim() === '') {
      return null;
    }
    return `/assets/${photo}`;
  }

  getRecommendationReason(suggestion: RandomSuggestion | null): string {
    if (!suggestion) return '';
    
    if (suggestion.reason === 'favorite') {
      if (suggestion.type === 'sight') {
        return 'あなたのお気に入りで、まだ行ったことがない場所です';
      } else {
        return 'あなたのお気に入りで、まだ購入していないお土産です';
      }
    } else if (suggestion.reason === 'unvisited') {
      if (suggestion.type === 'sight') {
        return 'まだ行ったことがない場所です';
      } else {
        return 'まだ購入していないお土産です';
      }
    } else {
      if (suggestion.type === 'sight') {
        return '京都の観光地を発見しましょう';
      } else {
        return '京都のお土産を発見しましょう';
      }
    }
  }

  toggleDescription(suggestionId: string) {
    this.expandedDescriptions[suggestionId] = !this.expandedDescriptions[suggestionId];
  }

  isDescriptionExpanded(suggestionId: string): boolean {
    return this.expandedDescriptions[suggestionId] || false;
  }

  getDescriptionText(suggestion: RandomSuggestion, isExpanded: boolean): string {
    if (!suggestion.description) {
      return '';
    }
    if (isExpanded) {
      return suggestion.description;
    }
    // スマホでは60文字に短縮
    return truncateText(suggestion.description, 60);
  }

  onSegmentChange(event: CustomEvent) {
    this.contentType = event.detail.value;
  }

  public isIos() {
    const win = window as Window & { Ionic?: { mode?: string } };
    const mode = win?.Ionic?.mode;
    return mode === 'ios';
  }

  refresh(ev: CustomEvent) {
    this.getRandomSuggestions();
    setTimeout(() => {
      ev.detail.complete();
    }, 500);
  }
}

