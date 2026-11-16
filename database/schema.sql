-- HostelDesk database schema (MySQL)
-- Run this once:  mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS hosteldesk;
USE hosteldesk;

-- Drop in reverse order of dependency so foreign keys don't block us
DROP TABLE IF EXISTS complaint_updates;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 1. Every person who logs in. "role" decides which dashboard they see.
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student', 'warden', 'staff') NOT NULL DEFAULT 'student',
  room_no       VARCHAR(20),            -- only students have a room
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Complaint types kept in their own table (normalization:
--    we store the name once instead of repeating "Electrical" in every complaint).
CREATE TABLE categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. The main table. Links a student, a category and (later) a staff member.
CREATE TABLE complaints (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  category_id  INT NOT NULL,
  title        VARCHAR(150) NOT NULL,
  description  TEXT NOT NULL,
  status       ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  assigned_to  INT NULL,                -- staff user id, NULL until warden assigns
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. History of a complaint: every status change or comment is one row.
CREATE TABLE complaint_updates (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  user_id      INT NOT NULL,            -- who made the change
  message      VARCHAR(500) NOT NULL,
  new_status   VARCHAR(20) NULL,        -- filled only when status changed
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes on columns we filter by often (makes WHERE queries faster)
CREATE INDEX idx_complaints_status   ON complaints(status);
CREATE INDEX idx_complaints_student  ON complaints(student_id);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_to);

-- Starting categories
INSERT INTO categories (name) VALUES
  ('Electrical'), ('Plumbing'), ('Wi-Fi'), ('Carpentry'), ('Cleaning'), ('Other');
