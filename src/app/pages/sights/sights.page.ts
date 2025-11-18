import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { createSelector, Store } from '@ngrx/store';
import { ToastController } from '@ionic/angular';
import { SightsService, Sight } from './sights.service';
import { selectSightsFeature } from './store';
import { UserDataService } from '../../shared/services/user-data.service';

@Component({
  selector: 'app-sights',
  templateUrl: './sights.page.html',
  styleUrls: ['./sights.page.scss'],
})
export class SightsPage implements OnInit {
  public sights$ = this.store.select(createSelector(selectSightsFeature, state => state.items));
  private allSights: Sight[] = [];

  constructor(
    private readonly service: SightsService,
    private readonly store: Store,
    private readonly router: Router,
    private readonly toastController: ToastController,
    private readonly userDataService: UserDataService
  ) { }

  ngOnInit() {
    this.service.fetchSights().subscribe();

    // 全データを取得
    this.store.select(selectSightsFeature).subscribe(state => {
      this.allSights = state.sights as Sight[];
    });
  }

  public isIos() {
    const win = window as any;
    const mode = win && win.Ionic && win.Ionic.mode;
    return mode === 'ios';
  }

  async goToRandomSight() {
    if (this.allSights.length === 0) {
      const toast = await this.toastController.create({
        message: 'データを読み込み中です',
        duration: 1500,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // 未訪問のスポットを優先的に選択
    const visits = this.userDataService.getVisits();
    const visitedSightIds = visits
      .filter(v => v.itemType === 'sight')
      .map(v => v.itemId);

    const unvisitedSights = this.allSights.filter(
      sight => !visitedSightIds.includes(sight.id)
    );

    // 未訪問スポットがあればそこから、なければ全スポットから選択
    const sightsPool = unvisitedSights.length > 0 ? unvisitedSights : this.allSights;
    const randomSight = sightsPool[Math.floor(Math.random() * sightsPool.length)];

    // トーストで通知
    const toast = await this.toastController.create({
      message: `ランダムで「${randomSight.name}」を選択しました！`,
      duration: 1500,
      color: 'success'
    });
    await toast.present();

    // 詳細ページへ遷移
    this.router.navigate(['/sights', randomSight.id]);
  }

}
