import React from 'react';
import { Station } from '../data/stations';

interface StationSelectorProps {
  stations: Station[];
  selectedStations: Station[];
  onStationSelect: (station: Station) => void;
  onStationRemove: (stationId: string) => void;
}

const StationSelector: React.FC<StationSelectorProps> = ({
  stations,
  selectedStations,
  onStationSelect,
  onStationRemove,
}) => {
  const availableStations = stations.filter(
    station => !selectedStations.some(selected => selected.id === station.id)
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">駅を選択</h3>
        <select
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => {
            const selectedStation = stations.find(s => s.id === e.target.value);
            if (selectedStation) {
              onStationSelect(selectedStation);
              e.target.value = '';
            }
          }}
          value=""
        >
          <option value="">駅を選択してください</option>
          {availableStations.map(station => (
            <option key={station.id} value={station.id}>
              {station.name}
            </option>
          ))}
        </select>
      </div>

      {selectedStations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">選択された駅</h3>
          <div className="space-y-2">
            {selectedStations.map(station => (
              <div
                key={station.id}
                className="flex items-center justify-between p-2 bg-blue-50 rounded-md"
              >
                <span className="font-medium">{station.name}</span>
                <button
                  onClick={() => onStationRemove(station.id)}
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

export default StationSelector;