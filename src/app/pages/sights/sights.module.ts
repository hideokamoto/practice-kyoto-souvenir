import { NgModule } from '@angular/core';
import { SightsComponentsModule } from './sights-components.module';

/**
 * @deprecated このモジュールは後方互換性のために残されています。
 * 新しいコードでは SightsComponentsModule を直接使用してください。
 */
@NgModule({
  imports: [SightsComponentsModule],
  exports: [SightsComponentsModule]
})
export class SightsPageModule {}
