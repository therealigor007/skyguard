# 📡 SkyGuard API Documentation

Complete API reference for the SkyGuard Backend API.

## Base URL

```
Development: http://localhost:5000
Production: https://your-domain.com
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Rate Limiting

To respect external API rate limits, the following caching is implemented:

- **Cache Duration**: 30 seconds (configurable via `CACHE_DURATION` environment variable)
- **OpenSky Network**: 10 second minimum interval between requests
- **USGS**: 60 second minimum interval
- **NASA EONET**: 60 second minimum interval

Cached responses include a `source` field indicating `"cache"` or `"api"`.

## Response Format

All API responses are in JSON format.

### Success Response

```json
{
  "source": "api|cache",
  "fetched_at": "2024-01-15T10:30:00.000Z",
  "count": 100,
  "data": []
}
```

### Error Response

```json
{
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/endpoint"
}
```

## Endpoints

### Health Check

Check server health status.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345.67,
  "environment": "production"
}
```

---

## Flight Endpoints

### Get All Flights

Retrieve all currently active flights worldwide.

**Endpoint**: `GET /api/flights/all`

**Query Parameters**: None

**Response**:
```json
{
  "source": "api",
  "fetched_at": "2024-01-15T10:30:00.000Z",
  "count": 8945,
  "flights": [
    {
      "icao24": "a1b2c3",
      "callsign": "UAL123",
      "origin_country": "United States",
      "time_position": 1705318200,
      "last_contact": 1705318205,
      "longitude": -122.3748,
      "latitude": 37.6213,
      "baro_altitude": 10668.0,
      "on_ground": false,
      "velocity": 250.5,
      "true_track": 45.2,
      "vertical_rate": 0.0,
      "sensors": null,
      "altitude": 10668.0,
      "squawk": "1234",
      "spi": false,
      "position_source": 0
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `500 Internal Server Error`: API error

---

### Search Flights

Search for flights by callsign or origin country.

**Endpoint**: `GET /api/flights/search`

**Query Parameters**:
- `callsign` (string, optional): Filter by callsign (case-insensitive, partial match)
- `origin` (string, optional): Filter by origin country (case-insensitive, partial match)

**Example Request**:
```bash
GET /api/flights/search?callsign=UAL&origin=United
```

**Response**:
```json
{
  "query": {
    "callsign": "UAL",
    "origin": "United",
    "destination": null
  },
  "count": 25,
  "flights": [
    {
      "icao24": "a1b2c3",
      "callsign": "UAL123",
      "origin_country": "United States",
      "latitude": 37.6213,
      "longitude": -122.3748,
      "altitude": 10668.0,
      "velocity": 250.5
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: No search parameters provided
- `500 Internal Server Error`: API error

---

### Get Flights in Bounding Box

Retrieve flights within a geographic bounding box.

**Endpoint**: `GET /api/flights/bounds`

**Query Parameters** (all required):
- `lat1` (number): Minimum latitude
- `lon1` (number): Minimum longitude
- `lat2` (number): Maximum latitude
- `lon2` (number): Maximum longitude

**Example Request**:
```bash
GET /api/flights/bounds?lat1=30&lon1=-130&lat2=50&lon2=-110
```

**Response**:
```json
{
  "bounds": {
    "lat1": 30,
    "lon1": -130,
    "lat2": 50,
    "lon2": -110
  },
  "count": 145,
  "flights": [
    {
      "icao24": "a1b2c3",
      "callsign": "UAL123",
      "origin_country": "United States",
      "longitude": -122.3748,
      "latitude": 37.6213,
      "altitude": 10668.0,
      "velocity": 250.5,
      "on_ground": false
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Missing bounding box parameters
- `500 Internal Server Error`: API error

---

## Disaster Endpoints

### Get Earthquakes

Retrieve recent earthquakes filtered by magnitude and time range.

**Endpoint**: `GET /api/disasters/earthquakes`

**Query Parameters**:
- `minMagnitude` (number, optional, default: 4.5): Minimum earthquake magnitude
- `days` (number, optional, default: 7): Number of days to look back

**Example Request**:
```bash
GET /api/disasters/earthquakes?minMagnitude=5.0&days=7
```

**Response**:
```json
{
  "source": "api",
  "fetched_at": "2024-01-15T10:30:00.000Z",
  "count": 12,
  "minMagnitude": 5.0,
  "days": 7,
  "earthquakes": [
    {
      "id": "us7000example",
      "magnitude": 5.8,
      "place": "10 km NE of San Francisco, CA",
      "time": "2024-01-14T08:23:45.000Z",
      "updated": "2024-01-14T09:15:32.000Z",
      "coordinates": [-122.3748, 37.6213, 10.5],
      "latitude": 37.6213,
      "longitude": -122.3748,
      "depth": 10.5,
      "type": "earthquake",
      "title": "M 5.8 - 10 km NE of San Francisco, CA",
      "status": "reviewed",
      "tsunami": false,
      "sig": 512,
      "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000example",
      "detail": "https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us7000example",
      "felt": 324,
      "cdi": 6.2,
      "mmi": 5.8,
      "alert": "yellow",
      "category": "earthquake"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `500 Internal Server Error`: API error

---

### Get Natural Events

Retrieve natural disaster events from NASA EONET.

**Endpoint**: `GET /api/disasters/events`

**Query Parameters**:
- `category` (string, optional): Event category (wildfires, severeStorms, volcanoes, floods, etc.)
- `status` (string, optional, default: "open"): Event status ("open" or "closed")
- `limit` (number, optional, default: 100): Maximum number of events

**Example Request**:
```bash
GET /api/disasters/events?category=wildfires&status=open&limit=50
```

**Response**:
```json
{
  "source": "api",
  "fetched_at": "2024-01-15T10:30:00.000Z",
  "count": 23,
  "filters": {
    "category": "wildfires",
    "status": "open",
    "limit": 50
  },
  "events": [
    {
      "id": "EONET_12345",
      "title": "Wildfire - California, United States",
      "description": "Wildfire in northern California",
      "link": "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_12345",
      "closed": null,
      "categories": [
        {
          "id": "wildfires",
          "title": "Wildfires"
        }
      ],
      "sources": [
        {
          "id": "InciWeb",
          "url": "http://inciweb.nwcg.gov/incident/12345/"
        }
      ],
      "geometry": [
        {
          "date": "2024-01-10T00:00:00Z",
          "type": "Point",
          "coordinates": [-122.5, 40.2]
        }
      ],
      "latitude": 40.2,
      "longitude": -122.5,
      "date": "2024-01-10T00:00:00Z",
      "category": "Wildfires"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `500 Internal Server Error`: API error

---

### Get All Disasters

Retrieve both earthquakes and natural events in a single request.

**Endpoint**: `GET /api/disasters/all`

**Query Parameters**:
- `minMagnitude` (number, optional, default: 4.5): Minimum earthquake magnitude
- `days` (number, optional, default: 7): Number of days for earthquakes

**Example Request**:
```bash
GET /api/disasters/all?minMagnitude=4.5
```

**Response**:
```json
{
  "fetched_at": "2024-01-15T10:30:00.000Z",
  "summary": {
    "total": 45,
    "earthquakes": 12,
    "natural_events": 33
  },
  "data": {
    "earthquakes": [
      { /* earthquake object */ }
    ],
    "natural_events": [
      { /* natural event object */ }
    ]
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `500 Internal Server Error`: API error

---

## Analysis Endpoints

### Analyze Flights Near Disasters

Identify flights within a specified radius of disaster locations.

**Endpoint**: `POST /api/analysis/flights-near-disaster`

**Request Body**:
```json
{
  "flights": [
    {
      "callsign": "UAL123",
      "icao24": "a1b2c3",
      "latitude": 37.6213,
      "longitude": -122.3748,
      "altitude": 10668.0,
      "velocity": 250.5
    }
  ],
  "disasters": [
    {
      "id": "us7000example",
      "magnitude": 5.8,
      "place": "San Francisco, CA",
      "coordinates": [-122.4194, 37.7749, 10.5],
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  ],
  "radiusKm": 200
}
```

**Response**:
```json
{
  "analyzed_at": "2024-01-15T10:30:00.000Z",
  "radius_km": 200,
  "flights_analyzed": 1,
  "disasters_analyzed": 1,
  "matches_found": 1,
  "matches": [
    {
      "flight": {
        "callsign": "UAL123",
        "icao24": "a1b2c3",
        "latitude": 37.6213,
        "longitude": -122.3748,
        "altitude": 10668.0,
        "velocity": 250.5
      },
      "disaster": {
        "type": "earthquake",
        "name": "San Francisco, CA",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "magnitude": 5.8
      },
      "distance_km": 18.5,
      "severity": "high"
    }
  ]
}
```

**Severity Levels**:
- `high`: Distance < 50 km
- `medium`: Distance 50-100 km
- `low`: Distance 100+ km

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Missing flights or disasters
- `500 Internal Server Error`: API error

---

### Get Affected Airports

Determine which major airports are near disaster areas.

**Endpoint**: `GET /api/analysis/affected-airports`

**Query Parameters**:
- `disasters` (string, required): JSON-encoded array of disaster objects
- `radiusKm` (number, optional, default: 100): Search radius in kilometers

**Example Request**:
```bash
GET /api/analysis/affected-airports?disasters=[{"coordinates":[-122.4194,37.7749,10.5]}]&radiusKm=100
```

**Response**:
```json
{
  "analyzed_at": "2024-01-15T10:30:00.000Z",
  "radius_km": 100,
  "affected_count": 2,
  "affected_airports": [
    {
      "airport": {
        "code": "SFO",
        "name": "San Francisco International",
        "lat": 37.6213,
        "lon": -122.3748
      },
      "disaster": {
        "coordinates": [-122.4194, 37.7749, 10.5]
      },
      "distance_km": 15.2
    }
  ]
}
```

**Major Airports Checked**:
- LAX (Los Angeles)
- JFK (New York)
- HND (Tokyo)
- LHR (London)
- CDG (Paris)
- DXB (Dubai)
- SIN (Singapore)
- SYD (Sydney)
- MNL (Manila)
- MEX (Mexico City)

**Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Missing disasters parameter
- `500 Internal Server Error`: API error

---

## Data Models

### Flight Object

```typescript
{
  icao24: string;              // Unique ICAO 24-bit address
  callsign: string | null;     // Flight callsign
  origin_country: string;      // Country of origin
  time_position: number;       // Unix timestamp
  last_contact: number;        // Unix timestamp
  longitude: number | null;    // Decimal degrees
  latitude: number | null;     // Decimal degrees
  baro_altitude: number | null; // Meters
  on_ground: boolean;          // On ground status
  velocity: number | null;     // m/s
  true_track: number | null;   // Degrees
  vertical_rate: number | null; // m/s
  sensors: number[] | null;    // Sensor IDs
  altitude: number | null;     // Geometric altitude (meters)
  squawk: string | null;       // Transponder code
  spi: boolean;                // Special position indicator
  position_source: number;     // 0=ADS-B, 1=ASTERIX, 2=MLAT
}
```

### Earthquake Object

```typescript
{
  id: string;                  // USGS event ID
  magnitude: number;           // Magnitude
  place: string;               // Location description
  time: string;                // ISO 8601 timestamp
  updated: string;             // ISO 8601 timestamp
  coordinates: [number, number, number]; // [lon, lat, depth]
  latitude: number;            // Decimal degrees
  longitude: number;           // Decimal degrees
  depth: number;               // Kilometers
  type: string;                // Event type
  title: string;               // Full title
  status: string;              // Review status
  tsunami: boolean;            // Tsunami warning
  sig: number;                 // Significance (0-1000)
  url: string;                 // USGS event page
  detail: string;              // Detail API endpoint
  felt: number | null;         // Number of felt reports
  cdi: number | null;          // Community intensity
  mmi: number | null;          // Modified Mercalli Intensity
  alert: string | null;        // Alert level (green/yellow/orange/red)
  category: "earthquake";
}
```

### Natural Event Object

```typescript
{
  id: string;                  // EONET event ID
  title: string;               // Event title
  description: string | null;  // Event description
  link: string;                // EONET link
  closed: string | null;       // Close date (ISO 8601)
  categories: Array<{          // Event categories
    id: string;
    title: string;
  }>;
  sources: Array<{             // Data sources
    id: string;
    url: string;
  }>;
  geometry: Array<{            // Location history
    date: string;              // ISO 8601
    type: string;              // "Point"
    coordinates: [number, number]; // [lon, lat]
  }>;
  latitude: number | null;     // Latest latitude
  longitude: number | null;    // Latest longitude
  date: string | null;         // Latest date
  category: string;            // Primary category
}
```

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Route does not exist |
| 500 | Internal Server Error - API or server error |

## Best Practices

1. **Use Caching**: The API caches responses for 30 seconds. Don't request more frequently than needed.

2. **Handle Errors**: Always check for error responses and handle them gracefully.

3. **Rate Limiting**: Respect the OpenSky Network 10-second rate limit for anonymous users.

4. **Pagination**: For large datasets, consider implementing client-side pagination.

5. **Timeout Handling**: Set appropriate timeouts for API calls (30 seconds recommended).

## Example Usage

### JavaScript (Axios)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Get all flights
async function getFlights() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/flights/all`);
    console.log(`Found ${response.data.count} flights`);
    return response.data.flights;
  } catch (error) {
    console.error('Error fetching flights:', error.message);
    throw error;
  }
}

// Analyze flights near disasters
async function analyzeFlights(flights, disasters, radiusKm = 200) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/analysis/flights-near-disaster`,
      { flights, disasters, radiusKm }
    );
    console.log(`Found ${response.data.matches_found} affected flights`);
    return response.data.matches;
  } catch (error) {
    console.error('Error analyzing flights:', error.message);
    throw error;
  }
}
```

### cURL

```bash
# Get earthquakes
curl "http://localhost:5000/api/disasters/earthquakes?minMagnitude=5.0"

# Search flights
curl "http://localhost:5000/api/flights/search?callsign=UAL"

# Analyze flights near disasters
curl -X POST http://localhost:5000/api/analysis/flights-near-disaster \
  -H "Content-Type: application/json" \
  -d '{
    "flights": [...],
    "disasters": [...],
    "radiusKm": 200
  }'
```

---

## Support

For API questions or issues:
- GitHub Issues: https://github.com/therealigor007/skyguard/issues
- Documentation: https://github.com/therealigor007/skyguard
