import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { UserDataService, Plan, PlanItem } from '../../../shared/services/user-data.service';
import { selectSouvenirFeature } from '../../souvenir/store';
import { selectSightsFeature } from '../../sights/store';
import { Souvenir } from '../../souvenir/souvenir.service';
import { Sight } from '../../sights/sights.service';
import { Subscription, combineLatest } from 'rxjs';
import { filter, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface PlanItemWithDetails extends PlanItem {
  name: string;
  name_kana: string;
  description: string;
}

@Component({
  selector: 'app-plan-detail',
  templateUrl: './plan-detail.page.html',
  styleUrls: ['./plan-detail.page.scss'],
})
export class PlanDetailPage implements OnInit, OnDestroy {
  public plan: Plan | null = null;
  public planItems: PlanItemWithDetails[] = [];
  public loading = true;

  private subscriptions = new Subscription();
  private loadPlanSubscription?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userDataService: UserDataService,
    private readonly alertController: AlertController,
    private readonly actionSheetController: ActionSheetController,
    private readonly store: Store
  ) {}

  ngOnInit() {
    const planId = this.route.snapshot.paramMap.get('id');
    if (planId) {
      this.loadPlan(planId);
    }
  }

  ionViewWillEnter() {
    const planId = this.route.snapshot.paramMap.get('id');
    if (planId) {
      this.loadPlan(planId);
    }
  }

  loadPlan(planId: string) {
    // 既存のサブスクリプションをクリーンアップ
    if (this.loadPlanSubscription) {
      this.loadPlanSubscription.unsubscribe();
    }

    this.loading = true;
    this.plan = this.userDataService.getPlan(planId);

    if (!this.plan) {
      this.router.navigate(['/tabs/plans']);
      this.loading = false;
      return;
    }

    // 両方のストアからデータを取得（データが揃ってから処理）
    this.loadPlanSubscription = combineLatest([
      this.store.select(selectSouvenirFeature).pipe(
        filter(state => state !== null && state.souvenires !== null && state.souvenires !== undefined && Array.isArray(state.souvenires)),
        take(1)
      ),
      this.store.select(selectSightsFeature).pipe(
        filter(state => state !== null && state.sights !== null && state.sights !== undefined && Array.isArray(state.sights)),
        take(1)
      )
    ]).pipe(
      catchError(error => {
        console.error('Error loading plan data:', error);
        this.loading = false;
        return of([null, null]);
      })
    ).subscribe(([souvenirState, sightState]) => {
      if (!souvenirState || !sightState) {
        this.loading = false;
        return;
      }

      const souvenirs = souvenirState.souvenires as Souvenir[];
      const sights = sightState.sights as Sight[];

      if (this.plan) {
        // パフォーマンス向上のため、Mapオブジェクトを作成
        const souvenirMap = new Map<string, Souvenir>();
        souvenirs.forEach(souvenir => {
          souvenirMap.set(souvenir.id, souvenir);
        });

        const sightMap = new Map<string, Sight>();
        sights.forEach(sight => {
          sightMap.set(sight.id, sight);
        });

        this.planItems = this.plan.items
          .sort((a, b) => a.order - b.order)
          .map(item => {
            if (item.itemType === 'souvenir') {
              const souvenir = souvenirMap.get(item.itemId);
              if (souvenir) {
                return {
                  ...item,
                  name: souvenir.name,
                  name_kana: souvenir.name_kana,
                  description: souvenir.description
                };
              }
            } else {
              const sight = sightMap.get(item.itemId);
              if (sight) {
                return {
                  ...item,
                  name: sight.name,
                  name_kana: sight.name_kana,
                  description: sight.description
                };
              }
            }
            return null;
          })
          .filter((item): item is PlanItemWithDetails => item !== null);
      }

      this.loading = false;
    });
  }

  async renamePlan() {
    if (!this.plan) return;

    const alert = await this.alertController.create({
      header: 'プラン名を変更',
      inputs: [
        {
          name: 'planName',
          type: 'text',
          value: this.plan.name,
          placeholder: 'プラン名'
        }
      ],
      buttons: [
        {
          text: 'キャンセル',
          role: 'cancel'
        },
        {
          text: '変更',
          handler: (data) => {
            if (data.planName && data.planName.trim() && this.plan) {
              this.userDataService.updatePlan(this.plan.id, { name: data.planName.trim() });
              this.loadPlan(this.plan.id);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async addItem() {
    const actionSheet = await this.actionSheetController.create({
      header: 'アイテムを追加',
      buttons: [
        {
          text: 'お気に入りから選択',
          handler: () => {
            this.showFavoritesList();
          }
        },
        {
          text: 'キャンセル',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async showFavoritesList() {
    if (!this.plan) return;

    const favorites = this.userDataService.getFavorites();

    if (favorites.length === 0) {
      const alert = await this.alertController.create({
        header: 'お気に入りがありません',
        message: 'まずは観光地やお土産をお気に入りに追加してください',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // 両方のストアからデータを取得（データが揃ってから処理）
    const favoriteSubscription = combineLatest([
      this.store.select(selectSouvenirFeature).pipe(
        filter(state => state !== null && state.souvenires !== null && state.souvenires !== undefined && Array.isArray(state.souvenires))
      ),
      this.store.select(selectSightsFeature).pipe(
        filter(state => state !== null && state.sights !== null && state.sights !== undefined && Array.isArray(state.sights))
      )
    ]).subscribe(async ([souvenirState, sightState]) => {
      const souvenirs = souvenirState.souvenires as Souvenir[];
      const sights = sightState.sights as Sight[];

      // パフォーマンス向上のため、Mapオブジェクトを作成
      const souvenirMap = new Map<string, Souvenir>();
      souvenirs.forEach(souvenir => {
        souvenirMap.set(souvenir.id, souvenir);
      });

      const sightMap = new Map<string, Sight>();
      sights.forEach(sight => {
        sightMap.set(sight.id, sight);
      });

      const favoriteItems = favorites
        .map(fav => {
          if (fav.itemType === 'souvenir') {
            const item = souvenirMap.get(fav.itemId);
            if (item) return { ...fav, name: item.name };
          } else {
            const item = sightMap.get(fav.itemId);
            if (item) return { ...fav, name: item.name };
          }
          return null;
        })
        .filter(item => item !== null);

      const alert = await this.alertController.create({
        header: 'お気に入りから選択',
        inputs: favoriteItems.map(item => ({
          type: 'checkbox' as const,
          label: item!.name,
          value: item,
          checked: this.userDataService.isItemInPlan(this.plan!.id, item!.itemId, item!.itemType)
        })),
        buttons: [
          {
            text: 'キャンセル',
            role: 'cancel'
          },
          {
            text: '追加',
            handler: (selected) => {
              if (selected && selected.length > 0 && this.plan) {
                selected.forEach((item: any) => {
                  this.userDataService.addItemToPlan(this.plan!.id, item.itemId, item.itemType);
                });
                this.loadPlan(this.plan.id);
              }
            }
          }
        ]
      });

      await alert.present();
    });

    this.subscriptions.add(favoriteSubscription);
  }

  removeItem(item: PlanItemWithDetails) {
    if (this.plan) {
      this.userDataService.removeItemFromPlan(this.plan.id, item.itemId, item.itemType);
      this.loadPlan(this.plan.id);
    }
  }

  getRouterLink(item: PlanItemWithDetails): string {
    return item.itemType === 'sight' ? `/sights/${item.itemId}` : `/souvenir/${item.itemId}`;
  }

  doReorder(event: any) {
    if (!this.plan) return;

    const itemToMove = this.planItems[event.detail.from];
    this.planItems.splice(event.detail.from, 1);
    this.planItems.splice(event.detail.to, 0, itemToMove);

    // 順序を更新
    const reorderedItems = this.planItems.map((item, index) => ({
      itemId: item.itemId,
      itemType: item.itemType,
      order: index
    }));

    this.userDataService.reorderPlanItems(this.plan.id, reorderedItems);
    event.detail.complete();
  }

  doRefresh(event: any) {
    if (this.plan) {
      this.loadPlan(this.plan.id);
    }
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  ngOnDestroy() {
    if (this.loadPlanSubscription) {
      this.loadPlanSubscription.unsubscribe();
    }
    this.subscriptions.unsubscribe();
  }
}
