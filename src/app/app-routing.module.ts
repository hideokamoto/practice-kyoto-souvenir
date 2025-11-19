import { Injectable, NgModule, inject } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);

  constructor() {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot) {
    const title = this.buildTitle(snapshot);
    this.titleService.setTitle(title ? `${title} | きょう再見` : 'きょう再見');
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
  },
  {
    path: 'about',
    loadChildren: () => import('./pages/about/about.module').then( m => m.AboutPageModule)
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
