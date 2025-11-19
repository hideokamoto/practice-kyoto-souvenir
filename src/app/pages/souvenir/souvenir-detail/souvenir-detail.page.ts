import { Component, OnInit} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { createSelector, Store } from '@ngrx/store';
import { Souvenir, SouvenirService } from '../souvenir.service';
import { selectSouvenirFeature } from '../store';
import { UserDataService } from '../../../shared/services/user-data.service';
import { switchMap, tap, take, filter } from 'rxjs/operators';

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
    
    if (!id) {
      return;
    }

    // ストアの状態を確認し、必要に応じてデータをフェッチしてから、souvenirを読み込む
    this.store.select(selectSouvenirFeature).pipe(
      take(1),
      switchMap(souvenirState => {
        const hasData = souvenirState?.souvenires?.length > 0;
        
        if (!hasData) {
          // ストアにデータがない場合のみフェッチ
          return this.souvenirService.fetchSouvenires(false).pipe(
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
        this.title.setTitle(souvenir.name);
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
    const win = window as any;
    const mode = win && win.Ionic && win.Ionic.mode;
    return mode === 'ios' ? '戻る' : '';
  }

  private loadSouvenir(id: string) {
    return this.store.select(
      createSelector(selectSouvenirFeature, state => 
        state?.souvenires?.find(item => item.id === id) ?? null
      )
    );
  }

}
