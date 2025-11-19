import { Injectable, NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  constructor(private titleService: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot) {
    const title = this.buildTitle(snapshot);
    this.titleService.setTitle(title ? `${title} | 京都再発見` : '京都再発見');
  }
}

const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.module').then( m => m.TabsPageModule)
  },
  {
    path: 'sights/:id',
    loadChildren: () => import('./pages/sights/sight-detail/sight-detail.module').then( m => m.SightDetailPageModule)
  },
  {
    path: 'souvenir/:id',
    loadChildren: () => import('./pages/souvenir/souvenir-detail/souvenir-detail.module').then( m => m.SouvenirDetailPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule],
  providers: [{ provide: TitleStrategy, useClass: AppTitleStrategy }]
})
export class AppRoutingModule { }
