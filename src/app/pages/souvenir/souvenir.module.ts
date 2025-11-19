import { NgModule } from '@angular/core';
import { SouvenirComponentsModule } from './souvenir-components.module';

/**
 * @deprecated このモジュールは後方互換性のために残されています。
 * 新しいコードでは SouvenirComponentsModule を直接使用してください。
 */
@NgModule({
  imports: [SouvenirComponentsModule],
  exports: [SouvenirComponentsModule]
})
export class SouvenirPageModule {}
