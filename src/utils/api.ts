import { Route, Station } from '../data/stations';

const API_BASE = 'https://express.heartrails.com/api/json';

export interface HeartRailsRouteResponse {
  response: {
    line: string[];
  };
}

export interface HeartRailsStationResponse {
  response: {
    station: Array<{
      name: string;
      prefecture: string;
      line: string;
      x: string;
      y: string;
    }>;
  };
}

export interface HeartRailsNearestResponse {
  response: {
    station: Array<{
      name: string;
      prefecture: string;
      line: string;
      distance: string;
      x: string;
      y: string;
    }>;
  };
}

export const api = {
  async getRoutes(prefecture: string): Promise<Route[]> {
    try {
      const response = await fetch(
        `${API_BASE}?method=getLines&prefecture=${encodeURIComponent(prefecture)}`
      );
      const data: HeartRailsRouteResponse = await response.json();

      if (!data.response?.line) {
        return [];
      }

      return data.response.line.map((line) => ({
        name: line,
      }));
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      return [];
    }
  },

  async getStations(line: string): Promise<Station[]> {
    try {
      const response = await fetch(
        `${API_BASE}?method=getStations&line=${encodeURIComponent(line)}`
      );
      const data: HeartRailsStationResponse = await response.json();

      if (!data.response?.station) {
        return [];
      }

      return data.response.station.map((station) => ({
        name: station.name,
        lat: parseFloat(station.y),
        lng: parseFloat(station.x),
        prefecture: station.prefecture,
        line: station.line,
      }));
    } catch (error) {
      console.error('Failed to fetch stations:', error);
      return [];
    }
  },

  async getNearestStation(lat: number, lng: number): Promise<Station | null> {
    try {
      const response = await fetch(
        `${API_BASE}?method=getStations&x=${lng}&y=${lat}`
      );
      const data: HeartRailsNearestResponse = await response.json();

      if (!data.response?.station || data.response.station.length === 0) {
        return null;
      }

      const nearest = data.response.station[0];
      return {
        name: nearest.name,
        lat: parseFloat(nearest.y),
        lng: parseFloat(nearest.x),
        prefecture: nearest.prefecture,
        line: nearest.line,
      };
    } catch (error) {
      console.error('Failed to fetch nearest station:', error);
      return null;
    }
  },
};
