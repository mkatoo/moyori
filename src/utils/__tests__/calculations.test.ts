import {
  calculateCentroid,
  calculateDistance,
  findNearestStation,
  Coordinate,
} from '../calculations';
import { Station } from '../../data/stations';

describe('calculations', () => {
  const mockStations: Station[] = [
    {
      name: '東京',
      lat: 35.681236,
      lng: 139.767125,
      prefecture: '東京都',
      line: 'JR東海道本線',
    },
    {
      name: '新宿',
      lat: 35.690921,
      lng: 139.700258,
      prefecture: '東京都',
      line: 'JR山手線',
    },
    {
      name: '渋谷',
      lat: 35.658034,
      lng: 139.701636,
      prefecture: '東京都',
      line: 'JR山手線',
    },
  ];

  describe('calculateCentroid', () => {
    it('空の配列が渡された場合はエラーを投げる', () => {
      expect(() => calculateCentroid([])).toThrow('駅が選択されていません');
    });

    it('単一の駅の場合はその駅の座標を返す', () => {
      const result = calculateCentroid([mockStations[0]]);
      expect(result.lat).toBe(35.681236);
      expect(result.lng).toBe(139.767125);
    });

    it('複数の駅の重心を正しく計算する', () => {
      const result = calculateCentroid(mockStations);

      // 3つの駅の緯度経度の平均を計算
      const expectedLat = (35.681236 + 35.690921 + 35.658034) / 3;
      const expectedLng = (139.767125 + 139.700258 + 139.701636) / 3;

      expect(result.lat).toBeCloseTo(expectedLat, 6);
      expect(result.lng).toBeCloseTo(expectedLng, 6);
    });

    it('2つの駅の重心を正しく計算する', () => {
      const twoStations = [mockStations[0], mockStations[1]];
      const result = calculateCentroid(twoStations);

      const expectedLat = (35.681236 + 35.690921) / 2;
      const expectedLng = (139.767125 + 139.700258) / 2;

      expect(result.lat).toBeCloseTo(expectedLat, 6);
      expect(result.lng).toBeCloseTo(expectedLng, 6);
    });
  });

  describe('calculateDistance', () => {
    it('同じ座標間の距離は0になる', () => {
      const coord: Coordinate = { lat: 35.681236, lng: 139.767125 };
      const distance = calculateDistance(coord, coord);
      expect(distance).toBe(0);
    });

    it('東京駅と新宿駅間の距離を正しく計算する', () => {
      const tokyo: Coordinate = { lat: 35.681236, lng: 139.767125 };
      const shinjuku: Coordinate = { lat: 35.690921, lng: 139.700258 };

      const distance = calculateDistance(tokyo, shinjuku);

      // 東京駅-新宿駅間は約5.5km程度
      expect(distance).toBeGreaterThan(5);
      expect(distance).toBeLessThan(7);
    });

    it('より離れた座標間の距離を正しく計算する', () => {
      const tokyo: Coordinate = { lat: 35.681236, lng: 139.767125 };
      const osaka: Coordinate = { lat: 34.702485, lng: 135.495951 };

      const distance = calculateDistance(tokyo, osaka);

      // 東京-大阪間は約400km程度
      expect(distance).toBeGreaterThan(350);
      expect(distance).toBeLessThan(450);
    });

    it('Haversine公式の精度を検証する', () => {
      // 既知の座標間距離での検証
      const coord1: Coordinate = { lat: 0, lng: 0 };
      const coord2: Coordinate = { lat: 0, lng: 1 };

      const distance = calculateDistance(coord1, coord2);

      // 緯度0度での経度1度差は約111kmに相当
      expect(distance).toBeCloseTo(111.19, 1);
    });
  });

  describe('findNearestStation', () => {
    const searchCoordinate: Coordinate = { lat: 35.685, lng: 139.75 };

    it('空の駅配列が渡された場合はエラーを投げる', () => {
      expect(() => findNearestStation(searchCoordinate, [])).toThrow(
        '駅データがありません'
      );
    });

    it('単一の駅がある場合はその駅を返す', () => {
      const result = findNearestStation(searchCoordinate, [mockStations[0]]);
      expect(result).toEqual(mockStations[0]);
    });

    it('最寄りの駅を正しく見つける', () => {
      // 東京駅座標(35.681236, 139.767125)に近い座標で検索
      const nearTokyoStation: Coordinate = { lat: 35.681, lng: 139.767 };

      const result = findNearestStation(nearTokyoStation, mockStations);
      expect(result.name).toBe('東京');
    });

    it('重心座標に最も近い駅を見つける', () => {
      // 新宿駅に近い座標で検索
      const nearShinjuku: Coordinate = { lat: 35.691, lng: 139.7 };

      const result = findNearestStation(nearShinjuku, mockStations);
      expect(result.name).toBe('新宿');
    });

    it('複数の近い駅がある場合でも最寄りを正確に選択する', () => {
      // 渋谷駅に最も近い座標
      const nearShibuya: Coordinate = { lat: 35.658, lng: 139.701 };

      const result = findNearestStation(nearShibuya, mockStations);
      expect(result.name).toBe('渋谷');
    });

    it('距離計算の一貫性を確認する', () => {
      const testCoord: Coordinate = { lat: 35.67, lng: 139.72 };

      const nearest = findNearestStation(testCoord, mockStations);

      // 手動で距離を計算して最寄り駅を確認
      const distances = mockStations.map((station) => ({
        station,
        distance: calculateDistance(testCoord, {
          lat: station.lat,
          lng: station.lng,
        }),
      }));

      const manualNearest = distances.reduce((min, current) =>
        current.distance < min.distance ? current : min
      );

      expect(nearest).toEqual(manualNearest.station);
    });
  });
});
