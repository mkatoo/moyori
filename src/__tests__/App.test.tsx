import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { api } from '../utils/api';
import { Station } from '../data/stations';

// APIをモック化
jest.mock('../utils/api');
const mockApi = api as jest.Mocked<typeof api>;

// Mapコンポーネントをモック化（Leafletの依存関係を避けるため）
jest.mock('../components/Map', () => {
  return function MockMap({ selectedStations, centroid, nearestStation }: any) {
    return (
      <div data-testid="map">
        <div data-testid="selected-stations-count">
          {selectedStations.length}
        </div>
        {centroid && (
          <div data-testid="centroid">
            {centroid.lat.toFixed(6)}, {centroid.lng.toFixed(6)}
          </div>
        )}
        {nearestStation && (
          <div data-testid="nearest-station">{nearestStation.name}</div>
        )}
      </div>
    );
  };
});

// StationSelectorをモック化（より単純なインターフェースで）
jest.mock('../components/StationSelector', () => {
  return function MockStationSelector({
    selectedStations,
    onStationSelect,
    onStationRemove,
  }: any) {
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

    return (
      <div data-testid="station-selector">
        <div data-testid="selected-stations">
          {selectedStations.map((station: Station, index: number) => (
            <div key={index} data-testid={`selected-station-${index}`}>
              {station.name} - {station.line}
              <button
                onClick={() => onStationRemove(station.name)}
                data-testid={`remove-station-${index}`}
              >
                削除
              </button>
            </div>
          ))}
        </div>
        {mockStations.map((station, index) => (
          <button
            key={index}
            onClick={() => onStationSelect(station)}
            data-testid={`add-station-${station.name}`}
          >
            {station.name}を追加
          </button>
        ))}
      </div>
    );
  };
});

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのAPIモックを設定
    mockApi.getNearestStation.mockResolvedValue(null);
    mockApi.getAddressFromCoordinates.mockResolvedValue(null);
    mockApi.getRoutes.mockResolvedValue([]);
    mockApi.getStations.mockResolvedValue([]);
    mockApi.searchStationsByName.mockResolvedValue([]);
  });

  it('アプリのタイトルとdescriptionが表示される', () => {
    render(<App />);

    expect(screen.getByText('Moyori')).toBeInTheDocument();
    expect(
      screen.getByText(
        '複数の最寄り駅から重心を計算し、最適な待ち合わせ場所を見つけます'
      )
    ).toBeInTheDocument();
  });

  it('初期状態では駅が選択されていない', () => {
    render(<App />);

    expect(screen.getByTestId('selected-stations')).toBeEmptyDOMElement();
    expect(screen.queryByTestId('map')).not.toBeInTheDocument();
  });

  it('駅を選択できる', async () => {
    render(<App />);

    const addTokyoButton = screen.getByTestId('add-station-東京');
    fireEvent.click(addTokyoButton);

    await waitFor(() => {
      expect(screen.getByTestId('selected-station-0')).toHaveTextContent(
        '東京 - JR東海道本線'
      );
    });
  });

  it('駅を削除できる', async () => {
    render(<App />);

    // 駅を追加
    const addTokyoButton = screen.getByTestId('add-station-東京');
    fireEvent.click(addTokyoButton);

    await waitFor(() => {
      expect(screen.getByTestId('selected-station-0')).toBeInTheDocument();
    });

    // 駅を削除
    const removeButton = screen.getByTestId('remove-station-0');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('selected-station-0')
      ).not.toBeInTheDocument();
    });
  });

  it('2つ以上の駅が選択されると重心計算結果が表示される', async () => {
    mockApi.getNearestStation.mockResolvedValue({
      name: '品川',
      lat: 35.628736,
      lng: 139.738708,
      prefecture: '東京都',
      line: 'JR東海道本線',
    });

    mockApi.getAddressFromCoordinates.mockResolvedValue({
      prefecture: '東京都',
      city: '港区',
      town: '高輪',
      postal: '108-0074',
    });

    render(<App />);

    // 2つの駅を選択
    fireEvent.click(screen.getByTestId('add-station-東京'));
    fireEvent.click(screen.getByTestId('add-station-新宿'));

    await waitFor(() => {
      expect(screen.getByText('計算結果')).toBeInTheDocument();
    });

    expect(screen.getByText('選択された駅の重心')).toBeInTheDocument();
    expect(screen.getByText('最寄りの駅')).toBeInTheDocument();

    // 重心座標が表示される
    expect(screen.getAllByText(/緯度:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/経度:/).length).toBeGreaterThan(0);

    // 最寄り駅情報が表示される
    await waitFor(() => {
      expect(screen.getAllByText('品川駅')).toHaveLength(2); // 最寄り駅セクションと最適な待ち合わせ場所の2箇所
    });
  });

  it('最寄り駅が見つからない場合の表示', async () => {
    mockApi.getNearestStation.mockResolvedValue(null);
    mockApi.getAddressFromCoordinates.mockResolvedValue(null);

    render(<App />);

    // 2つの駅を選択
    fireEvent.click(screen.getByTestId('add-station-東京'));
    fireEvent.click(screen.getByTestId('add-station-新宿'));

    await waitFor(() => {
      // 重心は計算されるが最寄り駅が見つからない場合のメッセージをチェック
      expect(
        screen.getByText(
          '重心は計算できましたが、その付近に駅が見つかりませんでした。'
        )
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('同じ地域や近い地域の駅を選択することをお勧めします。')
    ).toBeInTheDocument();
  });

  it('1つの駅だけ選択されている場合の警告メッセージ', () => {
    render(<App />);

    // 1つの駅を選択
    fireEvent.click(screen.getByTestId('add-station-東京'));

    expect(
      screen.getByText(
        '重心を計算するには、少なくとも2つの駅を選択してください。'
      )
    ).toBeInTheDocument();
  });

  it('すべてクリアボタンが機能する', async () => {
    render(<App />);

    // 駅を選択
    fireEvent.click(screen.getByTestId('add-station-東京'));
    fireEvent.click(screen.getByTestId('add-station-新宿'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-station-0')).toBeInTheDocument();
    });

    expect(screen.getByTestId('selected-station-1')).toBeInTheDocument();

    // すべてクリア
    const clearButton = screen.getByText('すべてクリア');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('selected-station-0')
      ).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('selected-station-1')).not.toBeInTheDocument();
  });

  it('住所の取得とローディング状態', async () => {
    let resolveAddress: (value: any) => void;
    const addressPromise = new Promise((resolve) => {
      resolveAddress = resolve;
    });

    mockApi.getNearestStation.mockResolvedValue({
      name: '品川',
      lat: 35.628736,
      lng: 139.738708,
      prefecture: '東京都',
      line: 'JR東海道本線',
    });

    mockApi.getAddressFromCoordinates.mockReturnValue(addressPromise as any);

    render(<App />);

    // 2つの駅を選択
    fireEvent.click(screen.getByTestId('add-station-東京'));
    fireEvent.click(screen.getByTestId('add-station-新宿'));

    // ローディング状態を確認
    await waitFor(() => {
      expect(screen.getByText('住所を取得中...')).toBeInTheDocument();
    });

    // 住所を解決
    resolveAddress!({
      prefecture: '東京都',
      city: '港区',
      town: '高輪',
      postal: '108-0074',
    });

    // 住所が表示される
    await waitFor(() => {
      expect(screen.getByText('東京都 港区 高輪')).toBeInTheDocument();
    });
  });

  it('重心計算エラーのハンドリング', () => {
    render(<App />);

    // 何らかの理由で重心計算が失敗した場合
    // (この場合は空の配列なのでエラーになる可能性がある)
    expect(screen.queryByText('計算結果')).not.toBeInTheDocument();
  });

  it('最適な待ち合わせ場所のメッセージ', async () => {
    mockApi.getNearestStation.mockResolvedValue({
      name: '品川',
      lat: 35.628736,
      lng: 139.738708,
      prefecture: '東京都',
      line: 'JR東海道本線',
    });

    render(<App />);

    // 2つの駅を選択
    fireEvent.click(screen.getByTestId('add-station-東京'));
    fireEvent.click(screen.getByTestId('add-station-新宿'));

    await waitFor(() => {
      expect(screen.getAllByText(/品川駅/).length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(/が最適な待ち合わせ場所です！/)
    ).toBeInTheDocument();
  });

  it('地図コンポーネントに正しいpropsが渡される', async () => {
    mockApi.getNearestStation.mockResolvedValue({
      name: '品川',
      lat: 35.628736,
      lng: 139.738708,
      prefecture: '東京都',
      line: 'JR東海道本線',
    });

    render(<App />);

    // 2つの駅を選択
    fireEvent.click(screen.getByTestId('add-station-東京'));
    fireEvent.click(screen.getByTestId('add-station-新宿'));

    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    expect(screen.getByTestId('selected-stations-count')).toHaveTextContent(
      '2'
    );
    expect(screen.getByTestId('centroid')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('nearest-station')).toHaveTextContent('品川');
    });
  });
});
