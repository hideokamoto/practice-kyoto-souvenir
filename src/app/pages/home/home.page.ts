import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AlertController, ToastController } from '@ionic/angular';
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
    private readonly store: Store,
    private readonly router: Router,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController
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

  async createRandomPlan(count: number) {
    if (this.allSights.length === 0) {
      const toast = await this.toastController.create({
        message: 'データを読み込み中です。しばらくお待ちください。',
        duration: 2000,
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

    // ランダムに指定数を選択
    const selectedSights = this.getRandomItems(sightsPool, Math.min(count, sightsPool.length));

    if (selectedSights.length === 0) {
      const toast = await this.toastController.create({
        message: 'スポットの選択に失敗しました',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    // プラン名を入力
    const alert = await this.alertController.create({
      header: 'ランダムプラン作成',
      message: `${selectedSights.length}件のスポットを選択しました。プラン名を入力してください。`,
      inputs: [
        {
          name: 'planName',
          type: 'text',
          placeholder: `ランダム${selectedSights.length}件プラン`,
          value: `ランダム${selectedSights.length}件プラン（${new Date().toLocaleDateString()}）`
        }
      ],
      buttons: [
        {
          text: 'キャンセル',
          role: 'cancel'
        },
        {
          text: '作成',
          handler: async (data) => {
            const planName = data.planName && data.planName.trim()
              ? data.planName.trim()
              : `ランダム${selectedSights.length}件プラン`;

            // プランを作成
            const plan = this.userDataService.createPlan(planName);

            // スポットを追加
            selectedSights.forEach(sight => {
              this.userDataService.addItemToPlan(plan.id, sight.id, 'sight');
            });

            // 成功メッセージ
            const toast = await this.toastController.create({
              message: `「${planName}」を作成しました！`,
              duration: 2000,
              color: 'success'
            });
            await toast.present();

            // プラン詳細ページへ遷移
            this.router.navigate(['/plans', plan.id]);
          }
        }
      ]
    });

    await alert.present();
  }

  private getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}
