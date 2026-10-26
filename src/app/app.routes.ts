import { Routes } from '@angular/router';
import { APP_NAME } from './app-info';
import { CreditsPage } from './pages/credits';
import { HomePage } from './pages/home';
import { LicensesPage } from './pages/licenses';
import { QuizPage } from './pages/quiz';
import { ResultPage } from './pages/result';

const title = (t: string) => `${t} | ${APP_NAME}`;

export const routes: Routes = [
  { path: '', component: HomePage, title: APP_NAME },
  { path: 'quiz', component: QuizPage, title: title('出題中') },
  { path: 'result', component: ResultPage, title: title('結果') },
  { path: 'credits', component: CreditsPage, title: title('クレジット') },
  { path: 'licenses', component: LicensesPage, title: title('ライセンス') },
  { path: '**', redirectTo: '' },
];
