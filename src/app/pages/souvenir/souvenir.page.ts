import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store, createSelector } from '@ngrx/store';
import { ToastController } from '@ionic/angular';
import { SouvenirService, Souvenir } from './souvenir.service';
import { selectSouvenirFeature } from './store';
import { UserDataService } from '../../shared/services/user-data.service';

@Component({
  selector: 'app-souvenir',
  templateUrl: './souvenir.page.html',
  styleUrls: ['./souvenir.page.scss'],
})
export class SouvenirPage implements OnInit {
  public souvenires$ = this.store.select(createSelector(selectSouvenirFeature, state => state.items));
  private allSouvenirs: Souvenir[] = [];

  constructor(
    private readonly service: SouvenirService,
    private readonly store: Store,
    private readonly router: Router,
    private readonly toastController: ToastController,
    private readonly userDataService: UserDataService
  ) { }

  ngOnInit() {
    this.service.fetchSouvenires().subscribe();

    // 全データを取得
    this.store.select(selectSouvenirFeature).subscribe(state => {
      this.allSouvenirs = state.souvenires as Souvenir[];
    });
  }

  public isIos() {
    const win = window as any;
    const mode = win && win.Ionic && win.Ionic.mode;
    return mode === 'ios';
  }

  async goToRandomSouvenir() {
    if (this.allSouvenirs.length === 0) {
      const toast = await this.toastController.create({
        message: 'データを読み込み中です',
        duration: 1500,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // 未訪問のお土産を優先的に選択
    const visits = this.userDataService.getVisits();
    const visitedSouvenirIds = visits
      .filter(v => v.itemType === 'souvenir')
      .map(v => v.itemId);

    const unvisitedSouvenirs = this.allSouvenirs.filter(
      souvenir => !visitedSouvenirIds.includes(souvenir.id)
    );

    // 未訪問お土産があればそこから、なければ全お土産から選択
    const souvenirsPool = unvisitedSouvenirs.length > 0 ? unvisitedSouvenirs : this.allSouvenirs;
    const randomSouvenir = souvenirsPool[Math.floor(Math.random() * souvenirsPool.length)];

    // トーストで通知
    const toast = await this.toastController.create({
      message: `ランダムで「${randomSouvenir.name}」を選択しました！`,
      duration: 1500,
      color: 'success'
    });
    await toast.present();

    // 詳細ページへ遷移
    this.router.navigate(['/souvenir', randomSouvenir.id]);
  }

}
