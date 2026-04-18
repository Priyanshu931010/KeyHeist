-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS keyheist_db;

-- Use the database
USE keyheist_db;

-- Create keychains table
CREATE TABLE IF NOT EXISTS keychains (
    qr_id VARCHAR(50) PRIMARY KEY,
    owner_email VARCHAR(100),
    security_pin VARCHAR(10),
    tag_name VARCHAR(100),
    is_registered BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'SECURE'
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_id VARCHAR(50),
    finder_msg TEXT,
    finder_contact VARCHAR(100),
    FOREIGN KEY (qr_id) REFERENCES keychains(qr_id)
);

-- Insert some sample data
INSERT INTO keychains (qr_id, owner_email, security_pin, tag_name, is_registered, status) VALUES
('KV-001', 'admin@keyvault.sys', '1234', 'Vehicle Access Key', TRUE, 'SECURE'),
('KV-002', 'admin@keyvault.sys', '5678', 'Tactical Briefcase', TRUE, 'MISSING')
ON DUPLICATE KEY UPDATE qr_id = qr_id;

INSERT INTO messages (qr_id, finder_msg, finder_contact) VALUES
('KV-002', 'Found this briefcase near the parking lot. Please contact me to retrieve.', 'john.doe@example.com')
ON DUPLICATE KEY UPDATE qr_id = qr_id;
