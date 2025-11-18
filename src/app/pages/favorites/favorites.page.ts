import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { UserDataService, Favorite } from '../../shared/services/user-data.service';
import { selectSouvenirFeature } from '../souvenir/store';
import { selectSightsFeature } from '../sights/store';
import { Souvenir, SouvenirService } from '../souvenir/souvenir.service';
import { Sight, SightsService } from '../sights/sights.service';
import { Subscription } from 'rxjs';

interface FavoriteItem {
  id: string;
  name: string;
  name_kana: string;
  description: string;
  type: 'sight' | 'souvenir';
  addedAt: string;
}

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
    // データを読み込む（まだ読み込まれていない場合）
    this.sightsService.fetchSights().subscribe();
    this.souvenirService.fetchSouvenires().subscribe();
    this.loadFavorites();
  }

  loadFavorites() {
    this.loading = true;
    const favorites = this.userDataService.getFavorites();
    this.favoriteItems = [];

    // お土産データを取得
    const souvenirSubscription = this.store.select(selectSouvenirFeature).subscribe(souvenirState => {
      if (souvenirState && souvenirState.souvenires) {
        const souvenirs = souvenirState.souvenires as Souvenir[];

        // 観光地データを取得
        const sightsSubscription = this.store.select(selectSightsFeature).subscribe(sightState => {
          if (sightState && sightState.sights) {
            const sights = sightState.sights as Sight[];

            this.favoriteItems = favorites.map(fav => {
              if (fav.itemType === 'souvenir') {
                const item = souvenirs.find(s => s.id === fav.itemId);
                if (item) {
                  return {
                    id: item.id,
                    name: item.name,
                    name_kana: item.name_kana,
                    description: item.description,
                    type: 'souvenir' as const,
                    addedAt: fav.addedAt
                  };
                }
              } else {
                const item = sights.find(s => s.id === fav.itemId);
                if (item) {
                  return {
                    id: item.id,
                    name: item.name,
                    name_kana: item.name_kana,
                    description: item.description,
                    type: 'sight' as const,
                    addedAt: fav.addedAt
                  };
                }
              }
              return null;
            }).filter((item): item is FavoriteItem => item !== null);

            this.loading = false;
          }
        });

        this.subscriptions.add(sightsSubscription);
      }
    });

    this.subscriptions.add(souvenirSubscription);
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
