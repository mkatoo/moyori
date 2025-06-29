# Moyori

複数人の最寄り駅から重心を計算し、最適な待ち合わせ場所を見つけるアプリケーションです。フリーワード検索または都道府県→路線→駅の3段階選択により、最大5つの駅を選択して重心点に最も近い実際の駅を推奨します。

## 機能

1. **駅選択システム** - フリーワード検索または都道府県→路線→駅の3段階選択
2. **リアルタイム重心計算** - 選択された駅の座標から重心を自動計算
3. **最寄り駅検索** - 重心に最も近い実際の駅を API で検索・表示
4. **インタラクティブマップ** - 選択された駅、重心、最寄り駅を地図上に可視化
5. **最大5駅制限** - パフォーマンスとユーザビリティのための制限

## 技術スタック

- **フロントエンド**: React 18, TypeScript, Tailwind CSS
- **地図表示**: Leaflet, React-Leaflet
- **外部API**:
  - HeartRails Express API（日本の鉄道データ）
  - HeartRails Geo API（逆ジオコーディング）
- **テスト**: Jest, React Testing Library, @testing-library/jest-dom, @testing-library/user-event
- **開発ツール**: ESLint, Prettier
- **ビルドツール**: Create React App

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start

# プロダクションビルド
npm run build

# テスト実行（ウォッチモード）
npm test

# テスト実行（1回のみ）
npm test -- --watchAll=false

# 特定のテストファイルを実行
npm test -- --testPathPattern=App.test.tsx

# コード品質チェック
npm run lint
npm run lint:fix

# コードフォーマット
npm run format
npm run format:check
```

## 使用方法

### フリーワード検索の場合
1. 「フリーワード検索」タブを選択してください
2. 駅名を入力して検索結果から駅を選択してください

### 3段階選択の場合
1. 「都道府県・路線から選択」タブを選択してください
2. 都道府県を選択してください
3. 表示される路線から選択してください
4. 路線上の駅を選択してください

### 重心計算・結果表示
1. 2駅以上選択すると自動的に重心が計算され、地図上に表示されます
2. 重心に最も近い実際の駅が「推奨待ち合わせ場所」として表示されます

## プロジェクト構造

```
src/
├── __tests__/               # アプリケーションテスト
├── components/
│   ├── __tests__/           # コンポーネントテスト
│   ├── Map.tsx              # Leaflet地図コンポーネント
│   ├── StationSearch.tsx    # フリーワード駅検索コンポーネント
│   └── StationSelector.tsx  # 駅選択メインコンポーネント（タブ切り替え）
├── data/
│   └── stations.ts         # 駅・路線・都道府県のインターフェース定義
├── utils/
│   ├── __tests__/          # ユーティリティ関数テスト
│   ├── api.ts              # HeartRails Express API連携
│   └── calculations.ts     # 重心・距離計算（ハーヴァサイン公式）
├── constants.ts            # アプリケーション定数
├── setupTests.ts           # Jest設定ファイル
├── App.tsx                 # メインアプリケーション
└── index.tsx               # エントリーポイント
```

## API仕様

### HeartRails Express API (`express.heartrails.com`)
- `getLines`: 都道府県の路線一覧取得
- `getStations`: 路線の駅一覧取得
- `getStations` (name指定): 駅名による駅検索
- `getStations` (座標指定): 指定座標に最も近い駅を取得

### HeartRails Geo API (`geoapi.heartrails.com`)
- `searchByGeoLocation`: 緯度・経度から住所情報を取得（逆ジオコーディング）

## テスト

アプリケーションには包括的なテストスイートが実装されています。

### テスト内容
- **ユニットテスト**: 重心・距離計算、API関数のテスト
- **コンポーネントテスト**: 駅選択、重心表示、エラーハンドリングのテスト
- **統合テスト**: ユーザー操作フローとAPI連携のテスト

### テスト実行
```bash
# 全テスト実行
npm test

# テストカバレッジを表示
npm test -- --coverage

# 特定のテストのみ実行
npm test -- --testPathPattern=calculations
```

## 技術詳細

- **距離計算**: ハーヴァサイン公式（地球半径6371km）
- **座標系**: HeartRails API の x=経度, y=緯度 形式
- **エラーハンドリング**: API失敗時のフォールバック処理
- **レスポンシブ対応**: モバイル・デスクトップ両対応
