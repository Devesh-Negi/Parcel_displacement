# 🚚 Parcel Delivery Management System

A full-stack Parcel Delivery & Logistics Optimization System built using  
**Node.js, Express, MySQL, HTML, CSS, and JavaScript**.

This project implements route optimization using **Dijkstra's Algorithm**,  
priority-based parcel dispatching, traffic simulation, and real-time analytics.

---

## 📌 Features

### 🔐 Admin Panel
- Secure Admin Login
- Add Cities
- Add Routes between cities
- Set Traffic Level (Low / Medium / High)
- Manual Dispatch
- Auto Dispatch (Highest Priority Parcel)
- View Analytics Dashboard

### 👤 User Panel
- View available cities (admin controlled)
- Select Source & Destination from dropdown
- View shortest route path
- Calculate Estimated Arrival Time (ETA)
- Create Parcel
- Track Parcel by Tracking ID

### 🧠 Smart System Features
- Dijkstra's Shortest Path Algorithm
- Priority Score Calculation
- Traffic-Based Delivery Time
- Auto Delivery Status Update
- Real-Time Analytics Dashboard

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MySQL
- Dijkstra Algorithm (Graph Theory)

### Frontend
- HTML
- CSS
- JavaScript (Fetch API)

---

## 📂 Project Structure

parcel-delivery/
│
├── backend/
│   ├── server.js
│   ├── db.js
│   └── algorithms/
│       └── dijkstra.js
│
├── frontend/
│   ├── admin.html
│   ├── admin-login.html
│   ├── user.html
│   ├── script.js
│   └── style.css
│
└── README.md

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

git clone https://github.com/yourusername/parcel-delivery.git  
cd parcel-delivery

### 2️⃣ Install Backend Dependencies

cd backend  
npm install

### 3️⃣ Configure MySQL Database

Create a database:

CREATE DATABASE parcel_db;  
USE parcel_db;

Create required tables:
- cities
- routes
- parcels

### 4️⃣ Start Backend Server

node server.js

Server runs on:

http://localhost:5000

### 5️⃣ Run Frontend

Open frontend folder using Live Server  
or open:

admin-login.html  
user.html

---

## 🔑 Admin Login Credentials

Username: admin  
Password: 12345

---

## 📊 API Endpoints

### City
POST /add-city  
GET /cities  

### Route
POST /add-route  
GET /routes  

### Parcel
POST /add-parcel  
GET /parcels  
GET /track-parcel/:trackingNumber  

### Dispatch
POST /dispatch/:trackingNumber  
POST /auto-dispatch  

### Analytics
GET /analytics  

---

## 🧮 Algorithm Used

The system uses **Dijkstra's Algorithm** to:

- Calculate shortest distance
- Determine optimal delivery route
- Compute delivery time

Time Complexity: O(V²)

---

## 👨‍💻 Author

Developed by: Devesh Singh Negi  
MCA Project

---

## ⭐ If you like this project

Give it a ⭐ on GitHub!
