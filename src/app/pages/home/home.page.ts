import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AlertController, ToastController } from '@ionic/angular';
import { UserDataService } from '../../shared/services/user-data.service';
import { selectSouvenirFeature } from '../souvenir/store';
import { selectSightsFeature } from '../sights/store';
import { Souvenir, SouvenirService } from '../souvenir/souvenir.service';
import { Sight, SightsService } from '../sights/sights.service';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

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
export class HomePage implements OnInit, OnDestroy {
  public randomSuggestion: RandomSuggestion | null = null;
  public stats = {
    totalFavorites: 0,
    totalVisits: 0,
    totalPlans: 0
  };
  public isLoading = false;
  public hasError = false;
  public errorMessage = '';

  private allSights: Sight[] = [];
  private allSouvenirs: Souvenir[] = [];
  private subscriptions = new Subscription();

  constructor(
    private readonly userDataService: UserDataService,
    private readonly store: Store,
    private readonly router: Router,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController,
    private readonly sightsService: SightsService,
    private readonly souvenirService: SouvenirService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadData();
    this.checkOnboarding();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  ionViewWillEnter() {
    this.loadStats();
    this.loadData();
  }

  loadStats() {
    this.stats = this.userDataService.getStats();
  }

  loadData() {
    // 既にデータが読み込まれているかチェック
    const sightsState$ = this.store.select(selectSightsFeature);
    const souvenirState$ = this.store.select(selectSouvenirFeature);

    // データが既に読み込まれているか確認
    sightsState$.pipe(take(1)).subscribe(sightState => {
      const hasData = sightState && sightState.sights && sightState.sights.length > 0;
      if (!hasData) {
        this.isLoading = true;
        this.hasError = false;
        this.errorMessage = '';

        // データを読み込む（ローディングダイアログは表示しない）
        const sightsSubscription = this.sightsService.fetchSights(false).subscribe({
          next: () => {
            // データ読み込み成功
          },
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

    souvenirState$.pipe(take(1)).subscribe(souvenirState => {
      const hasData = souvenirState && souvenirState.souvenires && souvenirState.souvenires.length > 0;
      if (!hasData) {
        const souvenirSubscription = this.souvenirService.fetchSouvenires(false).subscribe({
          next: () => {
            // データ読み込み成功
          },
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
      this.getRandomSuggestion();
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

  retryLoad() {
    this.loadData();
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

  async checkOnboarding() {
    if (!this.userDataService.isOnboardingCompleted()) {
      // データが読み込まれるまで少し待つ
      setTimeout(async () => {
        await this.showOnboardingModal();
      }, 1000);
    }
  }

  async showOnboardingModal() {
    const modal = await this.alertController.create({
      header: '京都再発見アプリへようこそ！',
      message: `
        <div style="text-align: left; padding: 10px 0;">
          <p><strong>このアプリの使い方</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>ホーム</strong>：今週末のおすすめスポットが表示されます</li>
            <li><strong>観光地・お土産</strong>：京都の名所やお土産を探せます</li>
            <li><strong>お気に入り</strong>：気になる場所を保存できます</li>
            <li><strong>プラン</strong>：複数のスポットを組み合わせてプランを作成できます</li>
          </ul>
          <p style="margin-top: 15px;">「今週末のおすすめ」から、新しい京都の魅力を発見してみましょう！</p>
        </div>
      `,
      buttons: [
        {
          text: '始める',
          handler: () => {
            this.userDataService.completeOnboarding();
          }
        }
      ],
      cssClass: 'onboarding-modal'
    });

    await modal.present();
  }
}
