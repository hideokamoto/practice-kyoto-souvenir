import { Favorite } from '../../shared/services/user-data.service';
import { Souvenir } from '../souvenir/souvenir.service';
import { Sight } from '../sights/sights.service';

export interface FavoriteItem {
  id: string;
  name: string;
  name_kana: string;
  description: string;
  type: 'sight' | 'souvenir';
  addedAt: string;
}

/**
 * お気に入りリストと、お土産・観光地のデータを組み合わせてFavoriteItem[]を作成する純粋関数
 * 
 * この関数は以下の問題を防ぐために重要：
 * - ネストしたサブスクリプションによるデータの不整合
 * - データが揃う前に処理が実行される問題
 * 
 * @param favorites - お気に入りリスト
 * @param souvenirs - お土産データの配列
 * @param sights - 観光地データの配列
 * @returns マッピングされたFavoriteItem[]の配列
 */
export function mapFavoritesToFavoriteItems(
  favorites: Favorite[],
  souvenirs: Souvenir[],
  sights: Sight[]
): FavoriteItem[] {
  return favorites
    .map(fav => {
      if (fav.itemType === 'souvenir') {
        const item = souvenirs.find(s => s.id === fav.itemId);
        if (item) {
          return {
            id: item.id,
            name: item.name,
            name_kana: item.name_kana,
            description: item.description,
            type: 'souvenir' as const,
            addedAt: fav.addedAt
          };
        }
      } else {
        const item = sights.find(s => s.id === fav.itemId);
        if (item) {
          return {
            id: item.id,
            name: item.name,
            name_kana: item.name_kana,
            description: item.description,
            type: 'sight' as const,
            addedAt: fav.addedAt
          };
        }
      }
      return null;
    })
    .filter((item): item is FavoriteItem => item !== null);
}

