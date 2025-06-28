# Moyori

複数人の最寄り駅から重心を計算し、最適な待ち合わせ場所を見つけるアプリケーションです。都道府県→路線→駅の3段階選択により、最大5つの駅を選択して重心点に最も近い実際の駅を推奨します。

## 機能

1. **3段階駅選択システム** - 都道府県、路線、駅の順で選択
2. **リアルタイム重心計算** - 選択された駅の座標から重心を自動計算
3. **最寄り駅検索** - 重心に最も近い実際の駅を API で検索・表示
4. **インタラクティブマップ** - 選択された駅、重心、最寄り駅を地図上に可視化
5. **最大5駅制限** - パフォーマンスとユーザビリティのための制限

## 技術スタック

- **フロントエンド**: React 18, TypeScript, Tailwind CSS
- **地図表示**: Leaflet, React-Leaflet
- **外部API**: HeartRails Express API（日本の鉄道データ）
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

# テスト実行
npm test

# コード品質チェック
npm run lint
npm run lint:fix

# コードフォーマット
npm run format
npm run format:check
```

## 使用方法

1. 都道府県を選択してください
2. 表示される路線から選択してください
3. 路線上の駅を選択してください（最大5駅）
4. 2駅以上選択すると自動的に重心が計算され、地図上に表示されます
5. 重心に最も近い実際の駅が「推奨待ち合わせ場所」として表示されます

## プロジェクト構造

```
src/
├── components/
│   ├── Map.tsx               # Leaflet地図コンポーネント
│   └── StationSelector.tsx   # 3段階駅選択コンポーネント
├── data/
│   └── stations.ts          # 駅・路線・都道府県のインターフェース定義
├── utils/
│   ├── api.ts               # HeartRails Express API連携
│   └── calculations.ts      # 重心・距離計算（ハーヴァサイン公式）
├── constants.ts             # アプリケーション定数
├── App.tsx                  # メインアプリケーション
└── index.tsx                # エントリーポイント
```

## API仕様

HeartRails Express API (`express.heartrails.com`) を使用:
- `getLines`: 都道府県の路線一覧取得
- `getStations`: 路線の駅一覧取得
- `getStations` (座標指定): 指定座標に最も近い駅を取得

## 技術詳細

- **距離計算**: ハーヴァサイン公式（地球半径6371km）
- **座標系**: HeartRails API の x=経度, y=緯度 形式
- **エラーハンドリング**: API失敗時のフォールバック処理
- **レスポンシブ対応**: モバイル・デスクトップ両対応