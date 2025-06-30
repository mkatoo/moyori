import { Station } from '../data/stations';
import { TravelTimeMatrix } from './travelTimeApi';

export interface Coordinate {
  lat: number;
  lng: number;
}

export function calculateCentroid(stations: Station[]): Coordinate {
  if (stations.length === 0) {
    throw new Error('駅が選択されていません');
  }

  const totalLat = stations.reduce((sum, station) => sum + station.lat, 0);
  const totalLng = stations.reduce((sum, station) => sum + station.lng, 0);

  return {
    lat: totalLat / stations.length,
    lng: totalLng / stations.length,
  };
}

export function calculateDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const R = 6371; // 地球の半径（km）
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

export function findNearestStation(
  centroid: Coordinate,
  allStations: Station[]
): Station {
  if (allStations.length === 0) {
    throw new Error('駅データがありません');
  }

  let nearestStation = allStations[0];
  let minDistance = calculateDistance(centroid, nearestStation);

  for (const station of allStations) {
    const distance = calculateDistance(centroid, station);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  }

  return nearestStation;
}

// Travel time based calculations

export interface EqualTravelTimeResult {
  station: Station;
  averageTravelTime: number;
  travelTimeVariance: number;
  travelTimes: { fromStation: string; timeMinutes: number }[];
  totalFare?: number;
}

/**
 * 選択された駅から等しい travel time で到達できる駅を見つける
 */
export async function findEqualTravelTimeStation(
  selectedStations: Station[],
  candidateStations: Station[],
  travelTimeMatrix: TravelTimeMatrix,
  maxTravelTimeMinutes: number = 90
): Promise<EqualTravelTimeResult[]> {
  if (selectedStations.length < 2) {
    throw new Error('travel time の計算には少なくとも2つの駅が必要です');
  }

  const results: EqualTravelTimeResult[] = [];

  for (const candidate of candidateStations) {
    const travelTimes: { fromStation: string; timeMinutes: number }[] = [];
    let totalSuccessfulRoutes = 0;
    let totalFare = 0;
    let isValidCandidate = true;

    // 各選択駅からこの候補駅への travel time を取得
    for (const selectedStation of selectedStations) {
      const travelTimeResult =
        travelTimeMatrix[selectedStation.name]?.[candidate.name];

      if (!travelTimeResult || !travelTimeResult.success) {
        isValidCandidate = false;
        break;
      }

      // 最大 travel time を超える場合は候補から除外
      if (travelTimeResult.travelTimeMinutes > maxTravelTimeMinutes) {
        isValidCandidate = false;
        break;
      }

      travelTimes.push({
        fromStation: selectedStation.name,
        timeMinutes: travelTimeResult.travelTimeMinutes,
      });

      totalSuccessfulRoutes++;
      totalFare += travelTimeResult.fare || 0;
    }

    // 全ての駅からの travel time が取得できた場合のみ評価
    if (isValidCandidate && totalSuccessfulRoutes === selectedStations.length) {
      const times = travelTimes.map((t) => t.timeMinutes);
      const averageTravelTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const travelTimeVariance = calculateVariance(times);

      results.push({
        station: candidate,
        averageTravelTime,
        travelTimeVariance,
        travelTimes,
        totalFare: totalFare > 0 ? totalFare : undefined,
      });
    }
  }

  // travel time の分散が小さい順（より等しい travel time）でソート
  return results.sort((a, b) => a.travelTimeVariance - b.travelTimeVariance);
}

/**
 * 数値配列の分散を計算
 */
export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sumSquaredDiffs = values.reduce(
    (sum, value) => sum + Math.pow(value - mean, 2),
    0
  );

  return sumSquaredDiffs / values.length;
}

/**
 * 指定された範囲内の候補駅を見つける
 */
export function findCandidateStationsInRange(
  selectedStations: Station[],
  allStations: Station[],
  maxDistanceKm: number = 50
): Station[] {
  if (selectedStations.length === 0) return [];

  // 選択された駅の重心を計算
  const centroid = calculateCentroid(selectedStations);

  // 重心から指定距離内の駅を候補として選出
  const candidateStations = allStations.filter((station) => {
    // 既に選択されている駅は除外
    const isSelected = selectedStations.some(
      (selected) => selected.name === station.name
    );
    if (isSelected) return false;

    // 重心からの距離をチェック
    const distance = calculateDistance(centroid, station);
    return distance <= maxDistanceKm;
  });

  return candidateStations;
}

/**
 * travel time matrix から最適な待ち合わせ駅を見つける
 */
export function findOptimalMeetingStation(
  equalTravelTimeResults: EqualTravelTimeResult[],
  preferenceWeights: {
    travelTimeVariance: number; // 低いほど良い（travel time の均等性）
    averageTravelTime: number; // 低いほど良い（全体的な移動時間）
    totalFare: number; // 低いほど良い（交通費）
  } = {
    travelTimeVariance: 0.7,
    averageTravelTime: 0.2,
    totalFare: 0.1,
  }
): EqualTravelTimeResult | null {
  if (equalTravelTimeResults.length === 0) return null;

  // 正規化のための最大値・最小値を計算
  const maxVariance = Math.max(
    ...equalTravelTimeResults.map((r) => r.travelTimeVariance)
  );
  const minVariance = Math.min(
    ...equalTravelTimeResults.map((r) => r.travelTimeVariance)
  );
  const maxAvgTime = Math.max(
    ...equalTravelTimeResults.map((r) => r.averageTravelTime)
  );
  const minAvgTime = Math.min(
    ...equalTravelTimeResults.map((r) => r.averageTravelTime)
  );
  const maxFare = Math.max(
    ...equalTravelTimeResults.map((r) => r.totalFare || 0)
  );
  const minFare = Math.min(
    ...equalTravelTimeResults.map((r) => r.totalFare || 0)
  );

  let bestResult: EqualTravelTimeResult | null = null;
  let bestScore = Infinity;

  for (const result of equalTravelTimeResults) {
    // 各指標を0-1の範囲に正規化（低いほど良いので、1から引く）
    const normalizedVariance =
      maxVariance === minVariance
        ? 0
        : (result.travelTimeVariance - minVariance) /
          (maxVariance - minVariance);

    const normalizedAvgTime =
      maxAvgTime === minAvgTime
        ? 0
        : (result.averageTravelTime - minAvgTime) / (maxAvgTime - minAvgTime);

    const normalizedFare =
      maxFare === minFare
        ? 0
        : ((result.totalFare || 0) - minFare) / (maxFare - minFare);

    // 重み付きスコアを計算（低いほど良い）
    const score =
      normalizedVariance * preferenceWeights.travelTimeVariance +
      normalizedAvgTime * preferenceWeights.averageTravelTime +
      normalizedFare * preferenceWeights.totalFare;

    if (score < bestScore) {
      bestScore = score;
      bestResult = result;
    }
  }

  return bestResult;
}
