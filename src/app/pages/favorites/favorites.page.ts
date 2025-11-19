import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { UserDataService } from '../../shared/services/user-data.service';
import { selectSouvenirFeature } from '../souvenir/store';
import { selectSightsFeature } from '../sights/store';
import { SouvenirService } from '../souvenir/souvenir.service';
import { SightsService } from '../sights/sights.service';
import { Subscription, combineLatest } from 'rxjs';
import { filter, take } from 'rxjs/operators';
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

  constructor(
    private readonly userDataService: UserDataService,
    private readonly store: Store,
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
    // データが既に読み込まれているか確認
    const sightsState$ = this.store.select(selectSightsFeature);
    sightsState$.pipe(take(1)).subscribe(sightState => {
      const hasSightsData = sightState && sightState.sights && sightState.sights.length > 0;
      if (!hasSightsData) {
        this.sightsService.fetchSights(false).subscribe();
      }
    });

    const souvenirState$ = this.store.select(selectSouvenirFeature);
    souvenirState$.pipe(take(1)).subscribe(souvenirState => {
      const hasSouvenirData = souvenirState && souvenirState.souvenires && souvenirState.souvenires.length > 0;
      if (!hasSouvenirData) {
        this.souvenirService.fetchSouvenires(false).subscribe();
      }
    });

    this.loadFavorites();
  }

  loadFavorites() {
    this.loading = true;
    const favorites = this.userDataService.getFavorites();
    this.favoriteItems = [];

    // 両方のストアからデータを取得（データが揃ってから処理）
    const dataSubscription = combineLatest([
      this.store.select(selectSouvenirFeature).pipe(
        filter(state => state !== null && state.souvenires !== null && state.souvenires !== undefined && Array.isArray(state.souvenires))
      ),
      this.store.select(selectSightsFeature).pipe(
        filter(state => state !== null && state.sights !== null && state.sights !== undefined && Array.isArray(state.sights))
      )
    ]).subscribe(([souvenirState, sightState]) => {
      const souvenirs = souvenirState.souvenires;
      const sights = sightState.sights;

      // 純粋関数を使用してマッピング（テスト可能で再発防止）
      this.favoriteItems = mapFavoritesToFavoriteItems(favorites, souvenirs, sights);

      this.loading = false;
    });

    this.subscriptions.add(dataSubscription);
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
