import React, { useState, useEffect, useMemo } from 'react';
import { Station } from '../data/stations';
import { api } from '../utils/api';
import { MAX_STATIONS } from '../constants';

interface StationSearchProps {
  selectedStations: Station[];
  onStationSelect: (station: Station) => void;
  onStationRemove: (stationName: string) => void;
}

const StationSearch: React.FC<StationSearchProps> = ({
  selectedStations,
  onStationSelect,
  onStationRemove,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (query.trim()) {
          setLoading(true);
          try {
            const results = await api.searchStationsByName(query);
            setSearchResults(results);
          } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
          } finally {
            setLoading(false);
          }
        } else {
          setSearchResults([]);
        }
      }, 300);
    };
  }, []);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const availableResults = searchResults.filter(
    (station) =>
      !selectedStations.some(
        (selected) =>
          selected.name === station.name && selected.line === station.line
      )
  );

  const handleStationClick = (station: Station) => {
    if (selectedStations.length < MAX_STATIONS) {
      onStationSelect(station);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">駅名で検索</h3>
        <div className="relative">
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            placeholder="駅名を入力してください（例：新宿、渋谷）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={selectedStations.length >= MAX_STATIONS}
          />
          {loading && (
            <div className="absolute right-2 top-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
        {selectedStations.length >= MAX_STATIONS && (
          <p className="text-sm text-orange-600 mt-1">
            最大{MAX_STATIONS}
            駅まで選択できます。追加するには既存の駅を削除してください。
          </p>
        )}
      </div>

      {searchQuery && (
        <div>
          {loading ? (
            <p className="text-sm text-gray-500">検索中...</p>
          ) : availableResults.length > 0 ? (
            <div>
              <h4 className="text-md font-medium mb-2">検索結果</h4>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {availableResults.slice(0, 20).map((station, index) => (
                  <button
                    key={`${station.name}-${station.line}-${index}`}
                    className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleStationClick(station)}
                    disabled={selectedStations.length >= MAX_STATIONS}
                  >
                    <div className="font-medium">{station.name}駅</div>
                    <div className="text-sm text-gray-600">
                      {station.line} ({station.prefecture})
                    </div>
                  </button>
                ))}
              </div>
              {availableResults.length > 20 && (
                <p className="text-sm text-gray-500 mt-2">
                  検索結果が多すぎます。より具体的なキーワードで検索してください。
                </p>
              )}
            </div>
          ) : searchQuery.length > 0 && !loading ? (
            <p className="text-sm text-gray-500">
              「{searchQuery}」に一致する駅が見つかりませんでした。
            </p>
          ) : null}
        </div>
      )}

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
  );
};

export default StationSearch;
