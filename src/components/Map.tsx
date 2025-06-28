import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import L from 'leaflet';
import { Station } from '../data/stations';
import { Coordinate } from '../utils/calculations';

interface MapProps {
  selectedStations: Station[];
  centroid: Coordinate;
  nearestStation: Station | null;
}

// カスタムマーカーアイコンを定義
const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
    "></div>`,
    className: 'custom-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const stationIcon = createCustomIcon('#3B82F6'); // 青色（選択された駅）
const centroidIcon = createCustomIcon('#EF4444'); // 赤色（重心）
const nearestIcon = createCustomIcon('#10B981'); // 緑色（最寄り駅）

// 地図の範囲を自動調整するコンポーネント
const MapBounds: React.FC<{ bounds: LatLngBounds }> = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, bounds]);

  return null;
};

const Map: React.FC<MapProps> = ({
  selectedStations,
  centroid,
  nearestStation,
}) => {
  // すべてのマーカーを含む境界を計算
  const bounds = useMemo(() => {
    const latLngs: [number, number][] = [];

    // 選択された駅の座標を追加
    selectedStations.forEach((station) => {
      latLngs.push([station.lat, station.lng]);
    });

    // 重心の座標を追加
    latLngs.push([centroid.lat, centroid.lng]);

    // 最寄り駅の座標を追加（存在する場合）
    if (nearestStation) {
      latLngs.push([nearestStation.lat, nearestStation.lng]);
    }

    return new LatLngBounds(latLngs);
  }, [selectedStations, centroid, nearestStation]);

  // 地図の初期中心点（重心を使用）
  const center: [number, number] = [centroid.lat, centroid.lng];

  return (
    <div className="w-full h-64 md:h-96 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* 地図の境界を自動調整 */}
        <MapBounds bounds={bounds} />

        {/* 選択された駅のマーカー */}
        {selectedStations.map((station, index) => (
          <Marker
            key={`station-${index}`}
            position={[station.lat, station.lng]}
            icon={stationIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>{station.name}駅</strong>
                <br />
                {station.line}
                <br />
                {station.prefecture}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 重心のマーカー */}
        <Marker position={[centroid.lat, centroid.lng]} icon={centroidIcon}>
          <Popup>
            <div className="text-sm">
              <strong>重心</strong>
              <br />
              緯度: {centroid.lat.toFixed(6)}
              <br />
              経度: {centroid.lng.toFixed(6)}
            </div>
          </Popup>
        </Marker>

        {/* 最寄り駅のマーカー */}
        {nearestStation && (
          <Marker
            position={[nearestStation.lat, nearestStation.lng]}
            icon={nearestIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>最寄り駅: {nearestStation.name}駅</strong>
                <br />
                {nearestStation.line}
                <br />
                {nearestStation.prefecture}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default Map;
