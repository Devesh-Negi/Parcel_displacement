# Parcel Delivery Management System

A full-stack Parcel Delivery and Logistics Optimization System built using
Node.js, Express.js, MySQL, HTML, CSS, and JavaScript.

The project manages parcel booking, route optimization, delivery tracking,
traffic-based ETA, priority dispatch, delivery charge calculation, and admin
analytics.

## Features

### Admin Panel

- Secure admin login
- Add cities
- Add routes between cities
- Add sample demo data
- Remove duplicate routes
- View cities, routes, and parcels in tables
- Set traffic level: low, medium, or high
- Manual parcel dispatch
- Auto-dispatch highest priority parcel
- Manually update parcel status
- View analytics dashboard
- View parcel status with colored badges

### User Panel

- Select source and destination city
- Check shortest route using Dijkstra's Algorithm
- Calculate ETA based on current traffic speed
- View delivery cost breakdown
- Create parcel and generate tracking ID
- Track parcel by tracking ID
- View parcel progress timeline
- View available routes
- View route graph with cities and distances

### Smart System Features

- Dijkstra's shortest path algorithm
- Traffic-based delivery time
- Priority score calculation
- Priority-based auto dispatch
- Delivery charge calculation
- Parcel status timeline
- Route graph visualization
- Analytics dashboard
- MySQL database schema file

## Tech Stack

### Frontend

- HTML
- CSS
- JavaScript
- Fetch API

### Backend

- Node.js
- Express.js
- MySQL
- Dijkstra Algorithm

### Database

- MySQL
- Tables: `cities`, `routes`, `parcels`

## Project Structure

```text
parcel-delivery/
|-- backend/
|   |-- algorithms/
|   |   |-- dijkstra.js
|   |-- db.js
|   |-- schema.sql
|   |-- server.js
|   |-- package.json
|
|-- frontend/
|   |-- admin-login.html
|   |-- admin.html
|   |-- index.html
|   |-- script.js
|   |-- style.css
|   |-- user.html
|
|-- README.md
```

## Installation and Setup

### 1. Clone Repository

```bash
git clone https://github.com/Devesh-Negi/Parcel_displacement.git
cd Parcel_displacement
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure MySQL Database

Open MySQL and run:

```sql
SOURCE backend/schema.sql;
```

Or manually open `backend/schema.sql` and execute the SQL commands.

The database name used by the project is:

```text
parcel_delivery
```

### 4. Check Database Connection

Update MySQL credentials in:

```text
backend/db.js
```

Default values currently used:

```js
host: "localhost"
user: "root"
password: "root"
database: "parcel_delivery"
```

### 5. Start Backend Server

```bash
cd backend
node server.js
```

Server runs at:

```text
http://localhost:5000
```

### 6. Run Frontend

Open the frontend using Live Server, or directly open:

```text
frontend/index.html
```

## Admin Login

```text
Username: admin
Password: 12345
```

## Important API Endpoints

### Admin Login

```text
POST /admin-login
```

### Cities

```text
POST /add-city
GET  /cities
```

### Routes

```text
POST /add-route
GET  /routes
POST /seed-demo
POST /cleanup-routes
```

### Parcels

```text
POST /add-parcel
GET  /parcels
GET  /track-parcel/:trackingNumber
POST /update-status/:trackingNumber
```

### Dispatch

```text
POST /dispatch/:trackingNumber
POST /auto-dispatch
```

### Analytics

```text
GET /analytics
GET /update-deliveries
```

## Algorithm Used

The system uses Dijkstra's Algorithm to find the shortest route between two
cities.

It is used to:

- Calculate shortest distance
- Find optimal delivery path
- Estimate delivery time
- Support parcel charge calculation

Time complexity:

```text
O(V^2)
```

Where:

- `V` is the number of cities
- Routes are used as graph edges

## Delivery Charge Calculation

The system calculates delivery charge using:

- Base charge
- Distance charge
- Weight charge
- Parcel type charge

Parcel types:

- Normal
- Express
- Fragile

## Demo Flow

Use this flow during project presentation:

1. Open `frontend/index.html`
2. Go to Admin Panel
3. Login using admin credentials
4. Click `Add Sample Data`
5. Click `Show Routes`
6. Go to User Panel
7. Select source and destination city
8. Click `Check ETA and Charge`
9. Click `Show Route Graph`
10. Create a parcel
11. Copy the tracking ID
12. Track the parcel
13. Return to Admin Panel
14. Update parcel status or dispatch parcel
15. Show analytics dashboard

## Key Project Highlights

- Full-stack web application
- MySQL database integration
- Real route optimization using graph algorithm
- Traffic-based ETA
- Priority-based dispatch system
- User-friendly tracking timeline
- Admin dashboard and analytics
- Route graph visualization
- Delivery cost breakdown

## Author

Developed by: Devesh Singh Negi

MCA Final Year Project
