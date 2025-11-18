import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { UserDataService, Plan } from '../../shared/services/user-data.service';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.page.html',
  styleUrls: ['./plans.page.scss'],
})
export class PlansPage implements OnInit {
  public plans: Plan[] = [];

  constructor(
    private readonly userDataService: UserDataService,
    private readonly router: Router,
    private readonly alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadPlans();
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
              this.router.navigate(['/plans', plan.id]);
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
    this.router.navigate(['/plans', plan.id]);
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
}
