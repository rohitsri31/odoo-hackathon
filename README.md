# StockSense mobile app

StockSense is an Expo / React Native inventory app backed by an Express, TypeScript, and MongoDB API. The mobile app talks to the API over HTTP; the API is the only service that connects directly to MongoDB. Stock can only change through a validated operation so its ledger remains in sync.

## Connect MongoDB and run locally

1. Start MongoDB locally as a single-node replica set, or create an Atlas cluster. MongoDB transactions require replica-set support.
2. Copy `server/.env.example` to `server/.env`. Set `MONGO_URI` to your local replica-set URI or Atlas URI, and replace `JWT_SECRET` with a long random value. For Atlas, create a database user and allow the machine running the API in Atlas Network Access.
3. From `server/`, run `npm install`, `npm run dev`, then `npm run seed` in another terminal. The demo login is `demo@stocksense.app` / `StockSense123!`.
4. Copy the root `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the API address reachable from your phone. Use `http://localhost:4000` for an iOS simulator, `http://10.0.2.2:4000` for the Android emulator, or your computer’s LAN IP (for example `http://192.168.1.20:4000`) for a physical phone on the same Wi-Fi.
5. From the project root run `npm install` and `npx expo start`, then open the app in Expo Go or a development build. Do not put `MONGO_URI` or `JWT_SECRET` in the app’s `.env`; `EXPO_PUBLIC_` values are bundled into the app and are public.

The seed script creates two warehouses, eight products, validated opening receipts and a transfer, plus draft receipts, deliveries, transfers, and an adjustment. It creates demo data only when the demo account has no operations.

## MongoDB connection examples

Local replica set:

```env
MONGO_URI=mongodb://localhost:27017/stocksense?replicaSet=rs0
```

MongoDB Atlas (replace the placeholders; URL-encode special characters in the password):

```env
MONGO_URI=mongodb+srv://<db-user>:<db-password>@<cluster-host>/stocksense?retryWrites=true&w=majority
```

Keep either URI in `server/.env` only. Never ship MongoDB credentials in the mobile application.

## Deploy

- **API:** Deploy `server/` to Render. Build command: `npm install && npm run build`; start command: `npm start`. Configure `MONGO_URI` for Atlas and a strong `JWT_SECRET` in Render environment variables. Atlas must permit connections from the deployed API.
- **Mobile app:** Set `EXPO_PUBLIC_API_URL` to the public API origin when creating an EAS build. The app calls endpoints under `/api`; the API server should use HTTPS in production. Build iOS and Android with EAS Build.

Demo OTPs for password reset are returned by the API and logged to the server console. Real email/SMS delivery, role permissions, and offline support are future work.
