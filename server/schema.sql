CREATE TABLE IF NOT EXISTS counters (
  name VARCHAR(32) PRIMARY KEY,
  value INT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password CHAR(64) NOT NULL,
  role ENUM('admin', 'farmer', 'buyer') NOT NULL,
  phone VARCHAR(40) NOT NULL DEFAULT '',
  farm_name VARCHAR(160) NULL,
  avatar VARCHAR(8) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  city VARCHAR(120) NOT NULL DEFAULT '',
  province VARCHAR(120) NOT NULL DEFAULT '',
  lat DECIMAL(10, 7) NOT NULL DEFAULT 0,
  lng DECIMAL(10, 7) NOT NULL DEFAULT 0,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NULL,
  remember TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(32) PRIMARY KEY,
  farmer_id VARCHAR(32) NOT NULL,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image TEXT,
  harvest_date DATE NULL,
  organic TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active', 'hidden') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_products_farmer FOREIGN KEY (farmer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS guide_prices (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  average_price DECIMAL(10, 2) NOT NULL,
  min_price DECIMAL(10, 2) NOT NULL,
  max_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(32) PRIMARY KEY,
  buyer_id VARCHAR(32) NOT NULL,
  farmer_id VARCHAR(32) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  queue_position INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
  CONSTRAINT fk_orders_farmer FOREIGN KEY (farmer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  name VARCHAR(160) NOT NULL,
  qty INT NOT NULL,
  unit VARCHAR(20) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  note VARCHAR(255) NULL,
  at DATETIME NOT NULL,
  CONSTRAINT fk_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(32) PRIMARY KEY,
  farmer_id VARCHAR(32) NOT NULL,
  buyer_id VARCHAR(32) NOT NULL,
  last_message TEXT,
  last_at DATETIME NULL,
  UNIQUE KEY uniq_chat_pair (farmer_id, buyer_id),
  CONSTRAINT fk_convo_farmer FOREIGN KEY (farmer_id) REFERENCES users(id),
  CONSTRAINT fk_convo_buyer FOREIGN KEY (buyer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(32) PRIMARY KEY,
  conversation_id VARCHAR(32) NOT NULL,
  sender_id VARCHAR(32) NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_messages_convo FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT,
  type VARCHAR(40) NOT NULL DEFAULT 'info',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id TINYINT PRIMARY KEY,
  data JSON NOT NULL
);
