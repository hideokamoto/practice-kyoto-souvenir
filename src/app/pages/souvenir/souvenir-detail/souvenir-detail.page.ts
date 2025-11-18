import { Component, OnInit} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { createSelector, Store } from '@ngrx/store';
import { Souvenir, SouvenirService } from '../souvenir.service';
import { selectSouvenirFeature } from '../store';
import { UserDataService } from '../../../shared/services/user-data.service';

@Component({
  selector: 'app-souvenir-detail',
  templateUrl: './souvenir-detail.page.html',
  styleUrls: ['./souvenir-detail.page.scss'],
})
export class SouvenirDetailPage implements OnInit {
  public souvenir: Souvenir | null;
  public isFavorite = false;
  public isVisited = false;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly store: Store,
    private readonly souvenirService: SouvenirService,
    private readonly title: Title,
    private readonly userDataService: UserDataService
  ) { }

  public ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.loadSouvenir(id)
      .subscribe(result => {
        if (result) {
          this.souvenir = result;
          this.updateUserDataStatus();
        } else {
          this.souvenirService.fetchSouvenires()
            .subscribe(() => {
              this.loadSouvenir(id).subscribe(item => {
                this.souvenir = item;
                this.updateUserDataStatus();
              });
            });
        }
        this.title.setTitle(this.souvenir.name);
      });
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
    const win = window as any;
    const mode = win && win.Ionic && win.Ionic.mode;
    return mode === 'ios' ? '戻る' : '';
  }

  private loadSouvenir(id: string) {
    return this.store.select(createSelector(selectSouvenirFeature, state => state.souvenires.find(item => item.id === id)));
  }

}
