import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StationSelector from '../StationSelector';
import { api } from '../../utils/api';
import { Station } from '../../data/stations';

// APIをモック化
jest.mock('../../utils/api');
const mockApi = api as jest.Mocked<typeof api>;

// StationSearchコンポーネントをモック化
jest.mock('../StationSearch', () => {
  return function MockStationSearch({
    selectedStations,
    onStationSelect,
    onStationRemove,
  }: any) {
    return (
      <div data-testid="station-search">
        <input
          data-testid="search-input"
          placeholder="駅名を入力してください"
        />
        <div data-testid="search-results">
          <button
            onClick={() =>
              onStationSelect({
                name: '検索結果駅',
                lat: 35.0,
                lng: 139.0,
                prefecture: 'テスト県',
                line: 'テスト線',
              })
            }
            data-testid="search-result-station"
          >
            検索結果駅を選択
          </button>
        </div>
        <div data-testid="selected-stations-search">
          {selectedStations.map((station: Station, index: number) => (
            <div key={index} data-testid={`search-selected-station-${index}`}>
              {station.name}
              <button
                onClick={() => onStationRemove(station.name)}
                data-testid={`search-remove-station-${index}`}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };
});

describe('StationSelector', () => {
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
  ];

  const defaultProps = {
    selectedStations: [],
    onStationSelect: jest.fn(),
    onStationRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのAPIモックを設定
    mockApi.getRoutes.mockResolvedValue([
      { name: 'JR山手線' },
      { name: 'JR中央線' },
    ]);
    mockApi.getStations.mockResolvedValue([
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
    ]);
  });

  describe('タブ機能', () => {
    it('初期状態では検索タブがアクティブ', () => {
      render(<StationSelector {...defaultProps} />);

      const searchTab = screen.getByText('フリーワード検索');
      const browseTab = screen.getByText('都道府県・路線から選択');

      expect(searchTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(browseTab).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('タブをクリックして切り替えできる', () => {
      render(<StationSelector {...defaultProps} />);

      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      expect(browseTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(screen.getByText('都道府県を選択')).toBeInTheDocument();
    });

    it('検索タブに戻ることができる', () => {
      render(<StationSelector {...defaultProps} />);

      const browseTab = screen.getByText('都道府県・路線から選択');
      const searchTab = screen.getByText('フリーワード検索');

      fireEvent.click(browseTab);
      fireEvent.click(searchTab);

      expect(searchTab).toHaveClass('border-blue-500', 'text-blue-600');
    });
  });

  describe('都道府県・路線選択機能', () => {
    it('都道府県セレクトボックスが表示される', () => {
      render(<StationSelector {...defaultProps} />);
      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      expect(screen.getByText('都道府県を選択')).toBeInTheDocument();

      const prefectureSelect = screen.getAllByRole('combobox')[0];
      expect(prefectureSelect).toBeInTheDocument();
      expect(
        screen.getByText('都道府県を選択してください')
      ).toBeInTheDocument();
    });

    it('都道府県を選択すると路線が読み込まれる', async () => {
      render(<StationSelector {...defaultProps} />);
      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      const selects = screen.getAllByRole('combobox');
      const prefectureSelect = selects[0]; // First select is prefecture

      fireEvent.change(prefectureSelect, { target: { value: '東京都' } });

      expect(mockApi.getRoutes).toHaveBeenCalledWith('東京都');

      await waitFor(() => {
        expect(screen.getByText('JR山手線')).toBeInTheDocument();
      });

      expect(screen.getByText('JR中央線')).toBeInTheDocument();
    });

    it('路線を選択すると駅が読み込まれる', async () => {
      render(<StationSelector {...defaultProps} />);
      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      const selects = screen.getAllByRole('combobox');
      const prefectureSelect = selects[0]; // First select is prefecture
      fireEvent.change(prefectureSelect, { target: { value: '東京都' } });

      await waitFor(() => {
        expect(screen.getByText('JR山手線')).toBeInTheDocument();
      });

      const routeSelect = screen.getAllByRole('combobox')[1]; // Second select is route
      fireEvent.change(routeSelect, { target: { value: 'JR山手線' } });

      expect(mockApi.getStations).toHaveBeenCalledWith('JR山手線');

      await waitFor(() => {
        expect(screen.getByText('東京')).toBeInTheDocument();
      });

      expect(screen.getByText('新宿')).toBeInTheDocument();
    });

    it('駅を選択するとonStationSelectが呼ばれる', async () => {
      render(<StationSelector {...defaultProps} />);
      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      const selects = screen.getAllByRole('combobox');
      const prefectureSelect = selects[0]; // First select is prefecture
      fireEvent.change(prefectureSelect, { target: { value: '東京都' } });

      await waitFor(() => {
        expect(screen.getByText('JR山手線')).toBeInTheDocument();
      });

      const routeSelect = screen.getAllByRole('combobox')[1]; // Second select is route
      fireEvent.change(routeSelect, { target: { value: 'JR山手線' } });

      await waitFor(() => {
        expect(screen.getByText('東京')).toBeInTheDocument();
      });

      const stationSelect = screen.getAllByRole('combobox')[2]; // Third select is station
      fireEvent.change(stationSelect, { target: { value: '東京' } });

      expect(defaultProps.onStationSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '東京',
          lat: 35.681236,
          lng: 139.767125,
          prefecture: '東京都',
          line: 'JR東海道本線',
        })
      );
    });

    it('路線選択がリセットされる', async () => {
      render(<StationSelector {...defaultProps} />);
      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      const selects = screen.getAllByRole('combobox');
      const prefectureSelect = selects[0]; // First select is prefecture

      // 最初の都道府県を選択
      fireEvent.change(prefectureSelect, { target: { value: '東京都' } });

      await waitFor(() => {
        expect(screen.getByText('JR山手線')).toBeInTheDocument();
      });

      const routeSelect = screen.getAllByRole('combobox')[1]; // Second select is route
      fireEvent.change(routeSelect, { target: { value: 'JR山手線' } });

      // 別の都道府県を選択
      fireEvent.change(prefectureSelect, { target: { value: '神奈川県' } });

      // 路線選択がリセットされることを確認
      expect(routeSelect).toHaveValue('');
    });
  });

  describe('選択された駅の表示と削除', () => {
    it('選択された駅が表示される', () => {
      render(
        <StationSelector {...defaultProps} selectedStations={mockStations} />
      );

      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      expect(screen.getByText('選択された駅')).toBeInTheDocument();
      expect(screen.getByText('東京駅')).toBeInTheDocument();
      expect(screen.getByText('新宿駅')).toBeInTheDocument();
      expect(screen.getByText('JR東海道本線 (東京都)')).toBeInTheDocument();
      expect(screen.getByText('JR山手線 (東京都)')).toBeInTheDocument();
    });

    it('駅の削除ボタンをクリックするとonStationRemoveが呼ばれる', () => {
      render(
        <StationSelector {...defaultProps} selectedStations={mockStations} />
      );

      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      const deleteButtons = screen.getAllByText('削除');
      fireEvent.click(deleteButtons[0]);

      expect(defaultProps.onStationRemove).toHaveBeenCalledWith('東京');
    });

    it('選択された駅がない場合は選択済み駅セクションが表示されない', () => {
      render(<StationSelector {...defaultProps} />);

      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      expect(screen.queryByText('選択された駅')).not.toBeInTheDocument();
    });
  });

  describe('最大駅数制限', () => {
    it('最大数に達した場合は駅選択が無効になる', async () => {
      const maxStations = Array.from({ length: 5 }, (_, i) => ({
        name: `駅${i + 1}`,
        lat: 35.0 + i * 0.01,
        lng: 139.0 + i * 0.01,
        prefecture: '東京都',
        line: 'テスト線',
      }));

      render(
        <StationSelector {...defaultProps} selectedStations={maxStations} />
      );

      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      expect(screen.getByText(/最大5駅まで選択できます/)).toBeInTheDocument();

      const selects = screen.getAllByRole('combobox');
      const prefectureSelect = selects[0]; // First select is prefecture
      fireEvent.change(prefectureSelect, { target: { value: '東京都' } });

      await waitFor(() => {
        expect(screen.getByText('JR山手線')).toBeInTheDocument();
      });

      const routeSelect = screen.getAllByRole('combobox')[1]; // Second select is route
      fireEvent.change(routeSelect, { target: { value: 'JR山手線' } });

      await waitFor(() => {
        const stationSelect = screen.getAllByRole('combobox')[2]; // Third select is station
        expect(stationSelect).toBeDisabled();
      });
    });
  });

  describe('ローディング状態', () => {
    it('路線読み込み中にローディング表示', async () => {
      let resolveRoutes: (value: any) => void;
      const routesPromise = new Promise((resolve) => {
        resolveRoutes = resolve;
      });

      mockApi.getRoutes.mockReturnValue(routesPromise as any);

      render(<StationSelector {...defaultProps} />);

      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      const selects = screen.getAllByRole('combobox');
      const prefectureSelect = selects[0]; // First select is prefecture
      fireEvent.change(prefectureSelect, { target: { value: '東京都' } });

      await waitFor(() => {
        expect(screen.getAllByText('読み込み中...').length).toBeGreaterThan(0);
      });

      resolveRoutes!([{ name: 'JR山手線' }]);

      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      });
    });

    it('駅読み込み中にローディング表示', async () => {
      let resolveStations: (value: any) => void;
      const stationsPromise = new Promise((resolve) => {
        resolveStations = resolve;
      });

      mockApi.getStations.mockReturnValue(stationsPromise as any);

      render(<StationSelector {...defaultProps} />);

      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      const selects = screen.getAllByRole('combobox');
      const prefectureSelect = selects[0]; // First select is prefecture
      fireEvent.change(prefectureSelect, { target: { value: '東京都' } });

      await waitFor(() => {
        expect(screen.getByText('JR山手線')).toBeInTheDocument();
      });

      const routeSelect = screen.getAllByRole('combobox')[1]; // Second select is route
      fireEvent.change(routeSelect, { target: { value: 'JR山手線' } });

      expect(screen.getAllByText('読み込み中...').length).toBeGreaterThan(0);

      resolveStations!([
        {
          name: '東京',
          lat: 35.681236,
          lng: 139.767125,
          prefecture: '東京都',
          line: 'JR東海道本線',
        },
      ]);

      await waitFor(() => {
        expect(screen.getByText('東京')).toBeInTheDocument();
      });
    });
  });

  describe('駅のフィルタリング', () => {
    it('既に選択された駅は選択肢から除外される', async () => {
      const alreadySelectedStation = {
        name: '東京',
        lat: 35.681236,
        lng: 139.767125,
        prefecture: '東京都',
        line: 'JR東海道本線',
      };

      render(
        <StationSelector
          {...defaultProps}
          selectedStations={[alreadySelectedStation]}
        />
      );

      const browseTab = screen.getByText('都道府県・路線から選択');
      fireEvent.click(browseTab);

      const selects = screen.getAllByRole('combobox');
      const prefectureSelect = selects[0]; // First select is prefecture
      fireEvent.change(prefectureSelect, { target: { value: '東京都' } });

      await waitFor(() => {
        expect(screen.getByText('JR山手線')).toBeInTheDocument();
      });

      const routeSelect = screen.getAllByRole('combobox')[1]; // Second select is route
      fireEvent.change(routeSelect, { target: { value: 'JR山手線' } });

      await waitFor(() => {
        // 新宿は表示されるが、東京は表示されない（すでに選択済みのため）
        expect(screen.getByText('新宿')).toBeInTheDocument();
      });

      // 東京は選択肢にないことを確認
      expect(screen.queryByDisplayValue('東京')).not.toBeInTheDocument();
    });
  });

  describe('フリーワード検索タブ', () => {
    it('StationSearchコンポーネントが表示される', () => {
      render(<StationSelector {...defaultProps} />);

      expect(screen.getByTestId('station-search')).toBeInTheDocument();
    });

    it('検索結果から駅を選択できる', () => {
      render(<StationSelector {...defaultProps} />);

      const searchResultButton = screen.getByTestId('search-result-station');
      fireEvent.click(searchResultButton);

      expect(defaultProps.onStationSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '検索結果駅',
          lat: 35.0,
          lng: 139.0,
          prefecture: 'テスト県',
          line: 'テスト線',
        })
      );
    });
  });
});
