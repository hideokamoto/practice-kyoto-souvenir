import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { UserDataService, Plan } from '../../shared/services/user-data.service';
import { selectSightsFeature } from '../sights/store';
import { Sight, SightsService } from '../sights/sights.service';
import { Subscription, combineLatest, EMPTY, of } from 'rxjs';
import { take, switchMap, catchError, filter } from 'rxjs/operators';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.page.html',
  styleUrls: ['./plans.page.scss'],
})
export class PlansPage implements OnInit, OnDestroy {
  public plans: Plan[] = [];
  private allSights: Sight[] = [];
  private subscriptions = new Subscription();

  constructor(
    private readonly userDataService: UserDataService,
    private readonly router: Router,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController,
    private readonly store: Store,
    private readonly sightsService: SightsService
  ) {}

  ngOnInit() {
    this.loadPlans();
    this.loadSightsData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadSightsData() {
    // ストアの状態を確認し、必要に応じてデータをフェッチしてから、データを取得
    const loadSubscription = this.store.select(selectSightsFeature).pipe(
      take(1),
      switchMap(sightState => {
        const needsSights = !sightState?.sights || sightState.sights.length === 0;

        // データがない場合のみfetchを実行
        if (needsSights) {
          return this.sightsService.fetchSights(false).pipe(
            catchError(error => {
              console.error('観光地データの読み込みに失敗しました:', error);
              return EMPTY;
            }),
            switchMap(() => this.store.select(selectSightsFeature).pipe(take(1)))
          );
        }

        // 既にデータがある場合はそのまま返す
        return of(sightState);
      }),
      // データが揃うまで待つ
      filter(sightState => 
        sightState?.sights && sightState.sights.length > 0
      ),
      take(1)
    ).subscribe({
      next: (sightState) => {
        this.allSights = sightState.sights as Sight[];
      },
      error: (error) => {
        console.error('データの読み込みに失敗しました:', error);
      }
    });

    this.subscriptions.add(loadSubscription);
  }

  ionViewWillEnter() {
    this.loadPlans();
  }

  loadPlans() {
    this.plans = this.userDataService.getPlans();
  }

  async createPlan() {
    const alert = await this.alertController.create({
      header: '新しいプラン',
      message: 'プラン名を入力してください',
      inputs: [
        {
          name: 'planName',
          type: 'text',
          placeholder: '例: 週末の京都散策'
        }
      ],
      buttons: [
        {
          text: 'キャンセル',
          role: 'cancel'
        },
        {
          text: '作成',
          handler: (data) => {
            if (data.planName && data.planName.trim()) {
              const plan = this.userDataService.createPlan(data.planName.trim());
              this.loadPlans();
              this.router.navigate(['/tabs/plans', plan.id]);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async deletePlan(plan: Plan, event: Event) {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'プランを削除',
      message: `「${plan.name}」を削除しますか？`,
      buttons: [
        {
          text: 'キャンセル',
          role: 'cancel'
        },
        {
          text: '削除',
          role: 'destructive',
          handler: () => {
            this.userDataService.deletePlan(plan.id);
            this.loadPlans();
          }
        }
      ]
    });

    await alert.present();
  }

  viewPlan(plan: Plan) {
    this.router.navigate(['/tabs/plans', plan.id]);
  }

  doRefresh(event: any) {
    this.loadPlans();
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  }

  async createRandomPlan() {
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
    const count = Math.min(5, sightsPool.length);

    // ランダムに指定数を選択
    const selectedSights = this.getRandomItems(sightsPool, count);

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
            this.loadPlans();
            this.router.navigate(['/tabs/plans', plan.id]);
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
