# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start development server
- `npm run build` - Build production bundle
- `npm test` - Run tests
- `npm install` - Install dependencies
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted

## Code Quality Enforcement

**MANDATORY**: At the end of any coding session, you MUST run the following commands in order and ensure they all pass:

1. `npm test` - All tests must pass
2. `npm run lint` - ESLint must pass with no errors
3. `npm run format` - Code must be properly formatted

**Do not consider the task complete until all three commands pass successfully.** If any command fails, fix the issues before finishing.

## Project Overview

Moyori is a React application that helps find optimal meeting locations by calculating the centroid of multiple train stations. Users select stations from different prefectures and routes, and the app determines the nearest station to the calculated centroid.

## Architecture

### Core Components
- **App.tsx** - Main application component managing selected stations and centroid calculation
- **StationSelector.tsx** - Main station selection interface with tabbed navigation (free text search + three-level selection)
- **StationSearch.tsx** - Free text search component with debounced API calls and result filtering
- **Map.tsx** - Interactive Leaflet map component with color-coded markers and auto-bounds fitting

### Data Layer
- **stations.ts** - Station/Route/Prefecture interfaces and static prefecture list
- **api.ts** - HeartRails Express and Geo API integration for fetching routes/stations, finding nearest stations, and reverse geocoding
- **constants.ts** - Application constants including maximum station limit (5) and search configurations

### Utilities
- **calculations.ts** - Geometric calculations including centroid computation and Haversine distance formula

### External Dependencies
- Uses HeartRails Express API (`express.heartrails.com/api/json`) for Japanese railway data
- Uses HeartRails Geo API (`geoapi.heartrails.com/api/json`) for reverse geocoding and address lookup
- React 18 with TypeScript
- Leaflet and React-Leaflet for interactive maps
- Tailwind CSS for styling
- Standard Create React App configuration

## Key Technical Details

- **Station Selection**: Maximum 5 stations can be selected at once (defined in constants.ts)
- **Dual Selection Modes**: Tabbed interface with free text search and three-level cascading selection
- **Search Optimization**: Debounced search with 300ms delay, maximum 20 results displayed
- **Centroid Calculation**: Requires minimum 2 stations, uses simple arithmetic mean of coordinates
- **Distance Calculations**: Haversine formula with Earth radius of 6371km
- **API Integration**: 
  - HeartRails Express API for railway data and nearest station lookup
  - HeartRails Geo API for reverse geocoding and address display
- **API Response Mapping**: Station coordinates (x=longitude, y=latitude)
- **Map Features**: 
  - Color-coded markers (blue=selected, red=centroid, green=nearest)
  - Auto-bounds fitting to show all relevant points
  - Interactive popups with detailed station information
- **Error Handling**: Comprehensive fallbacks for API failures and missing data
- **Duplicate Prevention**: Stations filtered by name+line combination
- **User Interface**: All text is in Japanese with responsive design

## Documentation Maintenance

- **README.md Updates**: Always check if README.md content reflects the current implementation when making significant changes to the codebase
- **Key Areas to Monitor**: 
  - Project structure changes (new/removed files)
  - New features or functionality
  - Technology stack updates (new dependencies)
  - API changes or integrations
  - Development commands or scripts
- **When to Update**: After adding new components, changing architecture, updating dependencies, or modifying core functionality