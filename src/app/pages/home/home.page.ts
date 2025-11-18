import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { UserDataService } from '../../shared/services/user-data.service';
import { selectSouvenirFeature } from '../souvenir/store';
import { selectSightsFeature } from '../sights/store';
import { Souvenir } from '../souvenir/souvenir.service';
import { Sight } from '../sights/sights.service';

interface RandomSuggestion {
  id: string;
  name: string;
  description: string;
  type: 'sight' | 'souvenir';
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  public randomSuggestion: RandomSuggestion | null = null;
  public stats = {
    totalFavorites: 0,
    totalVisits: 0,
    totalPlans: 0
  };

  private allSights: Sight[] = [];
  private allSouvenirs: Souvenir[] = [];

  constructor(
    private readonly userDataService: UserDataService,
    private readonly store: Store
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadStats();
    this.loadData();
  }

  loadStats() {
    this.stats = this.userDataService.getStats();
  }

  loadData() {
    this.store.select(selectSightsFeature).subscribe(sightState => {
      this.allSights = sightState.sights as Sight[];
      this.getRandomSuggestion();
    });

    this.store.select(selectSouvenirFeature).subscribe(souvenirState => {
      this.allSouvenirs = souvenirState.souvenires as Souvenir[];
    });
  }

  getRandomSuggestion() {
    // 未訪問のスポットを優先的に提案
    const visits = this.userDataService.getVisits();
    const visitedSightIds = visits
      .filter(v => v.itemType === 'sight')
      .map(v => v.itemId);

    const unvisitedSights = this.allSights.filter(
      sight => !visitedSightIds.includes(sight.id)
    );

    // 未訪問スポットがあればそこから、なければ全スポットからランダムに選択
    const sightsPool = unvisitedSights.length > 0 ? unvisitedSights : this.allSights;

    if (sightsPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * sightsPool.length);
      const randomSight = sightsPool[randomIndex];
      this.randomSuggestion = {
        id: randomSight.id,
        name: randomSight.name,
        description: randomSight.description,
        type: 'sight'
      };
    }
  }

  getRouterLink(suggestion: RandomSuggestion): string {
    return suggestion.type === 'sight' ? `/sights/${suggestion.id}` : `/souvenir/${suggestion.id}`;
  }

  refresh(ev: any) {
    this.loadStats();
    this.getRandomSuggestion();
    setTimeout(() => {
      ev.detail.complete();
    }, 500);
  }
}
