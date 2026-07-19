import { Component, OnInit, inject} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { createSelector, Store } from '@ngrx/store';
import { AlertController, ToastController } from '@ionic/angular';
import { Souvenir, SouvenirService } from '../souvenir.service';
import { selectSouvenirFeature } from '../store';
import { UserDataService, Plan } from '../../../shared/services/user-data.service';
import { switchMap, take, filter, tap, map } from 'rxjs/operators';

@Component({
    selector: 'app-souvenir-detail',
    templateUrl: './souvenir-detail.page.html',
    styleUrls: ['./souvenir-detail.page.scss'],
    standalone: false
})
export class SouvenirDetailPage implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly souvenirService = inject(SouvenirService);
  private readonly title = inject(Title);
  private readonly userDataService = inject(UserDataService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  public souvenir: Souvenir | null;
  public isFavorite = false;
  public isVisited = false;

  public ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    // ストアの状態を確認し、必要に応じてデータをフェッチしてから、souvenirを読み込む
    this.store.select(selectSouvenirFeature).pipe(
      take(1),
      switchMap(souvenirState => {
        const hasData = souvenirState?.souvenirs?.length > 0;

        if (!hasData) {
          // ストアにデータがない場合のみフェッチ
          return this.souvenirService.fetchSouvenirs(false).pipe(
            switchMap(() => this.loadSouvenir(id))
          );
        } else {
          // ストアにデータがある場合は直接読み込む
          return this.loadSouvenir(id);
        }
      }),
      filter((souvenir): souvenir is Souvenir => souvenir !== null && souvenir !== undefined),
      tap(souvenir => {
        this.souvenir = souvenir;
        this.updateUserDataStatus();
        if (souvenir?.name) {
          this.title.setTitle(souvenir.name);
        }
      })
    ).subscribe();
  }

  public toggleFavorite(): void {
    if (this.souvenir) {
      this.isFavorite = this.userDataService.toggleFavorite(this.souvenir.id, 'souvenir');
    }
  }

  public toggleVisited(): void {
    if (this.souvenir) {
      this.isVisited = this.userDataService.toggleVisit(this.souvenir.id, 'souvenir');
    }
  }

  private updateUserDataStatus(): void {
    if (this.souvenir) {
      this.isFavorite = this.userDataService.isFavorite(this.souvenir.id, 'souvenir');
      this.isVisited = this.userDataService.isVisited(this.souvenir.id, 'souvenir');
    }
  }

  public getBackButtonText() {
    const win = window as Window & { Ionic?: { mode?: string } };
    const mode = win?.Ionic?.mode;
    return mode === 'ios' ? '戻る' : '';
  }

  private loadSouvenir(id: string) {
    return this.store.select(
      createSelector(selectSouvenirFeature, state =>
        state?.souvenirs?.find(item => item.id === id) ?? null
      )
    );
  }

  /**
   * 改行文字を適切に処理する（\\nを実際の改行に変換）
   */
  public formatText(text: string): string {
    if (!text) {
      return '';
    }
    return text.replace(/\\n/g, '\n');
  }

  /**
   * プランに追加する（sight-detail と同一の導線）
   */
  public async addToPlan(): Promise<void> {
    if (!this.souvenir) return;

    const plans = this.userDataService.getPlans();

    if (plans.length > 0) {
      const alert = await this.alertController.create({
        header: 'プランに追加',
        message: '既存のプランに追加するか、新しいプランを作成しますか？',
        buttons: [
          {
            text: '既存のプランに追加',
            handler: () => {
              this.selectExistingPlan(plans);
            }
          },
          {
            text: '新しいプランを作成',
            handler: () => {
              this.createNewPlanWithSouvenir();
            }
          },
          {
            text: 'キャンセル',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
    } else {
      this.createNewPlanWithSouvenir();
    }
  }

  private async selectExistingPlan(plans: Plan[]): Promise<void> {
    if (!this.souvenir) return;

    const alert = await this.alertController.create({
      header: 'プランを選択',
      inputs: plans.map(plan => ({
        type: 'radio' as const,
        label: plan.name,
        value: plan.id
      })),
      buttons: [
        {
          text: 'キャンセル',
          role: 'cancel'
        },
        {
          text: '追加',
          handler: (planId: string) => {
            if (planId) {
              const isAlreadyInPlan = this.userDataService.isItemInPlan(planId, this.souvenir!.id, 'souvenir');
              if (isAlreadyInPlan) {
                this.showToast('このお土産は既にプランに追加されています', 'warning');
              } else {
                this.userDataService.addItemToPlan(planId, this.souvenir!.id, 'souvenir');
                this.showToast('プランに追加しました', 'success');
                this.router.navigate(['/tabs/plans', planId]);
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async createNewPlanWithSouvenir(): Promise<void> {
    if (!this.souvenir) return;

    const alert = await this.alertController.create({
      header: '新しいプラン',
      message: 'プラン名を入力してください',
      inputs: [
        {
          name: 'planName',
          type: 'text',
          placeholder: `例: ${this.souvenir.name}を買うプラン`,
          value: `${this.souvenir.name}を買うプラン`
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
              this.userDataService.addItemToPlan(plan.id, this.souvenir!.id, 'souvenir');
              this.showToast('プランを作成しました', 'success');
              this.router.navigate(['/tabs/plans', plan.id]);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }

  /**
   * ランダムに別のお土産へ遷移する
   */
  public goToNextSouvenir(): void {
    if (!this.souvenir) return;

    this.store.select(selectSouvenirFeature).pipe(
      take(1),
      switchMap(souvenirState => {
        const hasData = souvenirState?.souvenirs?.length > 0;
        if (!hasData) {
          return this.souvenirService.fetchSouvenirs(false).pipe(
            switchMap(() => this.store.select(selectSouvenirFeature).pipe(take(1)))
          );
        }
        return this.store.select(selectSouvenirFeature).pipe(take(1));
      }),
      map(souvenirState => {
        const all = souvenirState?.souvenirs || [];
        const others = all.filter(s => s.id !== this.souvenir!.id);
        if (others.length === 0) {
          return null;
        }
        const randomIndex = Math.floor(Math.random() * others.length);
        return others[randomIndex];
      }),
      take(1)
    ).subscribe({
      next: (next) => {
        if (next) {
          this.router.navigate(['/souvenir', next.id]);
        } else {
          this.showToast('他のお土産が見つかりませんでした', 'warning');
        }
      },
      error: (error) => {
        console.error('次のお土産の取得に失敗しました:', error);
        this.showToast('エラーが発生しました', 'danger');
      }
    });
  }

}
