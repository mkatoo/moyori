import { Station } from '../data/stations';

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

export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // 地球の半径（km）
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

export function findNearestStation(centroid: Coordinate, allStations: Station[]): Station {
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