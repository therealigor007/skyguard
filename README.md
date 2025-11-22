# SkyGuard - Disaster Response Flight Coordinator

**SkyGuard** is a web application designed to enhance global situational awareness by tracking active flights and correlating their positions with current natural disaster zones. The primary goal is to provide a unified operational picture for disaster response and humanitarian aid coordination.

-----

## 1\. Features

  * **Real-time Data Mapping:** Displays active flights (OpenSky Network), recent high-magnitude earthquakes (USGS), and significant natural events (NASA EONET) on an interactive map (Leaflet).
  * **Proximity Alerting:** Automatically calculates and flags active flights within a user-defined radius (default 200 km) of disaster zones.
  * **Data Filtering:** Allows users to toggle the visibility of data layers (Flights, Earthquakes, Events) and adjust analysis parameters (e.g., Minimum Earthquake Magnitude, Alert Radius).
  * **User Interface:** Intuitive interface with dedicated sidebar for filters and a real-time list of proximity alerts.
  * **Error Handling:** Implements robust error handling for API timeouts and failures, providing clear feedback to the console and the loading indicator.

-----

## 2\. Local Execution

The application is built using standard HTML, CSS (inline/external), and modular JavaScript (ES Modules). No external build tools or frameworks are required.

### Prerequisites

  * A modern web browser (Chrome, Firefox, Edge, Safari).
  * Internet access (required for API data fetching and map tiles).
  * **Node.js** (optional, but recommended for running the local server).

### Steps to Run Locally

1.  **Clone the Repository:**

    ```bash
    git clone [Your Repository URL]
    cd skyguard
    ```

2.  **Open the Application:**
    Because the project uses ES6 Modules, you must serve it over HTTP (not file://).

    **Using Node.js (Recommended):**

    ```bash
    npm install
    npm start
    ```

    **Alternatively (if you have Python installed):**

    ```bash
    python3 -m http.server
    ```

3.  The application will automatically initialize the map and begin the first data refresh cycle.

-----

## 3\. API Usage and Attribution

SkyGuard relies on three distinct external APIs to gather global data:

| API Name | Data Purpose | Endpoint Documentation | Attribution |
| :--- | :--- | :--- | :--- |
| **OpenSky Network** | Real-time flight traffic data. | [OpenSky API Docs](https://opensky-network.org/apidoc/rest.html) | OpenSky Network (used endpoint: `/api/states/all`) |
| **USGS Earthquake API** | Recent, high-magnitude earthquake data. | [USGS API Docs](https://earthquake.usgs.gov/fdsnws/event/1/) | U.S. Geological Survey (USGS) |
| **NASA EONET** | Global open natural events (wildfires, storms, volcanoes). | [NASA EONET Docs](https://eonet.gsfc.nasa.gov/docs/v3) | NASA Earth Observatory Natural Event Tracker (EONET) |

### Security Note on API Keys

The APIs utilized (OpenSky Network, USGS, and NASA EONET) are public, read-only endpoints that **do not require any API keys** for access. Therefore, no sensitive information is stored or exposed in the codebase.

-----

## 4\. Deployment to Web Servers (Part Two)

The application was successfully deployed to the provided web servers (`Web01`, `Web02`) and configured under the load balancer (`Lb01`) to ensure reliability and traffic distribution.

### Server Details

  * **Web01:** `44.204.88.221` (User: `ubuntu`)
  * **Web02:** `52.91.16.179` (User: `ubuntu`)
  * **Lb01 (Load Balancer):** `54.174.137.211` (User: `ubuntu`)

### Deployment Steps

Deployment involves transferring files, installing a web server, and configuring the load balancer. Note that we also included automated scripts (`deploy/deploy.sh`) in the repository to handle this process.

#### Step 4.1: Install/Verify Web Server on Web01 & Web02

For the application to be served, a web server must be running on both backend machines.

**SSH into Web01 and Web02:**

```bash
ssh ubuntu@44.204.88.221
# OR
ssh ubuntu@52.91.16.179
```

**Install Nginx:**

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 4.2: File Transfer to Web01 & Web02

The entire `skyguard/` directory must be placed in the Nginx document root (`/var/www/html/`).

**Transfer commands:**

```bash
scp -r skyguard ubuntu@44.204.88.221:/var/www/html/
scp -r skyguard ubuntu@52.91.16.179:/var/www/html/
```

#### Step 4.3: Load Balancer Configuration (Lb01 - Nginx)

The load balancer configuration is essential for traffic distribution. We use Nginx on Lb01 and configure it for simple Round-Robin load balancing.

**1. SSH into Lb01:**

```bash
ssh ubuntu@54.174.137.211
```

**2. Install Nginx:**

```bash
sudo apt update
sudo apt install nginx -y
```

**3. Edit Configuration:**
Edit `/etc/nginx/sites-available/default` or `/etc/nginx/nginx.conf`:

```bash
sudo nano /etc/nginx/sites-available/default
```

**4. Configuration Block:**

```nginx
# Define the group of web servers (Upstream Block)
upstream skyguard_backend {
    # Round-robin distribution is default
    server 44.204.88.221:80;
    server 52.91.16.179:80;
}

server {
    listen 80;
    server_name 54.174.137.211;

    location /skyguard/ {
        # Pass requests to the defined backend group
        proxy_pass http://skyguard_backend/skyguard/;

        # Preserve original host/IP headers for logging on backend servers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_redirect off;
    }
    
    # Redirect root to app
    location / {
        return 302 /skyguard/index.html;
    }
}
```

**5. Apply Changes:**

```bash
sudo nginx -t           # Test the syntax
sudo systemctl reload nginx # Apply the changes
```

#### Step 4.4: Testing and Verification

To verify that the deployment and load balancer are functional:

1.  **Web Server Verification (Direct Access):**

      * `http://44.204.88.221/skyguard/index.html`
      * `http://52.91.16.179/skyguard/index.html`

2.  **Load Balancer Verification (Public Access):**

      * Access the application via the load balancer IP: `http://54.174.137.211/skyguard/index.html`
      * Traffic is confirmed to be balanced between Web01 and Web02.

-----

## 5\. Challenges and Solutions

| Challenge | Description | Solution |
| :--- | :--- | :--- |
| **OpenSky Data Parsing** | OpenSky data is returned as a nested array of raw values (e.g., `state[5]` for longitude), not named objects. | Implemented a dedicated mapping function in `js/api.js` to transform the raw array indices into meaningful, named properties (e.g., `longitude`, `latitude`) for easier consumption. |
| **Proximity Calculation** | Calculating the accurate distance between a flight and a disaster point across the globe is non-trivial. | Used the **Haversine formula** in `js/analysis.js` to accurately calculate the great-circle distance (in kilometers) between two latitude/longitude points on the Earth's surface. |
| **Module Loading** | Ensuring correct load order for JavaScript modules (`config.js` before `api.js`) using the ES module syntax. | Used `type="module"` in `index.html` and explicit `import`/`export` statements in all JS files to manage dependencies correctly. |
| **Load Balancer Pathing** | Ensuring the Nginx proxy correctly handles the `/skyguard/` path on both the public-facing URL and backend servers. | Explicitly defined `location /skyguard/` and used `proxy_pass http://skyguard_backend/skyguard/;` to maintain correct directory mapping. |
