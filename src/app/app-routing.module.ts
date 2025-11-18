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
    this.titleService.setTitle(title ? `${title} | My App` : 'My App');
  }
}

const routes: Routes = [
  {
    path: '',
    children: [{
        path: 'home',
        title: 'このアプリについて',
        loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule),
      },
      {
        path: 'souvenir',
        loadChildren: () => import('./pages/souvenir/souvenir.module').then( m => m.SouvenirPageModule)
      },{
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'sights',
        loadChildren: () => import('./pages/sights/sights.module').then( m => m.SightsPageModule)
      },
      {
        path: 'favorites',
        title: 'お気に入り',
        loadChildren: () => import('./pages/favorites/favorites.module').then( m => m.FavoritesPageModule)
      },
      {
        path: 'plans',
        title: 'マイプラン',
        loadChildren: () => import('./pages/plans/plans.module').then( m => m.PlansPageModule)
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
