import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store, createSelector } from '@ngrx/store';
import { UserDataService } from '../../shared/services/user-data.service';
import { selectSouvenirFeature } from '../souvenir/store';
import { selectSightsFeature } from '../sights/store';
import { Souvenir, SouvenirService } from '../souvenir/souvenir.service';
import { Sight, SightsService } from '../sights/sights.service';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
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
})
export class DiscoverPage implements OnInit, OnDestroy {
  public contentType: ContentType = 'sights';
  public sights$ = this.store.select(createSelector(selectSightsFeature, state => state.items));
  public souvenires$ = this.store.select(createSelector(selectSouvenirFeature, state => state.items));
  
  public randomSuggestions: RandomSuggestion[] = [];
  public expandedDescriptions: { [key: string]: boolean } = {}; // デフォルトは折りたたみ
  
  private allSights: Sight[] = [];
  private allSouvenirs: Souvenir[] = [];
  private subscriptions = new Subscription();
  public isLoading = false;
  public hasError = false;
  public errorMessage = '';

  constructor(
    private readonly userDataService: UserDataService,
    private readonly store: Store,
    private readonly router: Router,
    private readonly sightsService: SightsService,
    private readonly souvenirService: SouvenirService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    // 観光地データの読み込み
    const sightsState$ = this.store.select(selectSightsFeature);
    sightsState$.pipe(take(1)).subscribe(sightState => {
      const hasData = sightState && sightState.sights && sightState.sights.length > 0;
      if (!hasData) {
        this.isLoading = true;
        this.hasError = false;
        this.errorMessage = '';

        const sightsSubscription = this.sightsService.fetchSights(false).subscribe({
          next: () => {},
          error: (error) => {
            console.error('観光地データの読み込みに失敗しました:', error);
            this.hasError = true;
            this.errorMessage = '観光地データの読み込みに失敗しました';
            this.isLoading = false;
          }
        });

        this.subscriptions.add(sightsSubscription);
      }
    });

    // お土産データの読み込み
    const souvenirState$ = this.store.select(selectSouvenirFeature);
    souvenirState$.pipe(take(1)).subscribe(souvenirState => {
      const hasData = souvenirState && souvenirState.souvenires && souvenirState.souvenires.length > 0;
      if (!hasData) {
        const souvenirSubscription = this.souvenirService.fetchSouvenires(false).subscribe({
          next: () => {},
          error: (error) => {
            console.error('お土産データの読み込みに失敗しました:', error);
            if (!this.hasError) {
              this.hasError = true;
              this.errorMessage = 'お土産データの読み込みに失敗しました';
            }
            this.isLoading = false;
          }
        });

        this.subscriptions.add(souvenirSubscription);
      }
    });

    // データが読み込まれるまで待つ
    const sightsSubscription = sightsState$.pipe(
      filter(state => state && state.sights && state.sights.length > 0),
      take(1)
    ).subscribe(sightState => {
      this.allSights = sightState.sights as Sight[];
      this.getRandomSuggestions();
      this.isLoading = false;
      this.hasError = false;
    });

    const souvenirSubscription = souvenirState$.pipe(
      filter(state => state && state.souvenires && state.souvenires.length > 0),
      take(1)
    ).subscribe(souvenirState => {
      this.allSouvenirs = souvenirState.souvenires as Souvenir[];
    });

    this.subscriptions.add(sightsSubscription);
    this.subscriptions.add(souvenirSubscription);
  }

  getRandomSuggestions() {
    if (this.allSights.length === 0) {
      console.warn('観光地データがまだ読み込まれていません');
      return;
    }

    const visits = this.userDataService.getVisits();
    const favorites = this.userDataService.getFavorites();
    
    const visitedSightIds = visits
      .filter(v => v.itemType === 'sight')
      .map(v => v.itemId);
    
    const favoriteSightIds = favorites
      .filter(f => f.itemType === 'sight')
      .map(f => f.itemId);

    // 優先順位1: お気に入りで未訪問の観光地
    const favoriteUnvisitedSights = this.allSights.filter(
      sight => favoriteSightIds.includes(sight.id) && !visitedSightIds.includes(sight.id)
    );

    // 優先順位2: 未訪問の観光地
    const unvisitedSights = this.allSights.filter(
      sight => !visitedSightIds.includes(sight.id)
    );

    // 優先順位に従ってプールを決定
    let sightsPool: Sight[] = [];
    if (favoriteUnvisitedSights.length > 0) {
      sightsPool = favoriteUnvisitedSights;
    } else if (unvisitedSights.length > 0) {
      sightsPool = unvisitedSights;
    } else {
      sightsPool = this.allSights;
    }

    // プールが3つ未満の場合は、全観光地から補完
    if (sightsPool.length < 3) {
      const additionalSights = this.allSights.filter(
        sight => !sightsPool.some(poolSight => poolSight.id === sight.id)
      );
      const shuffledAdditional = [...additionalSights].sort(() => Math.random() - 0.5);
      sightsPool = [...sightsPool, ...shuffledAdditional.slice(0, 3 - sightsPool.length)];
    }

    // 3つの提案を取得（重複なし）
    // 配列をシャッフルしてから最初の3つを取得
    const shuffled = [...sightsPool].sort(() => Math.random() - 0.5);
    const selectedSights = shuffled.slice(0, Math.min(3, shuffled.length));

    this.randomSuggestions = selectedSights.map(sight => {
      // 選ばれた理由を判定
      let reason: 'favorite' | 'unvisited' | 'random' = 'random';
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
      return 'あなたのお気に入りで、まだ行ったことがない場所です';
    } else if (suggestion.reason === 'unvisited') {
      return 'まだ行ったことがない場所です';
    } else {
      return '京都の観光地を発見しましょう';
    }
  }

  toggleDescription(suggestionId: string) {
    this.expandedDescriptions[suggestionId] = !this.expandedDescriptions[suggestionId];
  }

  isDescriptionExpanded(suggestionId: string): boolean {
    return this.expandedDescriptions[suggestionId] || false;
  }

  getDescriptionText(suggestion: RandomSuggestion, isExpanded: boolean): string {
    if (isExpanded) {
      return suggestion.description;
    }
    // スマホでは60文字に短縮
    return truncateText(suggestion.description, 60);
  }

  onSegmentChange(event: any) {
    this.contentType = event.detail.value;
  }

  public isIos() {
    const win = window as any;
    const mode = win && win.Ionic && win.Ionic.mode;
    return mode === 'ios';
  }

  refresh(ev: any) {
    this.getRandomSuggestions();
    setTimeout(() => {
      ev.detail.complete();
    }, 500);
  }
}

