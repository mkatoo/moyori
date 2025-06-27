import React, { useState, useMemo } from 'react';
import StationSelector from './components/StationSelector';
import { stations, Station } from './data/stations';
import { calculateCentroid, findNearestStation } from './utils/calculations';

function App() {
  const [selectedStations, setSelectedStations] = useState<Station[]>([]);

  const handleStationSelect = (station: Station) => {
    setSelectedStations(prev => [...prev, station]);
  };

  const handleStationRemove = (stationId: string) => {
    setSelectedStations(prev => prev.filter(s => s.id !== stationId));
  };

  const centroid = useMemo(() => {
    if (selectedStations.length === 0) return null;
    try {
      return calculateCentroid(selectedStations);
    } catch {
      return null;
    }
  }, [selectedStations]);

  const nearestStation = useMemo(() => {
    if (!centroid) return null;
    try {
      return findNearestStation(centroid, stations);
    } catch {
      return null;
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
            stations={stations}
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

        {selectedStations.length >= 2 && centroid && nearestStation && (
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
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-xl font-bold text-blue-800">
                    {nearestStation.name}駅
                  </p>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>緯度: {nearestStation.lat.toFixed(6)}</p>
                    <p>経度: {nearestStation.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-md">
              <p className="text-green-800 font-medium">
                <span className="font-bold">{nearestStation.name}駅</span>が最適な待ち合わせ場所です！
              </p>
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