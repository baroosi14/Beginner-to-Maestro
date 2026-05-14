-- ============================================================
-- Beginner to Maestro – Music Learning Platform
-- MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS beginner_to_maestro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beginner_to_maestro;

-- -----------------------------------------------
-- Users (students + admins)
-- -----------------------------------------------
CREATE TABLE users (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id    VARCHAR(20) UNIQUE NOT NULL,       -- e.g. BTM-2024-001
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(191) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('student','admin') DEFAULT 'student',
    avatar_url    VARCHAR(500),
    is_active     TINYINT(1) DEFAULT 1,
    email_verified_at DATETIME,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Categories (Music genres / skill levels)
-- -----------------------------------------------
CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon        VARCHAR(100),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Courses
-- -----------------------------------------------
CREATE TABLE courses (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    slug            VARCHAR(220) UNIQUE NOT NULL,
    description     TEXT,
    thumbnail_url   VARCHAR(500),
    category_id     INT UNSIGNED,
    instructor_id   BIGINT UNSIGNED NOT NULL,          -- FK -> users.id (admin/instructor)
    level           ENUM('beginner','intermediate','advanced','all') DEFAULT 'beginner',
    price           DECIMAL(10,2) DEFAULT 0.00,
    currency        VARCHAR(10) DEFAULT 'USD',
    is_free         TINYINT(1) DEFAULT 0,
    is_published    TINYINT(1) DEFAULT 0,
    duration_hours  DECIMAL(6,2),
    total_lessons   INT UNSIGNED DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    INDEX idx_slug (slug),
    INDEX idx_published (is_published)
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Modules (sections inside a course)
-- -----------------------------------------------
CREATE TABLE modules (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id   BIGINT UNSIGNED NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order  INT UNSIGNED DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course (course_id)
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Lessons
-- -----------------------------------------------
CREATE TABLE lessons (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    module_id       BIGINT UNSIGNED NOT NULL,
    course_id       BIGINT UNSIGNED NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    content_type    ENUM('video','audio','pdf','text','quiz') DEFAULT 'video',
    video_url       VARCHAR(500),       -- public URL or signed S3 key
    video_duration  INT UNSIGNED,       -- seconds
    resource_url    VARCHAR(500),
    resource_name   VARCHAR(200),
    is_free_preview TINYINT(1) DEFAULT 0,
    sort_order      INT UNSIGNED DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_module (module_id),
    INDEX idx_course (course_id)
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Enrollments
-- -----------------------------------------------
CREATE TABLE enrollments (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    course_id       BIGINT UNSIGNED NOT NULL,
    enrolled_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME,               -- NULL = lifetime
    status          ENUM('active','expired','cancelled') DEFAULT 'active',
    UNIQUE KEY uq_user_course (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Lesson Progress
-- -----------------------------------------------
CREATE TABLE lesson_progress (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    lesson_id       BIGINT UNSIGNED NOT NULL,
    course_id       BIGINT UNSIGNED NOT NULL,
    is_completed    TINYINT(1) DEFAULT 0,
    watch_time      INT UNSIGNED DEFAULT 0,   -- seconds watched
    completed_at    DATETIME,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_lesson (user_id, lesson_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Subscriptions / Plans
-- -----------------------------------------------
CREATE TABLE subscription_plans (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'USD',
    billing_cycle   ENUM('monthly','yearly','lifetime') DEFAULT 'monthly',
    features        JSON,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE subscriptions (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    plan_id         INT UNSIGNED NOT NULL,
    status          ENUM('active','cancelled','expired','trialing') DEFAULT 'active',
    current_period_start DATETIME,
    current_period_end   DATETIME,
    provider        ENUM('paystack','flutterwave','paypal','stripe'),
    provider_sub_id VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Payments / Transactions
-- -----------------------------------------------
CREATE TABLE payments (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    course_id       BIGINT UNSIGNED,
    subscription_id BIGINT UNSIGNED,
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'USD',
    provider        ENUM('paystack','flutterwave','paypal','stripe') NOT NULL,
    provider_ref    VARCHAR(255) UNIQUE,     -- transaction reference from provider
    status          ENUM('pending','success','failed','refunded') DEFAULT 'pending',
    metadata        JSON,
    paid_at         DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    INDEX idx_provider_ref (provider_ref),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Live Classes
-- -----------------------------------------------
CREATE TABLE live_classes (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    instructor_id   BIGINT UNSIGNED NOT NULL,
    course_id       BIGINT UNSIGNED,
    scheduled_at    DATETIME NOT NULL,
    duration_mins   INT UNSIGNED DEFAULT 60,
    platform        ENUM('zoom','google_meet','teams','custom') DEFAULT 'zoom',
    meeting_url     VARCHAR(500),
    meeting_id      VARCHAR(100),
    meeting_password VARCHAR(100),
    max_attendees   INT UNSIGNED,
    is_recorded     TINYINT(1) DEFAULT 0,
    recording_url   VARCHAR(500),
    status          ENUM('scheduled','live','completed','cancelled') DEFAULT 'scheduled',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE live_class_registrations (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    live_class_id   BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    registered_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    attended        TINYINT(1) DEFAULT 0,
    UNIQUE KEY uq_class_user (live_class_id, user_id),
    FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Notifications
-- -----------------------------------------------
CREATE TABLE notifications (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    title       VARCHAR(200) NOT NULL,
    body        TEXT,
    type        ENUM('payment','live_class','course','system') DEFAULT 'system',
    is_read     TINYINT(1) DEFAULT 0,
    data        JSON,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read)
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Media (uploaded files metadata)
-- -----------------------------------------------
CREATE TABLE media (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uploader_id BIGINT UNSIGNED NOT NULL,
    file_name   VARCHAR(255) NOT NULL,
    file_path   VARCHAR(500) NOT NULL,    -- S3 key or local path
    file_type   VARCHAR(100),
    file_size   BIGINT UNSIGNED,
    disk        ENUM('local','s3') DEFAULT 'local',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------------------------
-- Seed Data
-- -----------------------------------------------
INSERT INTO categories (name, slug, description, icon) VALUES
('Piano',       'piano',       'Piano lessons from beginner to advanced', 'piano'),
('Guitar',      'guitar',      'Acoustic and electric guitar courses',   'guitar'),
('Violin',      'violin',      'Classical and contemporary violin',      'violin'),
('Drums',       'drums',       'Drumming techniques and rhythm training', 'drums'),
('Vocals',      'vocals',      'Singing, breath control, and performance','microphone'),
('Music Theory','music-theory','Notes, scales, chords, and composition', 'book'),
('Production',  'production',  'Beat making and digital audio workstations','headphones');

INSERT INTO subscription_plans (name, description, price, currency, billing_cycle, features) VALUES
('Starter',  'Access to free courses and previews',      0.00, 'USD', 'monthly',
 '["Free course access","Course previews","Community forum"]'),
('Pro',      'Full access to all courses',               19.99,'USD', 'monthly',
 '["All courses","HD video","Downloadable resources","Live class access"]'),
('Pro Annual','Full access at a discounted yearly rate', 179.99,'USD','yearly',
 '["All courses","HD video","Downloadable resources","Live class access","Priority support"]'),
('Lifetime', 'One-time payment for lifetime access',    499.00,'USD','lifetime',
 '["All courses","HD video","Downloadable resources","Live classes","Priority support","Future content"]');

-- Default admin account (password: Admin@123)
INSERT INTO users (student_id, full_name, email, password_hash, role) VALUES
('BTM-ADMIN-001','Platform Admin','admin@begintomastro.com',
 '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin');
