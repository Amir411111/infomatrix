# ClothMatch

ClothMatch is a cross-platform wardrobe assistant built with Expo and React Native.
It helps users manage clothing items, build outfits, and get weather-aware recommendations.

## Features

- Add clothing items with photos (camera or gallery)
- Categorize items and manage your wardrobe
- Build outfits from saved items
- Save and browse created outfits
- Get recommendation hints based on weather conditions
- Use the app in multiple languages (English and Russian)

## Tech Stack

- React Native + Expo
- TypeScript
- Zustand (state management)
- AsyncStorage (local persistence)
- i18next + react-i18next (localization)
- NativeWind (Tailwind-style utility classes)
- Optional backend: Node.js + Express + MongoDB

## Project Structure

```text
infomatrix-main/
├── App.tsx
├── src/
│   ├── components/
│   ├── screens/
│   ├── services/
│   ├── store/
│   ├── i18n/
│   └── types/
├── server/
│   ├── index.js
│   ├── models/
│   └── routes/
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- Expo Go app (for running on a real device) or Android/iOS emulator

## Installation

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies (optional, for API + MongoDB):

```bash
npm run server:install
```

## Running the App

### Frontend (Expo)

```bash
npm start
```

Useful shortcuts/scripts:

```bash
npm run android
npm run ios
npm run web
```

### Backend (Express API)

```bash
npm run server
```

or

```bash
npm run server:dev
```

Backend default URL: `http://localhost:3000`

Health check: `http://localhost:3000/health`

## Backend Setup (MongoDB)

1. Create `server/.env`.
2. Add environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
NODE_ENV=development
```

If `MONGODB_URI` is missing, the backend will not start.

## API Notes

Main API routes are exposed under:

- `/api/wardrobe`
- `/api/outfits`

The frontend API base URL is configured in `src/services/config.ts`.

## Localization

Translation files are stored in:

- `src/i18n/en.json`
- `src/i18n/ru.json`

Language preference is saved locally via AsyncStorage.

## Additional Documentation

- `INSTALL.md` — setup and launch guide
- `DATABASE_SETUP.md` — MongoDB and backend integration guide
- `src/i18n/INTEGRATION_GUIDE.md` — i18n integration notes

