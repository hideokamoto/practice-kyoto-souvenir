import { Component, OnInit} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { createSelector, Store } from '@ngrx/store';
import { Souvenir, SouvenirService } from '../souvenir.service';
import { selectSouvenirFeature } from '../store';
import { UserDataService } from '../../../shared/services/user-data.service';
import { take } from 'rxjs/operators';

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
    
    // まずストアにデータが存在するか確認
    this.store.select(selectSouvenirFeature).pipe(take(1)).subscribe(souvenirState => {
      const hasData = souvenirState && souvenirState.souvenires && souvenirState.souvenires.length > 0;
      
      if (!hasData) {
        // ストアにデータがない場合のみフェッチ
        this.souvenirService.fetchSouvenires(false)
          .subscribe(() => {
            this.loadSouvenirData(id);
          });
      } else {
        // ストアにデータがある場合は直接読み込む
        this.loadSouvenirData(id);
      }
    });
  }

  private loadSouvenirData(id: string) {
    this.loadSouvenir(id)
      .pipe(take(1))
      .subscribe(result => {
        if (result) {
          this.souvenir = result;
          this.updateUserDataStatus();
          this.title.setTitle(this.souvenir.name);
        }
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
