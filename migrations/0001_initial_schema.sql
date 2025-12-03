-- جدول الأدمن
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول العمال
CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  employee_number TEXT UNIQUE NOT NULL,
  access_code TEXT NOT NULL,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  can_retake_exam INTEGER DEFAULT 0
);

-- جدول الأسئلة
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text TEXT NOT NULL,
  is_correct_true INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الفيديوهات
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_name TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_order INTEGER NOT NULL,
  section_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول متابعة مشاهدة الفيديوهات
CREATE TABLE IF NOT EXISTS video_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  watched INTEGER DEFAULT 0,
  watched_at DATETIME,
  FOREIGN KEY (worker_id) REFERENCES workers(id),
  FOREIGN KEY (video_id) REFERENCES videos(id),
  UNIQUE(worker_id, video_id)
);

-- جدول النتائج
CREATE TABLE IF NOT EXISTS exam_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  percentage REAL NOT NULL,
  passed INTEGER NOT NULL,
  exam_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(id)
);

-- جدول أكواد الوصول
CREATE TABLE IF NOT EXISTS access_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  employee_number TEXT NOT NULL,
  job_title TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workers_employee_number ON workers(employee_number);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_video_progress_worker ON video_progress(worker_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_worker ON exam_results(worker_id);

-- إدراج أدمن افتراضي (username: admin, password: admin123)
INSERT OR IGNORE INTO admins (username, password) VALUES ('admin', 'admin123');

-- إدراج أسئلة تجريبية
INSERT OR IGNORE INTO questions (question_text, is_correct_true) VALUES 
('يجب ارتداء خوذة السلامة في جميع مناطق العمل', 1),
('يمكن العمل بدون معدات الحماية الشخصية إذا كان العمل قصيراً', 0),
('يجب فحص معدات السلامة قبل استخدامها', 1),
('التدخين مسموح في مناطق تخزين المواد القابلة للاشتعال', 0),
('يجب الإبلاغ فوراً عن أي حادث أو إصابة في العمل', 1),
('يمكن تجاهل علامات التحذير إذا كنت على عجلة', 0),
('يجب استخدام الأحذية المخصصة للسلامة في مواقع العمل', 1),
('القفازات غير ضرورية عند التعامل مع المواد الكيميائية', 0),
('يجب معرفة موقع مخارج الطوارئ في مكان العمل', 1),
('يمكن إزالة واقيات الآلات لتسريع العمل', 0),
('يجب رفع الأحمال الثقيلة بطريقة صحيحة لتجنب الإصابات', 1),
('العمل على ارتفاعات عالية لا يحتاج لأحزمة أمان', 0),
('يجب التأكد من سلامة السلالم قبل استخدامها', 1),
('يمكن استخدام معدات تالفة إذا لم يكن هناك بديل', 0),
('يجب غسل اليدين بعد التعامل مع المواد الخطرة', 1),
('الضجيج العالي في مكان العمل غير مضر', 0),
('يجب ارتداء نظارات الحماية عند قطع المعادن', 1),
('يمكن تخطي تعليمات السلامة إذا كنت خبيراً', 0),
('يجب الحفاظ على نظافة وترتيب مكان العمل', 1),
('إطفاء الحريق بالماء مناسب لجميع أنواع الحرائق', 0),
('يجب معرفة كيفية استخدام طفايات الحريق', 1),
('يمكن العمل تحت تأثير التعب الشديد دون مشاكل', 0),
('يجب اتباع إجراءات السلامة حتى لو استغرقت وقتاً أطول', 1),
('القفز من الأماكن المرتفعة طريقة آمنة للنزول', 0),
('يجب التأكد من فصل الكهرباء قبل صيانة الأجهزة', 1);
