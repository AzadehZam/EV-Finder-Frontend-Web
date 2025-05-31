# EV Finder Web Application

A modern web application for finding and reserving EV charging stations, built with React, TypeScript, and Material-UI.

## Features

- **Authentication**: Secure login with Auth0 and Google OAuth
- **Charger Finder**: Interactive map with nearby charging stations
- **Reservations**: Book, manage, and track charging sessions
- **Profile Management**: User profile and settings
- **Real-time Data**: Live availability and pricing information
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Framework**: Material-UI (MUI)
- **Authentication**: Auth0
- **Maps**: React Leaflet with OpenStreetMap
- **Date/Time**: MUI X Date Pickers with Day.js
- **HTTP Client**: Axios
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Auth0 account (configured for web application)
- Backend API running (see Backend directory)

### Installation

1. Clone the repository and navigate to the web frontend:
```bash
cd Frontend/Frontend-web
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env file with your configuration
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_API_BASE_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LoadingScreen.tsx
│   └── MainLayout.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/              # Main application pages
│   ├── WelcomePage.tsx
│   ├── ChargerFinderPage.tsx
│   ├── ReservationsPage.tsx
│   ├── ProfilePage.tsx
│   └── ReservationPage.tsx
├── services/           # API and external services
│   └── api.ts
├── config/             # Configuration files
│   └── auth0.ts
└── App.tsx             # Main application component
```

## Key Features

### Authentication Flow
- Welcome screen with Auth0 login
- Persistent sessions with JWT tokens
- Automatic token refresh and logout

### Charger Finder
- Interactive map with user location
- Search and filter charging stations
- Real-time availability status
- Distance calculation and directions

### Reservation Management
- Book charging sessions with date/time selection
- View upcoming, active, and past reservations
- Cancel or modify reservations
- Start charging sessions remotely

### User Profile
- View and edit profile information
- Manage vehicle settings
- Notification preferences
- Help and support access

## API Integration

The web app connects to the same backend API as the mobile application:

- **Development**: `http://localhost:3000/api`
- **Production**: `https://ev-finder-backend.onrender.com/api`

### Key Endpoints
- `POST /users/auth0` - Authenticate with Auth0
- `GET /users/profile` - Get user profile
- `GET /stations/nearby` - Find nearby charging stations
- `POST /reservations` - Create new reservation
- `GET /reservations` - Get user reservations

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Material-UI design system
- Responsive design principles

## Deployment

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Environment Variables

For production deployment, configure:

- `VITE_AUTH0_DOMAIN` - Your Auth0 domain
- `VITE_AUTH0_CLIENT_ID` - Your Auth0 client ID
- `VITE_API_BASE_URL` - Backend API URL

### Deployment Platforms

The app can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Auth0 Configuration

Configure your Auth0 application:

1. **Application Type**: Single Page Application
2. **Allowed Callback URLs**: `http://localhost:5173, https://yourdomain.com`
3. **Allowed Logout URLs**: `http://localhost:5173, https://yourdomain.com`
4. **Allowed Web Origins**: `http://localhost:5173, https://yourdomain.com`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team
