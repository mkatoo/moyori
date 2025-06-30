import { Station } from '../data/stations';

// NAVITIME Route API interfaces
export interface NavitimeRouteRequest {
  start: string; // lat,lng format
  goal: string; // lat,lng format
  start_time?: string; // YYYY-MM-DDTHH:MM:SS format
  arrival_time?: string; // YYYY-MM-DDTHH:MM:SS format
  shape?: boolean;
}

export interface NavitimeCoordinate {
  lat: number;
  lon: number;
}

export interface NavitimeSummary {
  start: {
    type: string;
    coord: NavitimeCoordinate;
    name: string;
    node_id: string;
  };
  goal: {
    type: string;
    coord: NavitimeCoordinate;
    name: string;
    node_id: string;
  };
  move: {
    transit_count: number;
    fare: {
      unit_0?: number;
      unit_48?: number;
    };
    from_time: string;
    to_time: string;
    time: number; // travel time in minutes
    distance: number;
  };
}

export interface NavitimeRouteSection {
  type: string;
  transport: {
    type: string;
    name?: string;
    line?: string;
  };
  from: {
    coord: NavitimeCoordinate;
    name: string;
    time?: string;
  };
  to: {
    coord: NavitimeCoordinate;
    name: string;
    time?: string;
  };
  move: {
    time: number;
    distance: number;
    fare?: {
      unit_0?: number;
      unit_48?: number;
    };
  };
}

export interface NavitimeRouteResponse {
  items: {
    summary: NavitimeSummary;
    sections: NavitimeRouteSection[];
  }[];
  unit: {
    search: {
      type: string;
    };
    coord: string;
    distance: string;
    time: string;
  };
}

export interface TravelTimeResult {
  fromStation: Station;
  toStation: Station;
  travelTimeMinutes: number;
  fare?: number;
  success: boolean;
  error?: string;
}

export interface TravelTimeMatrix {
  [fromStationName: string]: {
    [toStationName: string]: TravelTimeResult;
  };
}

// 環境変数から API キーを取得
const RAPIDAPI_KEY = process.env.REACT_APP_RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'navitime-route-totalnavi.p.rapidapi.com';
const API_BASE_URL = `https://${RAPIDAPI_HOST}`;

class TravelTimeApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'TravelTimeApiError';
  }
}

export const travelTimeApi = {
  /**
   * 2つの駅間の travel time を計算
   */
  async calculateTravelTime(
    fromStation: Station,
    toStation: Station,
    departureTime?: Date
  ): Promise<TravelTimeResult> {
    if (!RAPIDAPI_KEY) {
      return {
        fromStation,
        toStation,
        travelTimeMinutes: 0,
        success: false,
        error: 'API key not configured',
      };
    }

    try {
      const startCoord = `${fromStation.lat},${fromStation.lng}`;
      const goalCoord = `${toStation.lat},${toStation.lng}`;

      const params = new URLSearchParams({
        start: startCoord,
        goal: goalCoord,
        shape: 'false',
      });

      // 出発時刻を指定する場合
      if (departureTime) {
        const timeString = departureTime.toISOString().slice(0, 19);
        params.append('start_time', timeString);
      }

      const url = `${API_BASE_URL}/route_transit?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new TravelTimeApiError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data: NavitimeRouteResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        return {
          fromStation,
          toStation,
          travelTimeMinutes: 0,
          success: false,
          error: 'No route found',
        };
      }

      const bestRoute = data.items[0];
      const travelTimeMinutes = bestRoute.summary.move.time;
      const fare = bestRoute.summary.move.fare?.unit_0;

      return {
        fromStation,
        toStation,
        travelTimeMinutes,
        fare,
        success: true,
      };
    } catch (error) {
      console.error('Travel time calculation failed:', error);

      return {
        fromStation,
        toStation,
        travelTimeMinutes: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * 複数の駅間の travel time matrix を計算
   */
  async calculateTravelTimeMatrix(
    stations: Station[],
    departureTime?: Date
  ): Promise<TravelTimeMatrix> {
    const matrix: TravelTimeMatrix = {};

    // 各駅をキーとして初期化
    for (const station of stations) {
      matrix[station.name] = {};
    }

    // 全ての駅のペアで travel time を計算
    const promises: Promise<void>[] = [];

    for (let i = 0; i < stations.length; i++) {
      for (let j = 0; j < stations.length; j++) {
        if (i !== j) {
          const fromStation = stations[i];
          const toStation = stations[j];

          const promise = this.calculateTravelTime(
            fromStation,
            toStation,
            departureTime
          ).then((result) => {
            matrix[fromStation.name][toStation.name] = result;
          });

          promises.push(promise);
        }
      }
    }

    // 全ての API 呼び出しを並行実行
    await Promise.all(promises);

    return matrix;
  },

  /**
   * レート制限を考慮した travel time matrix の計算（順次実行）
   */
  async calculateTravelTimeMatrixSequential(
    stations: Station[],
    departureTime?: Date,
    delayMs: number = 100
  ): Promise<TravelTimeMatrix> {
    const matrix: TravelTimeMatrix = {};

    // 各駅をキーとして初期化
    for (const station of stations) {
      matrix[station.name] = {};
    }

    // 各駅のペアで順次 travel time を計算（レート制限対策）
    for (let i = 0; i < stations.length; i++) {
      for (let j = 0; j < stations.length; j++) {
        if (i !== j) {
          const fromStation = stations[i];
          const toStation = stations[j];

          const result = await this.calculateTravelTime(
            fromStation,
            toStation,
            departureTime
          );
          matrix[fromStation.name][toStation.name] = result;

          // レート制限対策のための遅延
          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }
    }

    return matrix;
  },

  /**
   * 最短 travel time のルートを見つける
   */
  findShortestTravelTime(
    matrix: TravelTimeMatrix,
    fromStation: string
  ): {
    toStation: string;
    travelTime: number;
  } | null {
    const routes = matrix[fromStation];
    if (!routes) return null;

    let shortestTime = Infinity;
    let bestDestination = '';

    for (const [toStation, result] of Object.entries(routes)) {
      if (result.success && result.travelTimeMinutes < shortestTime) {
        shortestTime = result.travelTimeMinutes;
        bestDestination = toStation;
      }
    }

    return shortestTime === Infinity
      ? null
      : {
          toStation: bestDestination,
          travelTime: shortestTime,
        };
  },
};
