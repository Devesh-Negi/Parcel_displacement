CREATE DATABASE IF NOT EXISTS parcel_delivery;
USE parcel_delivery;

CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_id INT NOT NULL,
    destination_id INT NOT NULL,
    distance DECIMAL(10, 2) NOT NULL,
    UNIQUE KEY unique_route (source_id, destination_id),
    FOREIGN KEY (source_id) REFERENCES cities(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES cities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parcels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(20) NOT NULL UNIQUE,
    status ENUM('pending', 'dispatched', 'delivered') DEFAULT 'pending',
    source_id INT NOT NULL,
    destination_id INT NOT NULL,
    distance DECIMAL(10, 2) NOT NULL,
    priority_score DECIMAL(10, 2) DEFAULT 0,
    dispatch_time DATETIME NULL,
    delivery_time DECIMAL(10, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES cities(id),
    FOREIGN KEY (destination_id) REFERENCES cities(id)
);
