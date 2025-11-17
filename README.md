# 🚀 SkyGuard - Disaster Response Flight Coordinator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

SkyGuard is a real-time disaster response application that tracks active flights near natural disasters and earthquakes worldwide. It combines multiple public APIs to provide critical information for emergency response coordination, flight safety, and disaster management.

## 🎯 Features

- **Real-time Flight Tracking**: Monitor all active flights worldwide using OpenSky Network API
- **Disaster Monitoring**: Track earthquakes (USGS) and natural events (NASA EONET)
  - Earthquakes with magnitude filtering
  - Wildfires, storms, volcanoes, floods, and more
- **Proximity Analysis**: Identify flights within configurable radius of disaster zones
- **Risk Assessment**: Automatic severity classification (high/medium/low) based on distance
- **Airport Impact Analysis**: Determine affected airports near disaster areas
- **Auto-refresh**: Configurable real-time data updates
- **Search & Filter**: Search flights by callsign, origin country, or coordinates
- **Load Balanced**: Production-ready with Nginx load balancer configuration
- **Responsive UI**: Modern Next.js interface with interactive maps

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Components**: Radix UI, Shadcn/ui
- **Maps**: Leaflet
- **HTTP Client**: Axios
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Middleware**: CORS, Compression, Body Parser
- **Scheduling**: node-cron
- **HTTP Client**: Axios

### APIs Used
- **[OpenSky Network](https://opensky-network.org/)**: Real-time flight data
- **[USGS Earthquake API](https://earthquake.usgs.gov/)**: Global earthquake data
- **[NASA EONET](https://eonet.gsfc.nasa.gov/)**: Natural disaster events

### Deployment
- **Web Servers**: Ubuntu 20.04+ with systemd
- **Load Balancer**: Nginx
- **Process Management**: systemd services
- **SSL/TLS**: Let's Encrypt (optional)

## 📋 Prerequisites

- **Node.js**: Version 18.x or 20.x (LTS recommended)
- **npm**: Version 8.x or higher
- **Git**: For cloning the repository
- **Ubuntu Server**: 20.04 or newer (for deployment)

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/therealigor007/skyguard.git
cd skyguard
```

### 2. Backend Setup

```bash
cd skyguard-bff

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and configure variables (optional - defaults work for development)
nano .env

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../skyguard-client

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local (update API URL if needed)
nano .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Verify Installation

Open your browser and navigate to:
- Frontend: `http://localhost:3000`
- Backend Health: `http://localhost:5000/health`

## 🌐 Environment Variables

### Backend (.env)

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Settings (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000,http://your-domain.com

# Cache Settings (in seconds)
CACHE_DURATION=30

# API Rate Limits (in milliseconds)
OPENSKY_RATE_LIMIT=10000
USGS_RATE_LIMIT=60000
EONET_RATE_LIMIT=60000
```

### Frontend (.env.local)

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Auto-refresh interval (milliseconds)
NEXT_PUBLIC_REFRESH_INTERVAL=30000

# Map default settings
NEXT_PUBLIC_MAP_DEFAULT_LAT=0
NEXT_PUBLIC_MAP_DEFAULT_LON=0
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=2
```

## 📡 API Endpoints

### Flight Endpoints

```bash
GET /api/flights/all                    # Get all active flights
GET /api/flights/search?callsign=UAL    # Search by callsign
GET /api/flights/bounds?lat1=X&lon1=Y&lat2=Z&lon2=W  # Flights in bounding box
```

### Disaster Endpoints

```bash
GET /api/disasters/earthquakes?minMagnitude=4.5&days=7  # Get earthquakes
GET /api/disasters/events?category=wildfires&status=open  # Get natural events
GET /api/disasters/all?minMagnitude=4.5  # Get all disasters
```

### Analysis Endpoints

```bash
POST /api/analysis/flights-near-disaster  # Analyze flights near disasters
GET /api/analysis/affected-airports?disasters=[...]&radiusKm=100  # Affected airports
```

### Health Check

```bash
GET /health  # Server health check
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API reference.

## 🔧 Production Deployment

### Quick Deployment (3 Servers)

You need 3 Ubuntu servers:
- **web01**: Application server 1
- **web02**: Application server 2
- **lb01**: Load balancer

#### Initial Setup

```bash
cd deploy

# Run setup script (one-time setup)
./setup-servers.sh <web01_ip> <web02_ip> <lb01_ip>
```

#### Deploy Updates

```bash
# Deploy latest code to all servers
./deploy.sh <web01_ip> <web02_ip> <lb01_ip>
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment guide.

## 🧪 Testing

### Backend Tests

```bash
cd skyguard-bff

# Test health endpoint
curl http://localhost:5000/health

# Test flights endpoint
curl http://localhost:5000/api/flights/all

# Test disasters endpoint
curl http://localhost:5000/api/disasters/all
```

### Frontend Build

```bash
cd skyguard-client

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🔍 Troubleshooting

### Backend Issues

**Problem**: OpenSky API rate limit errors
- **Solution**: Wait 10 seconds between requests (already handled by cache)

**Problem**: Port 5000 already in use
- **Solution**: Change PORT in `.env` file

**Problem**: CORS errors
- **Solution**: Add your frontend URL to `ALLOWED_ORIGINS` in `.env`

### Frontend Issues

**Problem**: API connection failed
- **Solution**: Verify `NEXT_PUBLIC_API_URL` in `.env.local` is correct
- **Solution**: Ensure backend is running

**Problem**: Build errors
- **Solution**: Delete `node_modules` and `.next`, run `npm install` again

### Deployment Issues

**Problem**: Services not starting
- **Solution**: Check logs with `journalctl -u skyguard-backend -n 50`
- **Solution**: Verify environment files exist and are configured

**Problem**: Nginx 502 errors
- **Solution**: Verify backend services are running: `systemctl status skyguard-backend`
- **Solution**: Check if ports 3000 and 5000 are listening: `netstat -tlnp | grep -E '3000|5000'`

## 📊 System Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
┌──────▼──────────┐
│  Load Balancer  │  (Nginx)
│    (lb01)       │
└──────┬──────────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐         │
│   Next.js   │   │   Next.js   │         │
│   (web01)   │   │   (web02)   │         │
│   Port 3000 │   │   Port 3000 │         │
└──────┬──────┘   └──────┬──────┘         │
       │                 │                 │
       │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐         │
│  Express.js │   │  Express.js │◄────────┘
│   (web01)   │   │   (web02)   │
│   Port 5000 │   │   Port 5000 │
└──────┬──────┘   └──────┬──────┘
       │                 │
       └────────┬────────┘
                │
    ┌───────────▼───────────┐
    │   External APIs       │
    ├───────────────────────┤
    │  • OpenSky Network    │
    │  • USGS Earthquakes   │
    │  • NASA EONET         │
    └───────────────────────┘
```

## 📜 API Attribution

This application uses data from the following public APIs:

- **OpenSky Network**: https://opensky-network.org/
  - Real-time flight tracking data
  - License: Creative Commons BY-SA
  
- **USGS Earthquake Hazards Program**: https://earthquake.usgs.gov/
  - Global earthquake data
  - Public domain
  
- **NASA EONET (Earth Observatory Natural Event Tracker)**: https://eonet.gsfc.nasa.gov/
  - Natural disaster events
  - Public domain

We thank these organizations for providing free public access to their data.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **therealigor007** - Initial work - [GitHub](https://github.com/therealigor007)

## 🙏 Acknowledgments

- OpenSky Network for flight data
- USGS for earthquake data
- NASA for natural event data
- Next.js and React teams
- Express.js team
- All open-source contributors

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/therealigor007/skyguard/issues)
- Contact: [GitHub Profile](https://github.com/therealigor007)

---

**Note**: This application is for educational and informational purposes. Always verify critical information with official sources before making emergency response decisions.
