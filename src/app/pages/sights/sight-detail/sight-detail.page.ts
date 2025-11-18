import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { createSelector, Store } from '@ngrx/store';
import { Sight, SightsService } from '../sights.service';
import { selectSightsFeature } from '../store';
import { UserDataService } from '../../../shared/services/user-data.service';

@Component({
  selector: 'app-sight-detail',
  templateUrl: './sight-detail.page.html',
  styleUrls: ['./sight-detail.page.scss'],
})
export class SightDetailPage implements OnInit {
  public sight: Sight | null;
  public isFavorite = false;
  public isVisited = false;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly store: Store,
    private readonly service: SightsService,
    private readonly title: Title,
    private readonly userDataService: UserDataService
  ) { }
  public ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.loadSouvenir(id)
      .subscribe(result => {
        if (result) {
          this.sight = result;
          this.updateUserDataStatus();
        } else {
          this.service.fetchSights()
            .subscribe(() => {
              this.loadSouvenir(id).subscribe(item => {
                this.sight = item;
                this.updateUserDataStatus();
              });
            });
        }
        this.title.setTitle(this.sight.name);
      });
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
    const win = window as any;
    const mode = win && win.Ionic && win.Ionic.mode;
    return mode === 'ios' ? '戻る' : '';
  }

  private loadSouvenir(id: string) {
    return this.store.select(createSelector(selectSightsFeature, state => state.sights.find(item => item.id === id)));
  }

}
