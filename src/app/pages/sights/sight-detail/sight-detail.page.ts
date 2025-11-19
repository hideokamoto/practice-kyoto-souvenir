import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { createSelector, Store } from '@ngrx/store';
import { Sight, SightsService } from '../sights.service';
import { selectSightsFeature } from '../store';
import { UserDataService } from '../../../shared/services/user-data.service';
import { switchMap, tap, take, filter } from 'rxjs/operators';

@Component({
    selector: 'app-sight-detail',
    templateUrl: './sight-detail.page.html',
    styleUrls: ['./sight-detail.page.scss'],
    standalone: false
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

}
