import React, { useState, useEffect } from 'react';
import { Station, Route, prefectures } from '../data/stations';
import { api } from '../utils/api';
import { MAX_STATIONS } from '../constants';
import StationSearch from './StationSearch';

interface StationSelectorProps {
  selectedStations: Station[];
  onStationSelect: (station: Station) => void;
  onStationRemove: (stationName: string) => void;
}

const StationSelector: React.FC<StationSelectorProps> = ({
  selectedStations,
  onStationSelect,
  onStationRemove,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'browse'>('search');
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedPrefecture) {
      setLoading(true);
      api
        .getRoutes(selectedPrefecture)
        .then(setRoutes)
        .finally(() => setLoading(false));
      setSelectedRoute('');
      setStations([]);
    } else {
      setRoutes([]);
      setSelectedRoute('');
      setStations([]);
    }
  }, [selectedPrefecture]);

  useEffect(() => {
    if (selectedRoute) {
      setLoading(true);
      api
        .getStations(selectedRoute)
        .then(setStations)
        .finally(() => setLoading(false));
    } else {
      setStations([]);
    }
  }, [selectedRoute]);

  const availableStations = stations.filter(
    (station) =>
      !selectedStations.some((selected) => selected.name === station.name)
  );

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('search')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            フリーワード検索
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'browse'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            都道府県・路線から選択
          </button>
        </nav>
      </div>

      {activeTab === 'search' ? (
        <StationSearch
          selectedStations={selectedStations}
          onStationSelect={onStationSelect}
          onStationRemove={onStationRemove}
        />
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">都道府県を選択</h3>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedPrefecture}
              onChange={(e) => setSelectedPrefecture(e.target.value)}
            >
              <option value="">都道府県を選択してください</option>
              {prefectures.map((prefecture) => (
                <option key={prefecture.name} value={prefecture.name}>
                  {prefecture.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">路線を選択</h3>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              disabled={!selectedPrefecture || loading}
            >
              <option value="">
                {!selectedPrefecture
                  ? '都道府県を先に選択してください'
                  : '路線を選択してください'}
              </option>
              {routes.map((route) => (
                <option key={route.name} value={route.name}>
                  {route.name}
                </option>
              ))}
            </select>
            {loading && (
              <p className="text-sm text-gray-500 mt-1">読み込み中...</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">駅を選択</h3>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              onChange={(e) => {
                const selectedStation = stations.find(
                  (s) => s.name === e.target.value
                );
                if (selectedStation) {
                  onStationSelect(selectedStation);
                  e.target.value = '';
                }
              }}
              value=""
              disabled={
                !selectedRoute ||
                loading ||
                selectedStations.length >= MAX_STATIONS
              }
            >
              <option value="">
                {!selectedRoute
                  ? '路線を先に選択してください'
                  : '駅を選択してください'}
              </option>
              {availableStations.map((station) => (
                <option
                  key={`${station.name}-${station.line}`}
                  value={station.name}
                >
                  {station.name}
                </option>
              ))}
            </select>
            {loading && (
              <p className="text-sm text-gray-500 mt-1">読み込み中...</p>
            )}
            {selectedStations.length >= MAX_STATIONS && (
              <p className="text-sm text-orange-600 mt-1">
                最大{MAX_STATIONS}
                駅まで選択できます。追加するには既存の駅を削除してください。
              </p>
            )}
          </div>

          {selectedStations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">選択された駅</h3>
              <div className="space-y-2">
                {selectedStations.map((station, index) => (
                  <div
                    key={`${station.name}-${station.line}-${index}`}
                    className="flex items-center justify-between p-2 bg-blue-50 rounded-md"
                  >
                    <div>
                      <span className="font-medium">{station.name}駅</span>
                      <div className="text-sm text-gray-600">
                        {station.line} ({station.prefecture})
                      </div>
                    </div>
                    <button
                      onClick={() => onStationRemove(station.name)}
                      className="px-2 py-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StationSelector;
