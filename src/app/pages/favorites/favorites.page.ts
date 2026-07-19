import { Component, OnDestroy, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { UserDataService } from '../../shared/services/user-data.service';
import { selectSouvenirFeature } from '../souvenir/store';
import { selectSightsFeature } from '../sights/store';
import { SouvenirService, Souvenir } from '../souvenir/souvenir.service';
import { SightsService, Sight } from '../sights/sights.service';
import { Subscription, combineLatest, EMPTY, of, forkJoin } from 'rxjs';
import { filter, take, switchMap, catchError, tap, finalize } from 'rxjs/operators';
import { FavoriteItem, mapFavoritesToFavoriteItems } from './favorites.utils';

@Component({
    selector: 'app-favorites',
    templateUrl: './favorites.page.html',
    styleUrls: ['./favorites.page.scss'],
    standalone: false
})
export class FavoritesPage implements OnDestroy {
  private readonly userDataService = inject(UserDataService);
  private readonly store = inject(Store);
  private readonly sightsService = inject(SightsService);
  private readonly souvenirService = inject(SouvenirService);
  private readonly toastController = inject(ToastController);

  public favoriteItems: FavoriteItem[] = [];
  public loading = true;
  public searchQuery = '';
  public favSegment = 'all';

  get filteredFavorites(): FavoriteItem[] {
    let items = this.favoriteItems;
    if (this.favSegment === 'sights') {
      items = items.filter(i => i.type === 'sight');
    } else if (this.favSegment === 'souvenirs') {
      items = items.filter(i => i.type === 'souvenir');
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.name_kana && i.name_kana.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q))
      );
    }
    return items;
  }

  onFavSegmentChange(event: CustomEvent) {
    this.favSegment = event.detail.value;
  }

  private subscriptions = new Subscription();

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.favoriteItems = [];

    // ストアの状態を一度取得し、必要に応じてfetchを実行
    const loadSubscription = combineLatest([
      this.store.select(selectSightsFeature),
      this.store.select(selectSouvenirFeature)
    ]).pipe(
      take(1),
      switchMap(([sightState, souvenirState]) => {
        const needsSights = !Array.isArray(sightState.sights) || sightState.sights.length === 0;
        const needsSouvenirs = !Array.isArray(souvenirState.souvenirs) || souvenirState.souvenirs.length === 0;

        // 既にデータがある場合はそのまま返す
        if (!needsSights && !needsSouvenirs) {
          return of([sightState, souvenirState]);
        }

        // 必要なデータがない場合のみfetchを実行（並行実行）
        const fetchObservables: Array<ReturnType<typeof this.sightsService.fetchSights | typeof this.souvenirService.fetchSouvenirs>> = [];
        
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

        // fetchが必要な場合は forkJoin で並行実行
        // fetch後は、ストアが更新されるまで待つために、combineLatestでストアを監視し続ける
        // ネストしたcombineLatestを避けるため、fetch完了後にストアを監視し続ける
        return forkJoin(fetchObservables).pipe(
          switchMap(() => 
            combineLatest([
              this.store.select(selectSightsFeature),
              this.store.select(selectSouvenirFeature)
            ]).pipe(
              // データが揃うまで待つ
              filter(([sightState, souvenirState]) => 
                !!sightState?.sights?.length && !!souvenirState?.souvenirs?.length
              ),
              take(1)
            )
          )
        );
      }),
      // データが揃うまで待つ（fetchが不要な場合のためのフィルター）
      filter(([sightState, souvenirState]) => {
        return !!(sightState as { sights?: Sight[] })?.sights?.length && !!(souvenirState as { souvenirs?: Souvenir[] })?.souvenirs?.length;
      }),
      take(1),
      // データが揃ったら、お気に入りを読み込む
      tap(([sightState, souvenirState]) => {
        const favorites = this.userDataService.getFavorites();
        const souvenirs = (souvenirState as { souvenirs: Souvenir[] }).souvenirs;
        const sights = (sightState as { sights: Sight[] }).sights;
        
        // 純粋関数を使用してマッピング（テスト可能で再発防止）
        this.favoriteItems = mapFavoritesToFavoriteItems(
          favorites,
          souvenirs,
          sights
        );
      }),
      catchError(error => {
        console.error('データの読み込みに失敗しました:', error);
        // エラーが発生しても、既存のデータでお気に入りを読み込む
        return combineLatest([
          this.store.select(selectSightsFeature),
          this.store.select(selectSouvenirFeature)
        ]).pipe(
          take(1),
          tap(([sightState, souvenirState]) => {
            if (sightState?.sights && souvenirState?.souvenirs) {
              const favorites = this.userDataService.getFavorites();
              const souvenirs = souvenirState.souvenirs;
              const sights = sightState.sights;
              
              if (Array.isArray(souvenirs) && Array.isArray(sights)) {
                this.favoriteItems = mapFavoritesToFavoriteItems(
                  favorites,
                  souvenirs,
                  sights
                );
              }
            }
          })
        );
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe();

    this.subscriptions.add(loadSubscription);
  }

  loadFavorites() {
    // 既存のデータからお気に入りを再読み込み（リフレッシュ時などに使用）
    this.loading = true;
    this.favoriteItems = [];

    const loadSubscription = combineLatest([
      this.store.select(selectSouvenirFeature).pipe(
        filter(state => Array.isArray(state.souvenirs)),
        take(1)
      ),
      this.store.select(selectSightsFeature).pipe(
        filter(state => Array.isArray(state.sights)),
        take(1)
      )
    ]).pipe(
      tap(([souvenirState, sightState]) => {
        if (!souvenirState || !sightState) {
          return;
        }

        const favorites = this.userDataService.getFavorites();
        const souvenirs = souvenirState.souvenirs;
        const sights = sightState.sights;

        // 純粋関数を使用してマッピング（テスト可能で再発防止）
        this.favoriteItems = mapFavoritesToFavoriteItems(favorites, souvenirs, sights);
      }),
      catchError(error => {
        console.error('Error loading favorites data:', error);
        return EMPTY;
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe();

    this.subscriptions.add(loadSubscription);
  }

  async removeFavorite(item: FavoriteItem) {
    this.userDataService.removeFavorite(item.id, item.type);
    this.loadFavorites();

    // HIG: 頻繁で取り消し可能な削除には確認ダイアログを出さず Undo を提供する
    const toast = await this.toastController.create({
      message: `「${item.name}」をお気に入りから削除しました`,
      duration: 3500,
      color: 'dark',
      buttons: [
        {
          text: '元に戻す',
          handler: () => {
            this.userDataService.addFavorite(item.id, item.type);
            this.loadFavorites();
          }
        }
      ]
    });
    await toast.present();
  }

  getRouterLink(item: FavoriteItem): string {
    return item.type === 'sight' ? `/sights/${item.id}` : `/souvenir/${item.id}`;
  }

  doRefresh(event: CustomEvent) {
    this.loadFavorites();
    setTimeout(() => {
      (event.target as HTMLIonRefresherElement).complete();
    }, 500);
  }
}
