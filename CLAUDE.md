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

**Important**: After making code changes, always run `npm run lint` and `npm run format` to ensure code quality and consistent formatting.

## Project Overview

Moyori is a React application that helps find optimal meeting locations by calculating the centroid of multiple train stations. Users select stations from different prefectures and routes, and the app determines the nearest station to the calculated centroid.

## Architecture

### Core Components
- **App.tsx** - Main application component managing selected stations and centroid calculation
- **StationSelector.tsx** - Three-level cascading selection interface (prefecture → route → station)

### Data Layer
- **stations.ts** - Station/Route/Prefecture interfaces and static prefecture list
- **api.ts** - HeartRails Express API integration for fetching routes/stations and finding nearest stations

### Utilities
- **calculations.ts** - Geometric calculations including centroid computation and Haversine distance formula

### External Dependencies
- Uses HeartRails Express API (`express.heartrails.com/api/json`) for Japanese railway data
- React 18 with TypeScript
- Tailwind CSS for styling
- Standard Create React App configuration

## Key Technical Details

- Maximum 5 stations can be selected at once
- Centroid calculation requires minimum 2 stations
- Distance calculations use Haversine formula with Earth radius of 6371km
- API responses map station coordinates (x=longitude, y=latitude)
- Error handling includes fallbacks for API failures and missing data
- All text is in Japanese

## Documentation Maintenance

- **README.md Updates**: Always check if README.md content reflects the current implementation when making significant changes to the codebase
- **Key Areas to Monitor**: 
  - Project structure changes (new/removed files)
  - New features or functionality
  - Technology stack updates (new dependencies)
  - API changes or integrations
  - Development commands or scripts
- **When to Update**: After adding new components, changing architecture, updating dependencies, or modifying core functionality