import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { UserDataService } from '../../shared/services/user-data.service';
import { selectSouvenirFeature } from '../souvenir/store';
import { selectSightsFeature } from '../sights/store';
import { SouvenirService } from '../souvenir/souvenir.service';
import { SightsService } from '../sights/sights.service';
import { Subscription, combineLatest, EMPTY, of, forkJoin } from 'rxjs';
import { filter, take, switchMap, catchError } from 'rxjs/operators';
import { FavoriteItem, mapFavoritesToFavoriteItems } from './favorites.utils';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit, OnDestroy {
  public favoriteItems: FavoriteItem[] = [];
  public loading = true;

  private subscriptions = new Subscription();
  private loadFavoritesSubscription?: Subscription;

  constructor(
    private readonly userDataService: UserDataService,
    private readonly store: Store,
    private readonly sightsService: SightsService,
    private readonly souvenirService: SouvenirService
  ) {}

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.loadFavoritesSubscription) {
      this.loadFavoritesSubscription.unsubscribe();
    }
    this.subscriptions.unsubscribe();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    // combineLatestを使用して、両方のストアの状態を一度に監視
    const loadSubscription = combineLatest([
      this.store.select(selectSightsFeature),
      this.store.select(selectSouvenirFeature)
    ]).pipe(
      take(1),
      switchMap(([sightState, souvenirState]) => {
        const needsSights = !sightState?.sights || sightState.sights.length === 0;
        const needsSouvenirs = !souvenirState?.souvenirs || souvenirState.souvenirs.length === 0;

        // 必要なデータがない場合のみfetchを実行
        const fetchObservables = [];
        if (needsSights) {
          fetchObservables.push(
            this.sightsService.fetchSights(false).pipe(
              catchError(error => {
                console.error('観光地データの読み込みに失敗しました:', error);
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
                return EMPTY;
              })
            )
          );
        }

        // fetchが必要な場合は forkJoin で並行実行し、完了後にストアからデータを取得
        if (fetchObservables.length > 0) {
          return forkJoin(fetchObservables).pipe(
            switchMap(() => combineLatest([
              this.store.select(selectSightsFeature),
              this.store.select(selectSouvenirFeature)
            ]).pipe(take(1)))
          );
        }

        // 既にデータがある場合はそのまま返す
        return of([sightState, souvenirState]);
      }),
      // データが揃うまで待つ
      filter(([sightState, souvenirState]) => {
        if (!sightState || !souvenirState) {
          return false;
        }
        // 型ガード: sights プロパティの存在を確認
        if (!('sights' in sightState)) {
          return false;
        }
        // 型ガード: souvenirs プロパティの存在を確認
        if (!('souvenirs' in souvenirState)) {
          return false;
        }
        // 型アサーションを使用して型を明示
        const sightsState = sightState as { sights: unknown[] };
        const souvenirsState = souvenirState as { souvenirs: unknown[] };
        return Array.isArray(sightsState.sights) && 
               sightsState.sights.length > 0 &&
               Array.isArray(souvenirsState.souvenirs) && 
               souvenirsState.souvenirs.length > 0;
      }),
      take(1)
    ).subscribe({
      next: () => {
        // データが揃ったら、お気に入りを読み込む
        this.loadFavorites();
      },
      error: (error) => {
        console.error('データの読み込みに失敗しました:', error);
        // エラーが発生しても、既存のデータでお気に入りを読み込む
        this.loadFavorites();
      }
    });

    this.subscriptions.add(loadSubscription);
  }

  loadFavorites() {
    // 既存のサブスクリプションをクリーンアップ
    if (this.loadFavoritesSubscription) {
      this.loadFavoritesSubscription.unsubscribe();
    }

    this.loading = true;
    const favorites = this.userDataService.getFavorites();
    this.favoriteItems = [];

    // 両方のストアからデータを取得（データが揃ってから処理）
    this.loadFavoritesSubscription = combineLatest([
      this.store.select(selectSouvenirFeature).pipe(
        filter(state => Array.isArray(state?.souvenires)),
        take(1)
      ),
      this.store.select(selectSightsFeature).pipe(
        filter(state => Array.isArray(state?.sights)),
        take(1)
      )
    ]).pipe(
      catchError(error => {
        console.error('Error loading favorites data:', error);
        this.loading = false;
        return of([null, null]);
      })
    ).subscribe(([souvenirState, sightState]) => {
      if (!souvenirState || !sightState) {
        this.loading = false;
        return;
      }

      const souvenirs = souvenirState.souvenirs;
      const sights = sightState.sights;

      // 純粋関数を使用してマッピング（テスト可能で再発防止）
      this.favoriteItems = mapFavoritesToFavoriteItems(favorites, souvenirs, sights);

      this.loading = false;
    });
  }

  removeFavorite(item: FavoriteItem) {
    this.userDataService.removeFavorite(item.id, item.type);
    this.loadFavorites();
  }

  getRouterLink(item: FavoriteItem): string {
    return item.type === 'sight' ? `/sights/${item.id}` : `/souvenir/${item.id}`;
  }

  doRefresh(event: any) {
    this.loadFavorites();
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }
}
