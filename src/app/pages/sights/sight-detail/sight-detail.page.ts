import { Component, OnInit, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { createSelector, Store } from '@ngrx/store';
import { AlertController, ToastController } from '@ionic/angular';
import { Sight, SightsService } from '../sights.service';
import { selectSightsFeature } from '../store';
import { UserDataService, Plan } from '../../../shared/services/user-data.service';
import { switchMap, tap, take, filter, map } from 'rxjs/operators';

@Component({
    selector: 'app-sight-detail',
    templateUrl: './sight-detail.page.html',
    styleUrls: ['./sight-detail.page.scss'],
    standalone: false
})
export class SightDetailPage implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly service = inject(SightsService);
  private readonly title = inject(Title);
  private readonly userDataService = inject(UserDataService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  public sight: Sight | null;
  public isFavorite = false;
  public isVisited = false;
  public previousSightId: string | null = null;

  public ngOnInit() {
    this.checkPreviousSight();
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    
    if (!id) {
      return;
    }

    // ストアの状態を確認し、必要に応じてデータをフェッチしてから、sightを読み込む
    this.store.select(selectSightsFeature).pipe(
      take(1),
      switchMap(sightState => {
        const hasData = sightState?.sights?.length > 0;
        
        if (!hasData) {
          // ストアにデータがない場合のみフェッチ
          return this.service.fetchSights(false).pipe(
            switchMap(() => this.loadSight(id))
          );
        } else {
          // ストアにデータがある場合は直接読み込む
          return this.loadSight(id);
        }
      }),
      filter((sight): sight is Sight => sight !== null && sight !== undefined),
      tap(sight => {
        this.sight = sight;
        this.updateUserDataStatus();
        if (sight?.name) {
          this.title.setTitle(sight.name);
        }
      })
    ).subscribe();
  }


  public toggleFavorite(): void {
    if (this.sight) {
      this.isFavorite = this.userDataService.toggleFavorite(this.sight.id, 'sight');
    }
  }

  public toggleVisited(): void {
    if (this.sight) {
      this.isVisited = this.userDataService.toggleVisit(this.sight.id, 'sight');
    }
  }

  private updateUserDataStatus(): void {
    if (this.sight) {
      this.isFavorite = this.userDataService.isFavorite(this.sight.id, 'sight');
      this.isVisited = this.userDataService.isVisited(this.sight.id, 'sight');
    }
  }


  public getBackButtonText() {
    const win = window as Window & { Ionic?: { mode?: string } };
    const mode = win?.Ionic?.mode;
    return mode === 'ios' ? '戻る' : '';
  }

  private loadSight(id: string) {
    return this.store.select(
      createSelector(selectSightsFeature, state => 
        state?.sights?.find(item => item.id === id) ?? null
      )
    );
  }

  /**
   * 時間文字列をフォーマットする（例：830 → 8:30）
   */
  public formatTime(timeStr: string): string {
    if (!timeStr || timeStr.trim() === '') {
      return '';
    }
    const trimmed = timeStr.trim();
    if (trimmed.length === 4) {
      const hours = trimmed.substring(0, 2);
      const minutes = trimmed.substring(2, 4);
      return `${parseInt(hours, 10)}:${minutes}`;
    }
    return trimmed;
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
   * 写真のパスを取得する
   */
  public getPhotoPath(photo: string): string | null {
    if (!photo || photo.trim() === '') {
      return null;
    }
    // 写真パスが相対パスの場合、assetsディレクトリからのパスとして扱う
    return `/assets/${photo}`;
  }

  /**
   * 文字列が空でないかチェック
   */
  private hasValue(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim() !== '';
  }

  /**
   * アクセス情報があるかチェック
   */
  public hasAccessInfo(): boolean {
    if (!this.sight) return false;
    return this.hasValue(this.sight.postal_code) || 
           this.hasValue(this.sight.address) || 
           this.hasValue(this.sight.tel) || 
           this.hasValue(this.sight.fax);
  }

  /**
   * 営業情報があるかチェック
   */
  public hasBusinessInfo(): boolean {
    if (!this.sight) return false;
    return this.hasValue(this.sight.business_hours) || 
           this.hasValue(this.sight.opening_time) || 
           this.hasValue(this.sight.closing_time) || 
           this.hasValue(this.sight.duration) || 
           this.hasValue(this.sight.holiday);
  }

  /**
   * 料金情報があるかチェック
   */
  public hasPriceInfo(): boolean {
    if (!this.sight) return false;
    return this.hasValue(this.sight.price);
  }

  /**
   * アクセシビリティ情報があるかチェック
   */
  public hasAccessibilityInfo(): boolean {
    if (!this.sight) return false;
    return this.hasValue(this.sight.accessibility);
  }

  /**
   * 備考があるかチェック
   */
  public hasNotes(): boolean {
    if (!this.sight) return false;
    return this.hasValue(this.sight.notes);
  }

  /**
   * プランに追加する
   */
  public async addToPlan(): Promise<void> {
    if (!this.sight) return;

    const plans = this.userDataService.getPlans();

    // 既存のプランがある場合、選択肢を提示
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
              this.createNewPlanWithSight();
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
      // プランがない場合は新規作成
      this.createNewPlanWithSight();
    }
  }

  /**
   * 既存のプランを選択して追加
   */
  private async selectExistingPlan(plans: Plan[]): Promise<void> {
    if (!this.sight) return;

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
              const isAlreadyInPlan = this.userDataService.isItemInPlan(planId, this.sight!.id, 'sight');
              if (isAlreadyInPlan) {
                this.showToast('この場所は既にプランに追加されています', 'warning');
              } else {
                this.userDataService.addItemToPlan(planId, this.sight!.id, 'sight');
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

  /**
   * 新しいプランを作成して追加
   */
  private async createNewPlanWithSight(): Promise<void> {
    if (!this.sight) return;

    const alert = await this.alertController.create({
      header: '新しいプラン',
      message: 'プラン名を入力してください',
      inputs: [
        {
          name: 'planName',
          type: 'text',
          placeholder: `例: ${this.sight.name}に行くプラン`,
          value: `${this.sight.name}に行くプラン`
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
              this.userDataService.addItemToPlan(plan.id, this.sight!.id, 'sight');
              this.showToast('プランを作成しました', 'success');
              this.router.navigate(['/tabs/plans', plan.id]);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * トーストメッセージを表示
   */
  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }

  /**
   * 前の観光地のIDをチェック
   */
  private checkPreviousSight(): void {
    if (typeof document === 'undefined') return;
    
    const referrer = document.referrer;
    if (!referrer) return;
    
    // 前のページが観光地の詳細ページかチェック
    const sightsUrlPattern = /\/sights\/([^\/\?]+)/;
    const match = referrer.match(sightsUrlPattern);
    
    if (match && match[1]) {
      const previousId = match[1];
      // 現在の観光地と同じでないことを確認
      const currentId = this.activatedRoute.snapshot.paramMap.get('id');
      if (previousId !== currentId) {
        this.previousSightId = previousId;
      }
    }
  }

  /**
   * 前の観光地に遷移
   */
  public goToPreviousSight(): void {
    if (this.previousSightId) {
      this.router.navigate(['/sights', this.previousSightId]);
    }
  }

  /**
   * ランダムに次の観光地に遷移
   */
  public goToNextSight(): void {
    if (!this.sight) return;

    // ストアから全観光地を取得
    this.store.select(selectSightsFeature).pipe(
      take(1),
      switchMap(sightState => {
        const hasData = sightState?.sights?.length > 0;
        
        if (!hasData) {
          // ストアにデータがない場合のみフェッチ
          return this.service.fetchSights(false).pipe(
            switchMap(() => this.store.select(selectSightsFeature).pipe(take(1)))
          );
        } else {
          // ストアにデータがある場合は直接返す
          return this.store.select(selectSightsFeature).pipe(take(1));
        }
      }),
      map(sightState => {
        const allSights = sightState?.sights || [];
        // 現在の観光地を除外
        const otherSights = allSights.filter(s => s.id !== this.sight!.id);
        
        if (otherSights.length === 0) {
          return null;
        }
        
        // ランダムに選択
        const randomIndex = Math.floor(Math.random() * otherSights.length);
        return otherSights[randomIndex];
      }),
      take(1)
    ).subscribe({
      next: (nextSight) => {
        if (nextSight) {
          this.router.navigate(['/sights', nextSight.id]);
        } else {
          this.showToast('他の観光地が見つかりませんでした', 'warning');
        }
      },
      error: (error) => {
        console.error('次の観光地の取得に失敗しました:', error);
        this.showToast('エラーが発生しました', 'danger');
      }
    });
  }

}
