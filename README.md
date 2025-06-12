# ChargeMate Web Application

A modern, responsive web application for finding and reserving EV charging stations across Canada. Built with React, TypeScript, and Material-UI, offering real-time station availability, intelligent distance-based filtering, and seamless reservation management.

## �� Project Overview

ChargeMate is a comprehensive electric vehicle charging station locator that helps EV drivers find available charging stations within their area. The application provides an interactive map interface, real-time availability data, and allows users to reserve charging sessions in advance. The platform focuses on Canadian markets with support for CAD pricing and local station networks.

## ✨ Features

### 🗺️ **Interactive Map & Location Services**
- **Real-time User Location**: Automatic geolocation with fallback to Vancouver area
- **Interactive Map**: Powered by React Leaflet with OpenStreetMap tiles
- **Custom Station Markers**: Color-coded availability indicators (Available/Limited/Unavailable)
- **Distance-based Filtering**: Automatically filters stations within 100km radius
- **Smart Distance Calculation**: Displays distances in kilometers and meters with precise calculations

### 🔍 **Advanced Search & Filtering**
- **Text Search**: Search by station name or address
- **Proximity Sorting**: Stations automatically sorted by distance from user location
- **Real-time Filtering**: Instant results as you type
- **Geographic Boundaries**: Intelligent filtering to show only relevant nearby stations

### ⚡ **Station Information & Management**
- **Comprehensive Station Details**: Name, address, connector types, pricing, and amenities
- **Real-time Availability**: Live port availability with color-coded status indicators
- **Connector Type Support**: CHAdeMO, CCS, Type 2, Tesla Supercharger, and more
- **Pricing Information**: CAD pricing per kWh with transparent cost display
- **Station Ratings**: User ratings and reviews integration

### 📱 **Responsive Design**
- **Mobile-First Approach**: Optimized layouts for mobile, tablet, and desktop
- **Adaptive UI**: Different layouts for mobile (vertical stack) and desktop (side-by-side)
- **Touch-Friendly**: Optimized for touch interactions on mobile devices
- **Fast Performance**: Efficient rendering and data loading

### 🔐 **Authentication & User Management**
- **Secure Login**: Auth0 integration with Google OAuth support
- **Persistent Sessions**: JWT token management with automatic refresh
- **User Profiles**: Profile management and vehicle settings
- **Secure API Communication**: Protected endpoints with authentication headers

### 📅 **Reservation System**
- **Advanced Booking**: Date/time picker with availability checking
- **Connector Selection**: Choose specific connector types for reservations
- **Energy Estimation**: Estimate charging time and cost
- **Reservation Management**: View, modify, and cancel existing reservations
- **Session Tracking**: Monitor active and past charging sessions

## 🛠️ Installation Instructions

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Auth0 Account**: Required for authentication (free tier available)
- **Backend API**: EV Finder backend service running

### Step-by-Step Setup

1. **Clone and Navigate to Project**
   ```bash
   git clone <repository-url>
   cd Frontend/Frontend-web
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```bash
   # Auth0 Configuration
   VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-auth0-client-id
   
   # API Configuration
   VITE_API_BASE_URL=http://localhost:3000/api
   # For production: https://ev-finder-backend.onrender.com/api
   ```

4. **Auth0 Setup**
   - Create an Auth0 application (Single Page Application type)
   - Configure Allowed Callback URLs: `http://localhost:5173, https://yourdomain.com`
   - Configure Allowed Logout URLs: `http://localhost:5173, https://yourdomain.com`
   - Configure Allowed Web Origins: `http://localhost:5173, https://yourdomain.com`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   Open [http://localhost:5173](http://localhost:5173) in your browser

## 🚀 Usage

### Getting Started
1. **Login**: Use the welcome screen to authenticate with Auth0/Google
2. **Location Permission**: Allow location access for personalized results
3. **Explore Stations**: View nearby charging stations on the interactive map
4. **Search & Filter**: Use the search bar to find specific stations
5. **Make Reservations**: Click "Reserve" on any available station

### Using the Map
- **Pan & Zoom**: Navigate the map to explore different areas
- **Station Markers**: Click on colored markers to view station details
- **User Location**: Blue marker shows your current location
- **Popup Details**: Click markers for quick station information and reservation access

### Making Reservations
1. Click "Reserve" on any station card or map popup
2. Select your preferred date and time
3. Choose the appropriate connector type
4. Set your estimated energy requirements
5. Confirm your reservation details
6. Receive confirmation and add to calendar

### Managing Your Account
- **Profile**: Access via the user menu in the top navigation
- **Reservations**: View all upcoming, active, and past reservations
- **Settings**: Manage vehicle information and notification preferences

## 🔧 Technologies Used

### **Frontend Framework & Language**
- **React 19**: Latest version with concurrent features and improved performance
- **TypeScript**: Full type safety and enhanced developer experience
- **Vite**: Fast build tool with hot module replacement

### **UI Framework & Styling**
- **Material-UI (MUI) 7.1.0**: Modern React component library
- **Emotion**: CSS-in-JS styling solution integrated with MUI
- **MUI Icons**: Comprehensive icon library
- **Responsive Design**: Built-in responsive grid system

### **Authentication & Security**
- **Auth0**: Enterprise-grade authentication service
- **JWT Tokens**: Secure token-based authentication
- **Google OAuth**: Social login integration

### **Maps & Geolocation**
- **React Leaflet 5.0.0**: React wrapper for Leaflet mapping library
- **Leaflet 1.9.4**: Open-source interactive maps
- **OpenStreetMap**: Free, community-driven map data
- **Geolocation API**: Browser-based location services

### **HTTP & API Communication**
- **Axios 1.9.0**: Promise-based HTTP client
- **RESTful API**: Clean API integration with error handling
- **Real-time Data**: Live station availability updates

### **Date & Time Management**
- **MUI X Date Pickers**: Advanced date/time selection components
- **Day.js**: Lightweight date manipulation library
- **Timezone Support**: Proper handling of local times

### **Development & Testing**
- **ESLint**: Code quality and style enforcement
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing utilities
- **TypeScript ESLint**: TypeScript-specific linting rules

### **Build & Deployment**
- **Vite Build System**: Fast production builds
- **Render.com**: Cloud deployment platform
- **Environment Variables**: Secure configuration management

## 🧪 Testing Framework

### **Testing Technologies**
- **Jest 29.7.0**: JavaScript testing framework with built-in assertions
- **React Testing Library**: Utilities for testing React components
- **TypeScript Support**: Full TypeScript integration with ts-jest
- **jsdom Environment**: Browser-like testing environment for DOM testing
- **User Event Testing**: Realistic user interaction simulation

### **Test Structure**
```
src/tests/
├── setupTests.ts              # Global test setup and mocks
├── ApiService.test.ts         # API service unit tests
├── ChargerFinderPage.test.tsx # Map and station finder tests
├── EvChargerIcons.test.ts     # Custom icon component tests
├── utils.test.ts              # Utility function tests
└── deleteReservation.test.ts  # Delete reservation functionality tests
```

### **Running Tests**

#### **Development Testing**
```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=deleteReservation.test.ts

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD pipeline
npm run test:ci
```

#### **Test Coverage**
- **Target Coverage**: Minimum 80% code coverage
- **Current Coverage**: High coverage for critical paths
- **Coverage Reports**: Generated in `coverage/` directory
- **CI Integration**: Automated testing on pull requests

### **Key Test Suites**

#### **🗑️ Delete Reservation Tests (`deleteReservation.test.ts`)**
Comprehensive test suite covering reservation deletion functionality:

**API Integration Tests (8 tests)**
- ✅ **Successful deletion** - Verifies API call and response handling
- ✅ **Reservation not found** - Tests 404 error scenarios
- ✅ **Unauthorized deletion** - Tests 403 permission errors
- ✅ **Server errors** - Tests 500 internal server errors
- ✅ **Network errors** - Tests connectivity issues
- ✅ **Invalid reservation ID** - Tests input validation
- ✅ **Active reservation deletion** - Tests business rule enforcement
- ✅ **Empty reservation ID** - Tests edge cases

**UI Interaction Tests (4 tests)**
- ✅ **Delete button visibility** - Only shows for completed/cancelled reservations
- ✅ **Confirmation dialog** - Tests dialog open/close state management
- ✅ **Confirmation message** - Verifies correct station name display
- ✅ **Success message auto-hide** - Tests 3-second auto-hide functionality

**Error Handling Tests (3 tests)**
- ✅ **Error message formatting** - Tests user-friendly error display
- ✅ **Status validation** - Tests which reservations can be deleted
- ✅ **List refresh** - Tests UI refresh after successful deletion

#### **🗺️ Map & Station Tests (`ChargerFinderPage.test.tsx`)**
- Distance calculation accuracy
- Station filtering and sorting
- Map marker rendering
- Search functionality
- Location services integration

#### **🔌 API Service Tests (`ApiService.test.ts`)**
- Authentication handling
- Station data fetching
- Reservation creation/management
- Error response handling
- Network failure resilience

#### **⚙️ Utility Function Tests (`utils.test.ts`)**
- Distance calculations (kilometers/meters)
- Coordinate transformations
- Currency formatting
- Address formatting
- Availability color coding

### **Test Development Guidelines**

#### **Writing Tests**
- Use **Arrange-Act-Assert** pattern for clarity
- Mock external dependencies (API calls, browser APIs)
- Test both happy path and error scenarios
- Include edge cases and boundary conditions
- Write descriptive test names that explain the scenario

#### **Test Categories**
1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: Component interactions and API integration
3. **UI Tests**: User interaction flows and state management
4. **Error Handling Tests**: Failure scenarios and recovery

#### **Mocking Strategy**
- **API Calls**: Mocked with controlled responses
- **Browser APIs**: Geolocation, localStorage, etc.
- **External Libraries**: Material-UI components when needed
- **Environment Variables**: Controlled test configuration

#### **Test Utilities**
```typescript
// Example test helper functions
renderWithRouter()     // Wraps components with React Router
mockApiResponse()      // Creates standardized API mocks
setupUserEvent()       // Configures user interaction testing
waitForLoadingToFinish() // Async state management testing
```

### **Continuous Integration**
- **Automated Testing**: All tests run on pull requests
- **Coverage Enforcement**: Minimum coverage thresholds
- **Type Checking**: TypeScript compilation validation
- **Linting**: Code quality checks with ESLint
- **Build Verification**: Ensures production builds succeed

### **Testing Best Practices**
- Tests are written alongside feature development
- Critical user flows have comprehensive test coverage
- Error scenarios are thoroughly tested
- Tests serve as living documentation
- Performance-critical paths are tested for efficiency

## 🚀 Future Improvements

### **Enhanced Features**
- **Route Planning**: Multi-stop trip planning with charging stops
- **Real-time Notifications**: Push notifications for reservation updates
- **Payment Integration**: In-app payment processing with Stripe/PayPal
- **Energy Management**: Battery level tracking and charging optimization
- **Social Features**: User reviews, ratings, and community features

### **Technical Enhancements**
- **Progressive Web App (PWA)**: Offline functionality and app installation
- **Advanced Caching**: Service worker implementation for faster loading
- **WebSocket Integration**: Real-time station availability updates
- **Machine Learning**: Predictive availability based on usage patterns
- **Performance Optimization**: Code splitting and lazy loading

### **User Experience**
- **Dark Mode**: Theme switching for better accessibility
- **Multi-language Support**: Internationalization (i18n) for French/English
- **Accessibility**: Enhanced screen reader support and keyboard navigation
- **Voice Integration**: Voice commands for hands-free operation
- **Augmented Reality**: AR station finding using device camera

### **Platform Expansion**
- **Mobile Apps**: Native iOS and Android applications
- **Fleet Management**: Business dashboard for fleet operators
- **API Expansion**: Public API for third-party integrations
- **Smart City Integration**: Integration with municipal charging networks
- **Cross-platform Sync**: Sync preferences across devices

### **Business Features**
- **Subscription Plans**: Premium features for frequent users
- **Corporate Accounts**: Business expense tracking and reporting
- **Loyalty Program**: Rewards for frequent charging
- **Partner Network**: Integration with major charging networks
- **Analytics Dashboard**: Usage statistics and insights

## 📜 Available Scripts

- **`npm run dev`**: Start development server with hot reload
- **`npm run build`**: Build optimized production bundle
- **`npm run preview`**: Preview production build locally
- **`npm run lint`**: Run ESLint for code quality checks
- **`npm run test`**: Run Jest test suite
- **`npm run test:watch`**: Run tests in watch mode
- **`npm run test:coverage`**: Generate test coverage report
- **`npm run test:ci`**: Run tests for CI/CD pipeline

## 🚀 Deployment

### **Production Build**
```bash
npm run build
```
Build artifacts are stored in the `dist/` directory.

### **Environment Variables for Production**
```bash
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_API_BASE_URL=https://ev-finder-backend.onrender.com/api
```

### **Deployment Platforms**
- **Render.com** (Current): Configured with `render.yaml`
- **Vercel**: Optimal for React applications
- **Netlify**: Great for static site deployment
- **AWS S3 + CloudFront**: Enterprise-grade hosting
- **Any Static Hosting**: Compatible with standard static hosting

### **Database & Backend**
- **MongoDB**: Production database hosted on MongoDB Atlas
- **Backend API**: Node.js/Express backend deployed on Render.com
- **Environment Configuration**: Secure environment variable management

## 🤝 Contributing

1. **Fork the Repository**: Create your own fork of the project
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your feature or bug fix
4. **Add Tests**: Include tests for new functionality
5. **Commit Changes**: `git commit -m 'Add amazing feature'`
6. **Push to Branch**: `git push origin feature/amazing-feature`
7. **Submit Pull Request**: Create a PR with detailed description

### **Development Standards**
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use ESLint and Prettier for code formatting
- Write clear, descriptive commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🆘 Support & Contact

- **Documentation**: Check this README and inline code comments
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Email**: Contact the development team for urgent matters

---

**Built with ❤️ for the EV community in Canada 🇨🇦**
