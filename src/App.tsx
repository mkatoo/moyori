import React, { useState, useMemo, useEffect } from 'react';
import StationSelector from './components/StationSelector';
import Map from './components/Map';
import { Station } from './data/stations';
import { calculateCentroid } from './utils/calculations';
import { api } from './utils/api';
import { MAX_STATIONS } from './constants';

function App() {
  const [selectedStations, setSelectedStations] = useState<Station[]>([]);
  const [nearestStation, setNearestStation] = useState<Station | null>(null);

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

  const clearAll = () => {
    setSelectedStations([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Moyori</h1>
          <p className="text-gray-600">
            複数の最寄り駅から重心を計算し、最適な待ち合わせ場所を見つけます
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

        {selectedStations.length >= 2 && centroid && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">計算結果</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">選択された駅の重心</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>緯度: {centroid.lat.toFixed(6)}</p>
                  <p>経度: {centroid.lng.toFixed(6)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">最寄りの駅</h3>
                {nearestStation ? (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-xl font-bold text-blue-800">
                      {nearestStation.name}駅
                    </p>
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

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">地図表示</h3>
              <div className="mb-2 text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                選択された駅
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 ml-4"></span>
                重心
                {nearestStation && (
                  <>
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 ml-4"></span>
                    最寄り駅
                  </>
                )}
              </div>
              <Map
                selectedStations={selectedStations}
                centroid={centroid}
                nearestStation={nearestStation}
              />
            </div>
          </div>
        )}

        {selectedStations.length === 1 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              重心を計算するには、少なくとも2つの駅を選択してください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
