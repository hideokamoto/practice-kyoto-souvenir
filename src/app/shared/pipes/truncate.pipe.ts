import { Pipe, PipeTransform } from '@angular/core';

/**
 * 文字列を指定された長さに切り詰める関数
 * @param value 切り詰める文字列
 * @param limit 最大文字数（デフォルト: 80）
 * @returns 切り詰められた文字列
 */
export function truncateText(value: string | null | undefined, limit: number = 80): string {
  if (!value) {
    return '';
  }
  
  if (value.length <= limit) {
    return value;
  }
  
  return value.substring(0, limit) + '...';
}

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit: number = 80): string {
    return truncateText(value, limit);
  }
}
