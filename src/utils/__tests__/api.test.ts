import { api } from '../api';

// フェッチをモック化
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('api', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getRoutes', () => {
    it('正常なレスポンスから路線リストを取得する', async () => {
      const mockResponse = {
        response: {
          line: ['JR山手線', 'JR中央線', '東京メトロ丸ノ内線'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getRoutes('東京都');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://express.heartrails.com/api/json?method=getLines&prefecture=%E6%9D%B1%E4%BA%AC%E9%83%BD'
      );
      expect(result).toEqual([
        { name: 'JR山手線' },
        { name: 'JR中央線' },
        { name: '東京メトロ丸ノ内線' },
      ]);
    });

    it('空のレスポンスの場合は空配列を返す', async () => {
      const mockResponse = {
        response: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getRoutes('東京都');

      expect(result).toEqual([]);
    });

    it('APIエラーの場合は空配列を返す', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await api.getRoutes('東京都');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch routes:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('lineプロパティがないレスポンスの場合は空配列を返す', async () => {
      const mockResponse = {
        response: {
          other: 'data',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getRoutes('東京都');

      expect(result).toEqual([]);
    });
  });

  describe('getStations', () => {
    it('正常なレスポンスから駅リストを取得する', async () => {
      const mockResponse = {
        response: {
          station: [
            {
              name: '東京',
              prefecture: '東京都',
              line: 'JR東海道本線',
              x: '139.767125',
              y: '35.681236',
            },
            {
              name: '有楽町',
              prefecture: '東京都',
              line: 'JR東海道本線',
              x: '139.763806',
              y: '35.675069',
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getStations('JR東海道本線');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://express.heartrails.com/api/json?method=getStations&line=JR%E6%9D%B1%E6%B5%B7%E9%81%93%E6%9C%AC%E7%B7%9A'
      );
      expect(result).toEqual([
        {
          name: '東京',
          lat: 35.681236,
          lng: 139.767125,
          prefecture: '東京都',
          line: 'JR東海道本線',
        },
        {
          name: '有楽町',
          lat: 35.675069,
          lng: 139.763806,
          prefecture: '東京都',
          line: 'JR東海道本線',
        },
      ]);
    });

    it('空のレスポンスの場合は空配列を返す', async () => {
      const mockResponse = {
        response: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getStations('JR東海道本線');

      expect(result).toEqual([]);
    });

    it('APIエラーの場合は空配列を返す', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await api.getStations('JR東海道本線');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch stations:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('座標の文字列を数値に正しく変換する', async () => {
      const mockResponse = {
        response: {
          station: [
            {
              name: 'テスト駅',
              prefecture: 'テスト県',
              line: 'テスト線',
              x: '123.456789',
              y: '98.765432',
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getStations('テスト線');

      expect(result[0].lat).toBe(98.765432);
      expect(result[0].lng).toBe(123.456789);
    });
  });

  describe('getNearestStation', () => {
    it('正常なレスポンスから最寄り駅を取得する', async () => {
      const mockResponse = {
        response: {
          station: [
            {
              name: '東京',
              prefecture: '東京都',
              line: 'JR東海道本線',
              distance: '0.1',
              x: '139.767125',
              y: '35.681236',
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getNearestStation(35.681236, 139.767125);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://express.heartrails.com/api/json?method=getStations&x=139.767125&y=35.681236'
      );
      expect(result).toEqual({
        name: '東京',
        lat: 35.681236,
        lng: 139.767125,
        prefecture: '東京都',
        line: 'JR東海道本線',
      });
    });

    it('空のレスポンスの場合はnullを返す', async () => {
      const mockResponse = {
        response: {
          station: [],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getNearestStation(35.681236, 139.767125);

      expect(result).toBeNull();
    });

    it('stationプロパティがないレスポンスの場合はnullを返す', async () => {
      const mockResponse = {
        response: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getNearestStation(35.681236, 139.767125);

      expect(result).toBeNull();
    });

    it('APIエラーの場合はnullを返す', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await api.getNearestStation(35.681236, 139.767125);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch nearest station:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getAddressFromCoordinates', () => {
    it('正常なレスポンスから住所を取得する', async () => {
      const mockResponse = {
        response: {
          location: [
            {
              prefecture: '東京都',
              city: '千代田区',
              town: '丸の内',
              postal: '100-0005',
              x: '139.767125',
              y: '35.681236',
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getAddressFromCoordinates(35.681236, 139.767125);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=139.767125&y=35.681236'
      );
      expect(result).toEqual({
        prefecture: '東京都',
        city: '千代田区',
        town: '丸の内',
        postal: '100-0005',
      });
    });

    it('空のレスポンスの場合はnullを返す', async () => {
      const mockResponse = {
        response: {
          location: [],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getAddressFromCoordinates(35.681236, 139.767125);

      expect(result).toBeNull();
    });

    it('APIエラーの場合はnullを返す', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await api.getAddressFromCoordinates(35.681236, 139.767125);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch address:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('searchStationsByName', () => {
    it('正常なレスポンスから駅検索結果を取得する', async () => {
      const mockResponse = {
        response: {
          station: [
            {
              name: '東京',
              prefecture: '東京都',
              line: 'JR東海道本線',
              x: '139.767125',
              y: '35.681236',
            },
            {
              name: '東京',
              prefecture: '東京都',
              line: 'JR中央線',
              x: '139.767125',
              y: '35.681236',
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.searchStationsByName('東京');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://express.heartrails.com/api/json?method=getStations&name=%E6%9D%B1%E4%BA%AC'
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('東京');
      expect(result[1].name).toBe('東京');
    });

    it('空の検索文字列の場合は空配列を返す', async () => {
      const result = await api.searchStationsByName('');

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('空白のみの検索文字列の場合は空配列を返す', async () => {
      const result = await api.searchStationsByName('   ');

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('空のレスポンスの場合は空配列を返す', async () => {
      const mockResponse = {
        response: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.searchStationsByName('存在しない駅');

      expect(result).toEqual([]);
    });

    it('APIエラーの場合は空配列を返す', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await api.searchStationsByName('東京');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to search stations by name:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
