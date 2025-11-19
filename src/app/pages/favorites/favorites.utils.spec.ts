import { mapFavoritesToFavoriteItems } from './favorites.utils';
import { Favorite } from '../../shared/services/user-data.service';
import { Souvenir } from '../souvenir/souvenir.service';
import { Sight } from '../sights/sights.service';

describe('favorites.utils', () => {
  describe('mapFavoritesToFavoriteItems', () => {
    // テストデータの準備
    const mockSouvenirs: Souvenir[] = [
      {
        id: 'souvenir-1',
        name: '京扇子',
        name_kana: 'きょうせんす',
        description: '京都伝統の扇子です'
      },
      {
        id: 'souvenir-2',
        name: '生八つ橋',
        name_kana: 'なまやつはし',
        description: '京都名物の和菓子です'
      }
    ];

    const mockSights: Sight[] = [
      {
        id: 'sight-1',
        name: '清水寺',
        name_kana: 'きよみずでら',
        alt_name: '',
        alt_name_kana: '',
        description: '京都の有名な寺院です',
        postal_code: '605-0862',
        address: '京都市東山区清水1-294',
        tel: '075-551-1234',
        fax: '',
        accessibility: '可',
        opening_time: '06:00',
        closing_time: '18:00',
        duration: '60分',
        holiday: '無休',
        business_hours: '6:00-18:00',
        price: '400円',
        notes: '',
        photo: ''
      },
      {
        id: 'sight-2',
        name: '金閣寺',
        name_kana: 'きんかくじ',
        alt_name: '',
        alt_name_kana: '',
        description: '京都の有名な寺院です',
        postal_code: '603-8361',
        address: '京都市北区金閣寺町1',
        tel: '075-461-0013',
        fax: '',
        accessibility: '可',
        opening_time: '09:00',
        closing_time: '17:00',
        duration: '40分',
        holiday: '無休',
        business_hours: '9:00-17:00',
        price: '400円',
        notes: '',
        photo: ''
      }
    ];

    it('お土産のお気に入りを正しくマッピングできること', () => {
      const favorites: Favorite[] = [
        {
          itemId: 'souvenir-1',
          itemType: 'souvenir',
          addedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        id: 'souvenir-1',
        name: '京扇子',
        name_kana: 'きょうせんす',
        description: '京都伝統の扇子です',
        type: 'souvenir',
        addedAt: '2024-01-01T00:00:00.000Z'
      });
    });

    it('観光地のお気に入りを正しくマッピングできること', () => {
      const favorites: Favorite[] = [
        {
          itemId: 'sight-1',
          itemType: 'sight',
          addedAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        id: 'sight-1',
        name: '清水寺',
        name_kana: 'きよみずでら',
        description: '京都の有名な寺院です',
        type: 'sight',
        addedAt: '2024-01-02T00:00:00.000Z'
      });
    });

    it('お土産と観光地の両方のお気に入りを正しくマッピングできること', () => {
      const favorites: Favorite[] = [
        {
          itemId: 'souvenir-1',
          itemType: 'souvenir',
          addedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          itemId: 'sight-1',
          itemType: 'sight',
          addedAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result.length).toBe(2);
      expect(result[0].type).toBe('souvenir');
      expect(result[0].id).toBe('souvenir-1');
      expect(result[1].type).toBe('sight');
      expect(result[1].id).toBe('sight-1');
    });

    it('存在しないIDのお気に入りは除外されること', () => {
      const favorites: Favorite[] = [
        {
          itemId: 'souvenir-1',
          itemType: 'souvenir',
          addedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          itemId: 'non-existent-id',
          itemType: 'souvenir',
          addedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          itemId: 'sight-1',
          itemType: 'sight',
          addedAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result.length).toBe(2);
      expect(result.every(item => item.id !== 'non-existent-id')).toBe(true);
    });

    it('空のお気に入りリストは空配列を返すこと', () => {
      const favorites: Favorite[] = [];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result).toEqual([]);
    });

    it('空のデータ配列でも正しく動作すること', () => {
      const favorites: Favorite[] = [
        {
          itemId: 'souvenir-1',
          itemType: 'souvenir',
          addedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, [], []);

      expect(result).toEqual([]);
    });

    it('複数のお気に入りを正しい順序でマッピングできること', () => {
      const favorites: Favorite[] = [
        {
          itemId: 'souvenir-1',
          itemType: 'souvenir',
          addedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          itemId: 'souvenir-2',
          itemType: 'souvenir',
          addedAt: '2024-01-02T00:00:00.000Z'
        },
        {
          itemId: 'sight-1',
          itemType: 'sight',
          addedAt: '2024-01-03T00:00:00.000Z'
        },
        {
          itemId: 'sight-2',
          itemType: 'sight',
          addedAt: '2024-01-04T00:00:00.000Z'
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result.length).toBe(4);
      expect(result[0].id).toBe('souvenir-1');
      expect(result[1].id).toBe('souvenir-2');
      expect(result[2].id).toBe('sight-1');
      expect(result[3].id).toBe('sight-2');
    });

    it('お気に入りのaddedAtが正しく保持されること', () => {
      const addedAt = '2024-12-25T12:34:56.789Z';
      const favorites: Favorite[] = [
        {
          itemId: 'souvenir-1',
          itemType: 'souvenir',
          addedAt
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result[0].addedAt).toBe(addedAt);
    });

    it('型が正しく設定されること（souvenir）', () => {
      const favorites: Favorite[] = [
        {
          itemId: 'souvenir-1',
          itemType: 'souvenir',
          addedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result[0].type).toBe('souvenir');
      // 型が'souvenir'であることを確認
      expect(result[0].type === 'souvenir').toBe(true);
    });

    it('型が正しく設定されること（sight）', () => {
      const favorites: Favorite[] = [
        {
          itemId: 'sight-1',
          itemType: 'sight',
          addedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result[0].type).toBe('sight');
      // 型が'sight'であることを確認
      expect(result[0].type === 'sight').toBe(true);
    });

    it('同じIDのお気に入りが複数ある場合、すべてマッピングされること', () => {
      const favorites: Favorite[] = [
        {
          itemId: 'souvenir-1',
          itemType: 'souvenir',
          addedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          itemId: 'souvenir-1',
          itemType: 'souvenir',
          addedAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      const result = mapFavoritesToFavoriteItems(favorites, mockSouvenirs, mockSights);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('souvenir-1');
      expect(result[1].id).toBe('souvenir-1');
      expect(result[0].addedAt).not.toBe(result[1].addedAt);
    });
  });
});

