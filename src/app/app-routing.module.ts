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
    children: [{
        path: 'discover',
        title: '発見',
        loadChildren: () => import('./pages/discover/discover.module').then( m => m.DiscoverPageModule),
      },
      {
        path: 'favorites',
        title: 'お気に入り',
        loadChildren: () => import('./pages/favorites/favorites.module').then( m => m.FavoritesPageModule)
      },
      {
        path: 'plans',
        title: 'プラン',
        loadChildren: () => import('./pages/plans/plans.module').then( m => m.PlansPageModule)
      },
      {
        path: 'sights/:id',
        loadChildren: () => import('./pages/sights/sight-detail/sight-detail.module').then( m => m.SightDetailPageModule)
      },
      {
        path: 'souvenir/:id',
        loadChildren: () => import('./pages/souvenir/souvenir-detail/souvenir-detail.module').then( m => m.SouvenirDetailPageModule)
      },
      {
        path: '',
        redirectTo: 'discover',
        pathMatch: 'full',
      }
    ]
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
