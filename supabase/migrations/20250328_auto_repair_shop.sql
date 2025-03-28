
-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'client', 'mechanic');
CREATE TYPE quality_check_status AS ENUM ('passed', 'issues');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  license_plate TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create service_categories table
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TEXT NOT NULL, -- in format "HH:MM"
  end_time TEXT NOT NULL, -- in format "HH:MM"
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  total_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create appointment_services junction table
CREATE TABLE appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create work_orders table
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  mechanic_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'created', -- created, in_progress, parts_waiting, completed, quality_passed, quality_issues
  start_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  total_cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_status_updates table
CREATE TABLE order_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  comment TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parts table
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  part_number TEXT,
  price NUMERIC NOT NULL,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_parts junction table
CREATE TABLE order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create repair_photos table
CREATE TABLE repair_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quality_checks table
CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  checked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status quality_check_status NOT NULL,
  comments TEXT,
  check_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create loyalty_programs table
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  discount_percentage INTEGER NOT NULL,
  min_visits INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create client_loyalty_programs table
CREATE TABLE client_loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  active_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, loyalty_program_id)
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_loyalty_programs ENABLE ROW LEVEL SECURITY;

-- Sample data for testing
-- Service categories
INSERT INTO service_categories (id, name, description) VALUES 
  ('1aaa0000-0000-0000-0000-000000000001', 'Диагностика', 'Диагностические услуги для выявления проблем'),
  ('1aaa0000-0000-0000-0000-000000000002', 'Техническое обслуживание', 'Регулярное техническое обслуживание автомобиля'),
  ('1aaa0000-0000-0000-0000-000000000003', 'Ремонт двигателя', 'Услуги по ремонту и восстановлению двигателя'),
  ('1aaa0000-0000-0000-0000-000000000004', 'Ремонт ходовой части', 'Услуги по ремонту подвески и ходовой части'),
  ('1aaa0000-0000-0000-0000-000000000005', 'Шиномонтаж', 'Услуги по замене и ремонту шин');

-- Services
INSERT INTO services (id, category_id, name, description, price, duration) VALUES
  ('2aaa0000-0000-0000-0000-000000000001', '1aaa0000-0000-0000-0000-000000000001', 'Компьютерная диагностика', 'Полная компьютерная диагностика систем автомобиля', 1500, 60),
  ('2aaa0000-0000-0000-0000-000000000002', '1aaa0000-0000-0000-0000-000000000002', 'Замена масла', 'Замена моторного масла и масляного фильтра', 1200, 30),
  ('2aaa0000-0000-0000-0000-000000000003', '1aaa0000-0000-0000-0000-000000000002', 'ТО-1', 'Техническое обслуживание с заменой расходных материалов', 4500, 120),
  ('2aaa0000-0000-0000-0000-000000000004', '1aaa0000-0000-0000-0000-000000000003', 'Замена ремня ГРМ', 'Замена ремня газораспределительного механизма', 5000, 180),
  ('2aaa0000-0000-0000-0000-000000000005', '1aaa0000-0000-0000-0000-000000000004', 'Замена амортизаторов', 'Замена передних или задних амортизаторов', 3500, 120),
  ('2aaa0000-0000-0000-0000-000000000006', '1aaa0000-0000-0000-0000-000000000005', 'Сезонная замена шин', 'Замена 4 шин с балансировкой', 2800, 60);

-- Loyalty programs
INSERT INTO loyalty_programs (id, name, discount_percentage, min_visits) VALUES
  ('3aaa0000-0000-0000-0000-000000000001', 'Бронзовый уровень', 5, 3),
  ('3aaa0000-0000-0000-0000-000000000002', 'Серебряный уровень', 10, 5),
  ('3aaa0000-0000-0000-0000-000000000003', 'Золотой уровень', 15, 10);

-- Parts
INSERT INTO parts (id, name, description, part_number, price, quantity_in_stock) VALUES
  ('4aaa0000-0000-0000-0000-000000000001', 'Масляный фильтр', 'Стандартный масляный фильтр для большинства моделей', 'OF-2345', 300, 50),
  ('4aaa0000-0000-0000-0000-000000000002', 'Воздушный фильтр', 'Воздушный фильтр двигателя', 'AF-1234', 450, 35),
  ('4aaa0000-0000-0000-0000-000000000003', 'Тормозные колодки', 'Передние тормозные колодки для легковых автомобилей', 'BP-7890', 1200, 20),
  ('4aaa0000-0000-0000-0000-000000000004', 'Моторное масло 5W-30', 'Синтетическое моторное масло, 1л', 'MO-5W30', 600, 100),
  ('4aaa0000-0000-0000-0000-000000000005', 'Аккумулятор 60Ah', 'Стартерная аккумуляторная батарея 12В 60Ah', 'BAT-60AH', 5000, 10);
