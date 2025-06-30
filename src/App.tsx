import React, { useState, useMemo, useEffect, useCallback } from 'react';
import StationSelector from './components/StationSelector';
import Map from './components/Map';
import { Station } from './data/stations';
import {
  calculateCentroid,
  findCandidateStationsInRange,
  findEqualTravelTimeStation,
  findOptimalMeetingStation,
  EqualTravelTimeResult,
} from './utils/calculations';
import { api, Address } from './utils/api';
import { travelTimeApi, TravelTimeMatrix } from './utils/travelTimeApi';
import { MAX_STATIONS } from './constants';

type CalculationMode = 'centroid' | 'travelTime';

function App() {
  const [selectedStations, setSelectedStations] = useState<Station[]>([]);
  const [calculationMode, setCalculationMode] =
    useState<CalculationMode>('centroid');

  // Centroid-based results
  const [nearestStation, setNearestStation] = useState<Station | null>(null);
  const [centroidAddress, setCentroidAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Travel time-based results
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [travelTimeMatrix, setTravelTimeMatrix] =
    useState<TravelTimeMatrix | null>(null);
  const [optimalMeetingStation, setOptimalMeetingStation] =
    useState<EqualTravelTimeResult | null>(null);
  const [travelTimeLoading, setTravelTimeLoading] = useState(false);
  const [travelTimeError, setTravelTimeError] = useState<string | null>(null);

  const handleStationSelect = (station: Station) => {
    setSelectedStations((prev) => {
      if (prev.length >= MAX_STATIONS) {
        return prev;
      }
      return [...prev, station];
    });
  };

  const handleStationRemove = (stationName: string) => {
    setSelectedStations((prev) => prev.filter((s) => s.name !== stationName));
  };

  const centroid = useMemo(() => {
    if (selectedStations.length === 0) return null;
    try {
      return calculateCentroid(selectedStations);
    } catch {
      return null;
    }
  }, [selectedStations]);

  useEffect(() => {
    if (centroid) {
      api.getNearestStation(centroid.lat, centroid.lng).then(setNearestStation);
    } else {
      setNearestStation(null);
    }
  }, [centroid]);

  useEffect(() => {
    if (centroid) {
      setAddressLoading(true);
      api
        .getAddressFromCoordinates(centroid.lat, centroid.lng)
        .then(setCentroidAddress)
        .finally(() => setAddressLoading(false));
    } else {
      setCentroidAddress(null);
      setAddressLoading(false);
    }
  }, [centroid]);

  // すべての駅データを取得する（実際の実装では、より効率的な方法を検討）
  const getAllStationsForCandidates = useCallback(async (): Promise<
    Station[]
  > => {
    // 簡単な実装として、選択された駅の路線から駅を取得
    const allStations: Station[] = [];
    const processedLines = new Set<string>();

    for (const station of selectedStations) {
      if (!processedLines.has(station.line)) {
        try {
          const lineStations = await api.getStations(station.line);
          allStations.push(...lineStations);
          processedLines.add(station.line);
        } catch (error) {
          console.error(
            `Failed to get stations for line ${station.line}:`,
            error
          );
        }
      }
    }

    return allStations;
  }, [selectedStations]);

  const calculateTravelTimes = useCallback(async () => {
    if (selectedStations.length < 2) return;

    setTravelTimeLoading(true);
    setTravelTimeError(null);
    setOptimalMeetingStation(null);

    try {
      // 候補駅を見つける（重心から50km以内）
      const allStations = await getAllStationsForCandidates();
      const candidateStations = findCandidateStationsInRange(
        selectedStations,
        allStations,
        50
      );

      if (candidateStations.length === 0) {
        setTravelTimeError(
          '候補駅が見つかりませんでした。より近い駅を選択してください。'
        );
        return;
      }

      // travel time matrix を計算（上位30駅に制限してAPI呼び出しを減らす）
      const limitedCandidates = candidateStations.slice(0, 30);
      const matrix = await travelTimeApi.calculateTravelTimeMatrixSequential(
        [...selectedStations, ...limitedCandidates],
        new Date()
      );

      setTravelTimeMatrix(matrix);

      // 等しい travel time の駅を見つける
      const equalTravelTimeResults = await findEqualTravelTimeStation(
        selectedStations,
        limitedCandidates,
        matrix,
        90
      );

      if (equalTravelTimeResults.length === 0) {
        setTravelTimeError(
          '等しいtravelTimeで到達できる駅が見つかりませんでした。'
        );
        return;
      }

      // 最適な待ち合わせ駅を選択
      const optimal = findOptimalMeetingStation(equalTravelTimeResults);
      setOptimalMeetingStation(optimal);
    } catch (error) {
      console.error('Travel time calculation failed:', error);
      setTravelTimeError(
        error instanceof Error
          ? error.message
          : 'travelTimeの計算でエラーが発生しました'
      );
    } finally {
      setTravelTimeLoading(false);
    }
  }, [selectedStations, getAllStationsForCandidates]);

  // Travel time calculation effect
  useEffect(() => {
    if (calculationMode === 'travelTime' && selectedStations.length >= 2) {
      calculateTravelTimes();
    } else {
      setTravelTimeMatrix(null);
      setOptimalMeetingStation(null);
      setTravelTimeError(null);
    }
  }, [calculationMode, selectedStations, calculateTravelTimes]);

  const clearAll = () => {
    setSelectedStations([]);
    setTravelTimeMatrix(null);
    setOptimalMeetingStation(null);
    setTravelTimeError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Moyori</h1>
          <p className="text-gray-600 mb-4">
            複数の最寄り駅から最適な待ち合わせ場所を見つけます
          </p>

          {/* Calculation Mode Selection */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={() => setCalculationMode('centroid')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                calculationMode === 'centroid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              地理的重心
            </button>
            <button
              onClick={() => setCalculationMode('travelTime')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                calculationMode === 'travelTime'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              等しい移動時間
            </button>
          </div>

          <p className="text-sm text-gray-500">
            {calculationMode === 'centroid'
              ? '選択された駅の地理的重心から最寄り駅を計算します'
              : '各駅からの移動時間が等しくなる待ち合わせ場所を計算します'}
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <StationSelector
            selectedStations={selectedStations}
            onStationSelect={handleStationSelect}
            onStationRemove={handleStationRemove}
          />

          {selectedStations.length > 0 && (
            <div className="mt-4">
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                すべてクリア
              </button>
            </div>
          )}
        </div>

        {selectedStations.length >= 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">計算結果</h2>

            {calculationMode === 'centroid' && centroid && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      選択された駅の重心
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>緯度: {centroid.lat.toFixed(6)}</p>
                      <p>経度: {centroid.lng.toFixed(6)}</p>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-md font-medium mb-1">住所</h4>
                      {addressLoading ? (
                        <p className="text-sm text-gray-500">住所を取得中...</p>
                      ) : centroidAddress ? (
                        <div className="text-sm text-gray-600">
                          <p>
                            {centroidAddress.prefecture} {centroidAddress.city}
                            {centroidAddress.town && ` ${centroidAddress.town}`}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          住所を取得できませんでした
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">最寄りの駅</h3>
                    {nearestStation ? (
                      <div className="bg-blue-50 p-4 rounded-md">
                        <p className="text-xl font-bold text-blue-800">
                          {nearestStation.name}駅
                        </p>
                        <div className="text-sm text-gray-600 mt-1">
                          {nearestStation.line} ({nearestStation.prefecture})
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          <p>緯度: {nearestStation.lat.toFixed(6)}</p>
                          <p>経度: {nearestStation.lng.toFixed(6)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
                        <p className="text-orange-800 font-medium">
                          最寄り駅が見つかりませんでした
                        </p>
                        <p className="text-sm text-orange-700 mt-2">
                          選択された駅が離れすぎているため、重心付近に駅が存在しない可能性があります。
                          より近い場所にある駅を選択してみてください。
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {nearestStation ? (
                  <div className="mt-6 p-4 bg-green-50 rounded-md">
                    <p className="text-green-800 font-medium">
                      <span className="font-bold">{nearestStation.name}駅</span>
                      <span className="text-sm text-green-700 ml-2">
                        ({nearestStation.line} - {nearestStation.prefecture})
                      </span>
                      が最適な待ち合わせ場所です！
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                    <p className="text-yellow-800 font-medium">
                      重心は計算できましたが、その付近に駅が見つかりませんでした。
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      同じ地域や近い地域の駅を選択することをお勧めします。
                    </p>
                  </div>
                )}
              </>
            )}

            {calculationMode === 'travelTime' && (
              <>
                {travelTimeLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">移動時間を計算中...</p>
                    <p className="text-sm text-gray-500">
                      この処理には1-2分かかる場合があります
                    </p>
                  </div>
                ) : travelTimeError ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800 font-medium">エラー</p>
                    <p className="text-sm text-red-700 mt-1">
                      {travelTimeError}
                    </p>
                  </div>
                ) : optimalMeetingStation ? (
                  <>
                    <div className="bg-green-50 p-4 rounded-md">
                      <p className="text-xl font-bold text-green-800">
                        {optimalMeetingStation.station.name}駅
                      </p>
                      <div className="text-sm text-green-700 mt-1">
                        {optimalMeetingStation.station.line} (
                        {optimalMeetingStation.station.prefecture})
                      </div>
                      <div className="text-sm text-green-600 mt-2">
                        <p>
                          平均移動時間:{' '}
                          {Math.round(optimalMeetingStation.averageTravelTime)}
                          分
                        </p>
                        <p>
                          時間差: ±
                          {Math.round(
                            Math.sqrt(optimalMeetingStation.travelTimeVariance)
                          )}
                          分
                        </p>
                        {optimalMeetingStation.totalFare && (
                          <p>
                            合計交通費:{' '}
                            {Math.round(optimalMeetingStation.totalFare)}円
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-md font-medium mb-2">
                        各駅からの移動時間
                      </h4>
                      <div className="grid gap-2">
                        {optimalMeetingStation.travelTimes.map(
                          (travel, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-gray-50 p-3 rounded"
                            >
                              <span className="font-medium">
                                {travel.fromStation}
                              </span>
                              <span className="text-blue-600">
                                {travel.timeMinutes}分
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-green-50 rounded-md">
                      <p className="text-green-800 font-medium">
                        <span className="font-bold">
                          {optimalMeetingStation.station.name}駅
                        </span>
                        が等しい移動時間での最適な待ち合わせ場所です！
                      </p>
                    </div>
                  </>
                ) : null}
              </>
            )}

            {/* Map Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">地図表示</h3>
              <div className="mb-2 text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                選択された駅
                {calculationMode === 'centroid' && centroid && (
                  <>
                    <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 ml-4"></span>
                    重心
                  </>
                )}
                {((calculationMode === 'centroid' && nearestStation) ||
                  (calculationMode === 'travelTime' &&
                    optimalMeetingStation)) && (
                  <>
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 ml-4"></span>
                    推奨駅
                  </>
                )}
              </div>
              <Map
                selectedStations={selectedStations}
                centroid={calculationMode === 'centroid' ? centroid : null}
                nearestStation={
                  calculationMode === 'centroid'
                    ? nearestStation
                    : optimalMeetingStation?.station || null
                }
              />
            </div>
          </div>
        )}

        {selectedStations.length === 1 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              {calculationMode === 'centroid'
                ? '重心を計算するには、少なくとも2つの駅を選択してください。'
                : '移動時間を計算するには、少なくとも2つの駅を選択してください。'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
