import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// ==================== Database Setup ====================

// تهيئة قاعدة البيانات (للتطوير فقط)
app.get('/api/setup-db', async (c) => {
  try {
    // إنشاء جدول الأدمن
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // إنشاء جدول العمال
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        employee_number TEXT UNIQUE NOT NULL,
        access_code TEXT NOT NULL,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        can_retake_exam INTEGER DEFAULT 0
      )
    `).run();
    
    // إنشاء جدول الأسئلة
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_text TEXT NOT NULL,
        is_correct_true INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // إنشاء جدول الفيديوهات
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_name TEXT NOT NULL,
        video_title TEXT NOT NULL,
        video_url TEXT NOT NULL,
        video_order INTEGER NOT NULL,
        section_order INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // إنشاء جدول متابعة مشاهدة الفيديوهات
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS video_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL,
        video_id INTEGER NOT NULL,
        watched INTEGER DEFAULT 0,
        watched_at DATETIME,
        FOREIGN KEY (worker_id) REFERENCES workers(id),
        FOREIGN KEY (video_id) REFERENCES videos(id),
        UNIQUE(worker_id, video_id)
      )
    `).run();
    
    // إنشاء جدول النتائج
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS exam_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        percentage REAL NOT NULL,
        passed INTEGER NOT NULL,
        exam_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      )
    `).run();
    
    // إنشاء جدول أكواد الوصول
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS access_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        employee_number TEXT NOT NULL,
        job_title TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // إدراج أدمن افتراضي
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO admins (username, password) VALUES ('admin', 'admin123')
    `).run();
    
    // إدراج أسئلة تجريبية
    const questions = [
      'يجب ارتداء خوذة السلامة في جميع مناطق العمل',
      'يمكن العمل بدون معدات الحماية الشخصية إذا كان العمل قصيراً',
      'يجب فحص معدات السلامة قبل استخدامها',
      'التدخين مسموح في مناطق تخزين المواد القابلة للاشتعال',
      'يجب الإبلاغ فوراً عن أي حادث أو إصابة في العمل',
      'يمكن تجاهل علامات التحذير إذا كنت على عجلة',
      'يجب استخدام الأحذية المخصصة للسلامة في مواقع العمل',
      'القفازات غير ضرورية عند التعامل مع المواد الكيميائية',
      'يجب معرفة موقع مخارج الطوارئ في مكان العمل',
      'يمكن إزالة واقيات الآلات لتسريع العمل',
      'يجب رفع الأحمال الثقيلة بطريقة صحيحة لتجنب الإصابات',
      'العمل على ارتفاعات عالية لا يحتاج لأحزمة أمان',
      'يجب التأكد من سلامة السلالم قبل استخدامها',
      'يمكن استخدام معدات تالفة إذا لم يكن هناك بديل',
      'يجب غسل اليدين بعد التعامل مع المواد الخطرة',
      'الضجيج العالي في مكان العمل غير مضر',
      'يجب ارتداء نظارات الحماية عند قطع المعادن',
      'يمكن تخطي تعليمات السلامة إذا كنت خبيراً',
      'يجب الحفاظ على نظافة وترتيب مكان العمل',
      'إطفاء الحريق بالماء مناسب لجميع أنواع الحرائق',
      'يجب معرفة كيفية استخدام طفايات الحريق',
      'يمكن العمل تحت تأثير التعب الشديد دون مشاكل',
      'يجب اتباع إجراءات السلامة حتى لو استغرقت وقتاً أطول',
      'القفز من الأماكن المرتفعة طريقة آمنة للنزول',
      'يجب التأكد من فصل الكهرباء قبل صيانة الأجهزة'
    ];
    
    const answers = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
    
    for (let i = 0; i < questions.length; i++) {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO questions (question_text, is_correct_true) VALUES (?, ?)
      `).bind(questions[i], answers[i]).run();
    }
    
    return c.json({ success: true, message: 'تم تهيئة قاعدة البيانات بنجاح' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ==================== API Routes ====================

// تسجيل دخول الأدمن
app.post('/api/admin/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    const admin = await c.env.DB.prepare(
      'SELECT * FROM admins WHERE username = ? AND password = ?'
    ).bind(username, password).first();
    
    if (admin) {
      return c.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    } else {
      return c.json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, 401);
    }
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// التحقق من كود الوصول
app.post('/api/verify-code', async (c) => {
  try {
    const { code } = await c.req.json();
    
    const accessCode = await c.env.DB.prepare(
      'SELECT * FROM access_codes WHERE code = ? AND used = 0'
    ).bind(code).first();
    
    if (accessCode) {
      return c.json({ success: true, data: accessCode });
    } else {
      return c.json({ success: false, message: 'كود الوصول غير صحيح أو مستخدم مسبقاً' }, 404);
    }
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// تسجيل عامل جديد
app.post('/api/workers/register', async (c) => {
  try {
    const { full_name, employee_number, access_code } = await c.req.json();
    
    // التحقق من كود الوصول
    const code = await c.env.DB.prepare(
      'SELECT * FROM access_codes WHERE code = ? AND employee_number = ?'
    ).bind(access_code, employee_number).first();
    
    if (!code) {
      return c.json({ success: false, message: 'كود الوصول أو الرقم الوظيفي غير صحيح' }, 400);
    }
    
    // التحقق من عدم التسجيل مسبقاً
    const existingWorker = await c.env.DB.prepare(
      'SELECT * FROM workers WHERE employee_number = ?'
    ).bind(employee_number).first();
    
    if (existingWorker) {
      return c.json({ success: false, message: 'الرقم الوظيفي مسجل مسبقاً' }, 400);
    }
    
    // تسجيل العامل
    const result = await c.env.DB.prepare(
      'INSERT INTO workers (full_name, employee_number, access_code) VALUES (?, ?, ?)'
    ).bind(full_name, employee_number, access_code).run();
    
    // تحديث حالة كود الوصول
    await c.env.DB.prepare(
      'UPDATE access_codes SET used = 1 WHERE code = ?'
    ).bind(access_code).run();
    
    return c.json({ 
      success: true, 
      message: 'تم التسجيل بنجاح',
      worker_id: result.meta.last_row_id
    });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في التسجيل' }, 500);
  }
});

// الحصول على معلومات العامل
app.get('/api/workers/:employee_number', async (c) => {
  try {
    const employee_number = c.req.param('employee_number');
    
    const worker = await c.env.DB.prepare(
      'SELECT * FROM workers WHERE employee_number = ?'
    ).bind(employee_number).first();
    
    if (worker) {
      return c.json({ success: true, data: worker });
    } else {
      return c.json({ success: false, message: 'العامل غير موجود' }, 404);
    }
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// الحصول على جميع الفيديوهات مرتبة
app.get('/api/videos', async (c) => {
  try {
    const videos = await c.env.DB.prepare(
      'SELECT * FROM videos ORDER BY section_order, video_order'
    ).all();
    
    return c.json({ success: true, data: videos.results });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// الحصول على تقدم مشاهدة الفيديوهات للعامل
app.get('/api/videos/progress/:worker_id', async (c) => {
  try {
    const worker_id = c.req.param('worker_id');
    
    const progress = await c.env.DB.prepare(
      'SELECT * FROM video_progress WHERE worker_id = ?'
    ).bind(worker_id).all();
    
    return c.json({ success: true, data: progress.results });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// تحديث حالة مشاهدة فيديو
app.post('/api/videos/watch', async (c) => {
  try {
    const { worker_id, video_id } = await c.req.json();
    
    await c.env.DB.prepare(`
      INSERT INTO video_progress (worker_id, video_id, watched, watched_at)
      VALUES (?, ?, 1, datetime('now'))
      ON CONFLICT(worker_id, video_id) DO UPDATE SET watched = 1, watched_at = datetime('now')
    `).bind(worker_id, video_id).run();
    
    return c.json({ success: true, message: 'تم تسجيل المشاهدة' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// الحصول على أسئلة الاختبار (20 سؤال عشوائي)
app.get('/api/questions/random/:worker_id', async (c) => {
  try {
    const worker_id = c.req.param('worker_id');
    
    // التحقق من أن العامل شاهد جميع الفيديوهات
    const totalVideos = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM videos'
    ).first();
    
    const watchedVideos = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM video_progress WHERE worker_id = ? AND watched = 1'
    ).bind(worker_id).first();
    
    if (totalVideos?.count !== watchedVideos?.count) {
      return c.json({ 
        success: false, 
        message: 'يجب مشاهدة جميع الفيديوهات قبل الاختبار' 
      }, 400);
    }
    
    // الحصول على 20 سؤال عشوائي
    const questions = await c.env.DB.prepare(
      'SELECT id, question_text FROM questions ORDER BY RANDOM() LIMIT 20'
    ).all();
    
    return c.json({ success: true, data: questions.results });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// تقديم إجابات الاختبار
app.post('/api/exam/submit', async (c) => {
  try {
    const { worker_id, answers } = await c.req.json();
    
    // التحقق من إمكانية إعادة الاختبار
    const worker = await c.env.DB.prepare(
      'SELECT can_retake_exam FROM workers WHERE id = ?'
    ).bind(worker_id).first();
    
    const previousExam = await c.env.DB.prepare(
      'SELECT * FROM exam_results WHERE worker_id = ?'
    ).bind(worker_id).first();
    
    if (previousExam && worker?.can_retake_exam === 0) {
      return c.json({ 
        success: false, 
        message: 'لقد قمت بالاختبار مسبقاً' 
      }, 400);
    }
    
    // حساب الدرجة
    let score = 0;
    for (const answer of answers) {
      const question = await c.env.DB.prepare(
        'SELECT is_correct_true FROM questions WHERE id = ?'
      ).bind(answer.question_id).first();
      
      if (question && question.is_correct_true === answer.answer) {
        score++;
      }
    }
    
    const percentage = (score / 20) * 100;
    const passed = percentage >= 70 ? 1 : 0;
    
    // حفظ النتيجة
    await c.env.DB.prepare(
      'INSERT INTO exam_results (worker_id, score, percentage, passed) VALUES (?, ?, ?, ?)'
    ).bind(worker_id, score, percentage, passed).run();
    
    // تحديث حالة إعادة الاختبار
    await c.env.DB.prepare(
      'UPDATE workers SET can_retake_exam = 0 WHERE id = ?'
    ).bind(worker_id).run();
    
    return c.json({ 
      success: true, 
      data: { score, percentage, passed }
    });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// ==================== Admin API Routes ====================

// إضافة كود وصول جديد
app.post('/api/admin/access-codes', async (c) => {
  try {
    const { code, full_name, employee_number, job_title } = await c.req.json();
    
    await c.env.DB.prepare(
      'INSERT INTO access_codes (code, full_name, employee_number, job_title) VALUES (?, ?, ?, ?)'
    ).bind(code, full_name, employee_number, job_title).run();
    
    return c.json({ success: true, message: 'تم إضافة الكود بنجاح' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// الحصول على جميع أكواد الوصول
app.get('/api/admin/access-codes', async (c) => {
  try {
    const codes = await c.env.DB.prepare(
      'SELECT * FROM access_codes ORDER BY created_at DESC'
    ).all();
    
    return c.json({ success: true, data: codes.results });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// حذف كود وصول
app.delete('/api/admin/access-codes/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(
      'DELETE FROM access_codes WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ success: true, message: 'تم حذف الكود بنجاح' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// إضافة سؤال جديد
app.post('/api/admin/questions', async (c) => {
  try {
    const { question_text, is_correct_true } = await c.req.json();
    
    await c.env.DB.prepare(
      'INSERT INTO questions (question_text, is_correct_true) VALUES (?, ?)'
    ).bind(question_text, is_correct_true).run();
    
    return c.json({ success: true, message: 'تم إضافة السؤال بنجاح' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// الحصول على جميع الأسئلة
app.get('/api/admin/questions', async (c) => {
  try {
    const questions = await c.env.DB.prepare(
      'SELECT * FROM questions ORDER BY created_at DESC'
    ).all();
    
    return c.json({ success: true, data: questions.results });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// تعديل سؤال
app.put('/api/admin/questions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { question_text, is_correct_true } = await c.req.json();
    
    await c.env.DB.prepare(
      'UPDATE questions SET question_text = ?, is_correct_true = ? WHERE id = ?'
    ).bind(question_text, is_correct_true, id).run();
    
    return c.json({ success: true, message: 'تم تعديل السؤال بنجاح' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// حذف سؤال
app.delete('/api/admin/questions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(
      'DELETE FROM questions WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ success: true, message: 'تم حذف السؤال بنجاح' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// إضافة فيديو جديد
app.post('/api/admin/videos', async (c) => {
  try {
    const formData = await c.req.formData();
    const section_name = formData.get('section_name') as string;
    const video_title = formData.get('video_title') as string;
    const video_order = parseInt(formData.get('video_order') as string);
    const section_order = parseInt(formData.get('section_order') as string);
    const videoFile = formData.get('video') as File;
    
    // رفع الفيديو إلى R2
    const videoKey = `videos/${Date.now()}-${videoFile.name}`;
    await c.env.R2.put(videoKey, videoFile);
    
    // حفظ معلومات الفيديو في قاعدة البيانات
    await c.env.DB.prepare(
      'INSERT INTO videos (section_name, video_title, video_url, video_order, section_order) VALUES (?, ?, ?, ?, ?)'
    ).bind(section_name, video_title, videoKey, video_order, section_order).run();
    
    return c.json({ success: true, message: 'تم رفع الفيديو بنجاح' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في رفع الفيديو' }, 500);
  }
});

// حذف فيديو
app.delete('/api/admin/videos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // الحصول على معلومات الفيديو
    const video = await c.env.DB.prepare(
      'SELECT video_url FROM videos WHERE id = ?'
    ).bind(id).first();
    
    if (video) {
      // حذف الفيديو من R2
      await c.env.R2.delete(video.video_url as string);
      
      // حذف من قاعدة البيانات
      await c.env.DB.prepare(
        'DELETE FROM videos WHERE id = ?'
      ).bind(id).run();
    }
    
    return c.json({ success: true, message: 'تم حذف الفيديو بنجاح' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// الحصول على الفيديو من R2
app.get('/api/videos/stream/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const object = await c.env.R2.get(decodeURIComponent(key));
    
    if (!object) {
      return c.notFound();
    }
    
    return new Response(object.body, {
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// الحصول على جميع النتائج
app.get('/api/admin/results', async (c) => {
  try {
    const results = await c.env.DB.prepare(`
      SELECT 
        er.id,
        w.full_name,
        w.employee_number,
        er.score,
        er.percentage,
        er.passed,
        er.exam_date,
        w.can_retake_exam,
        w.id as worker_id
      FROM exam_results er
      JOIN workers w ON er.worker_id = w.id
      ORDER BY er.exam_date DESC
    `).all();
    
    return c.json({ success: true, data: results.results });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// السماح بإعادة الاختبار
app.put('/api/admin/workers/:id/allow-retake', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(
      'UPDATE workers SET can_retake_exam = 1 WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ success: true, message: 'تم السماح بإعادة الاختبار' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// حذف عامل
app.delete('/api/admin/workers/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // حذف النتائج
    await c.env.DB.prepare(
      'DELETE FROM exam_results WHERE worker_id = ?'
    ).bind(id).run();
    
    // حذف تقدم الفيديوهات
    await c.env.DB.prepare(
      'DELETE FROM video_progress WHERE worker_id = ?'
    ).bind(id).run();
    
    // حذف العامل
    await c.env.DB.prepare(
      'DELETE FROM workers WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ success: true, message: 'تم حذف العامل بنجاح' });
  } catch (error) {
    return c.json({ success: false, message: 'حدث خطأ في النظام' }, 500);
  }
});

// ==================== Frontend Routes ====================

// الصفحة الرئيسية
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مركز التدريب على السلامة المهنية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <i class="fas fa-hard-hat text-3xl animate-bounce"></i>
                <h2 class="text-xl font-semibold">مركز التدريب</h2>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="hero-section min-h-screen flex items-center justify-center pt-20">
        <div class="text-center text-white animate-fadeInUp">
            <h1 class="text-6xl font-bold mb-6 animate-slideInDown">
                السلامة المهنية أولاً
            </h1>
            <p class="text-2xl mb-8 animate-slideInUp">
                دربنا أكثر من 10,000 عامل على معايير السلامة العالمية
            </p>
            <button onclick="location.href='/register'" 
                    class="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-2xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 animate-pulse">
                سجل الآن
            </button>
        </div>
    </div>

    <script src="/static/js/home.js"></script>
</body>
</html>`);
});

// صفحة التسجيل
app.get('/register', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تسجيل العمال</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <i class="fas fa-hard-hat text-3xl animate-bounce"></i>
                <h2 class="text-xl font-semibold">مركز التدريب</h2>
            </div>
        </div>
    </nav>

    <!-- Registration Form -->
    <div class="register-section min-h-screen flex items-center justify-center pt-20 px-4">
        <div class="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fadeInUp">
            <h2 class="text-3xl font-bold text-center text-teal-700 mb-8">
                <i class="fas fa-user-plus ml-2"></i>
                تسجيل عامل جديد
            </h2>
            
            <form id="registerForm" class="space-y-6">
                <div class="animate-slideInRight">
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="fas fa-user ml-2"></i>
                        الاسم الكامل
                    </label>
                    <input type="text" id="full_name" required
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none transition-all">
                </div>

                <div class="animate-slideInRight" style="animation-delay: 0.1s">
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="fas fa-id-card ml-2"></i>
                        الرقم الوظيفي
                    </label>
                    <input type="text" id="employee_number" required
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none transition-all">
                </div>

                <div class="animate-slideInRight" style="animation-delay: 0.2s">
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="fas fa-key ml-2"></i>
                        الرقم السري
                    </label>
                    <input type="password" id="access_code" required
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none transition-all">
                </div>

                <div id="message" class="hidden p-4 rounded-lg text-center font-semibold"></div>

                <button type="submit" 
                        class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg animate-slideInUp">
                    <i class="fas fa-check-circle ml-2"></i>
                    اضغط للتسجيل
                </button>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/register.js"></script>
</body>
</html>`);
});

// صفحة الفيديوهات
app.get('/videos/:worker_id', (c) => {
  const worker_id = c.req.param('worker_id');
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فيديوهات التدريب</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <i class="fas fa-hard-hat text-3xl animate-bounce"></i>
                <h2 class="text-xl font-semibold">مركز التدريب</h2>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 pt-24 pb-12">
        <h1 class="text-4xl font-bold text-center text-teal-700 mb-12 animate-fadeInDown">
            <i class="fas fa-video ml-2"></i>
            فيديوهات التدريب على السلامة
        </h1>

        <div id="videosContainer" class="space-y-8">
            <!-- Videos will be loaded here -->
        </div>

        <div class="text-center mt-12">
            <button id="examButton" disabled
                    class="bg-gray-400 text-white font-bold text-xl px-12 py-6 rounded-full shadow-2xl cursor-not-allowed">
                <i class="fas fa-clipboard-check ml-2"></i>
                ابدأ الاختبار
            </button>
        </div>
    </div>

    <script>
        const workerId = ${worker_id};
    </script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/videos.js"></script>
</body>
</html>`);
});

// صفحة الاختبار
app.get('/exam/:worker_id', (c) => {
  const worker_id = c.req.param('worker_id');
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اختبار السلامة المهنية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <i class="fas fa-hard-hat text-3xl animate-bounce"></i>
                <h2 class="text-xl font-semibold">مركز التدريب</h2>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 pt-24 pb-12">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold text-teal-700">
                    <i class="fas fa-clipboard-check ml-2"></i>
                    اختبار السلامة المهنية
                </h1>
                <div id="timer" class="text-3xl font-bold text-red-600 animate-pulse">
                    <i class="fas fa-clock ml-2"></i>
                    <span id="timerDisplay">10:00</span>
                </div>
            </div>

            <form id="examForm" class="space-y-6">
                <div id="questionsContainer">
                    <!-- Questions will be loaded here -->
                </div>

                <button type="submit" 
                        class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg">
                    <i class="fas fa-paper-plane ml-2"></i>
                    إنهاء الاختبار
                </button>
            </form>
        </div>
    </div>

    <script>
        const workerId = ${worker_id};
    </script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/exam.js"></script>
</body>
</html>`);
});

// صفحة النتيجة
app.get('/result/:worker_id', (c) => {
  const worker_id = c.req.param('worker_id');
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نتيجة الاختبار</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <i class="fas fa-hard-hat text-3xl animate-bounce"></i>
                <h2 class="text-xl font-semibold">مركز التدريب</h2>
            </div>
        </div>
    </nav>

    <div class="min-h-screen flex items-center justify-center pt-20 px-4">
        <div id="resultCard" class="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
            <!-- Result will be loaded here -->
        </div>
    </div>

    <script>
        const workerId = ${worker_id};
    </script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/result.js"></script>
</body>
</html>`);
});

// صفحة تسجيل دخول الأدمن
app.get('/admin', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة تحكم الأدمن</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">HERO</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <i class="fas fa-hard-hat text-3xl animate-bounce"></i>
                <h2 class="text-xl font-semibold">مركز التدريب</h2>
            </div>
        </div>
    </nav>

    <div class="admin-login-section min-h-screen flex items-center justify-center pt-20 px-4">
        <div class="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fadeInUp">
            <h2 class="text-3xl font-bold text-center text-teal-700 mb-8">
                <i class="fas fa-user-shield ml-2"></i>
                تسجيل دخول الأدمن
            </h2>
            
            <form id="adminLoginForm" class="space-y-6">
                <div class="animate-slideInRight">
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="fas fa-user ml-2"></i>
                        اسم المستخدم
                    </label>
                    <input type="text" id="username" required
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none transition-all">
                </div>

                <div class="animate-slideInRight" style="animation-delay: 0.1s">
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="fas fa-lock ml-2"></i>
                        كلمة المرور
                    </label>
                    <input type="password" id="password" required
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none transition-all">
                </div>

                <div id="message" class="hidden p-4 rounded-lg text-center font-semibold"></div>

                <button type="submit" 
                        class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg animate-slideInUp">
                    <i class="fas fa-sign-in-alt ml-2"></i>
                    تسجيل الدخول
                </button>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/admin-login.js"></script>
</body>
</html>`);
});

// لوحة تحكم الأدمن الرئيسية
app.get('/admin/dashboard', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة التحكم</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <i class="fas fa-hard-hat text-3xl animate-bounce"></i>
                <h2 class="text-xl font-semibold">مركز التدريب</h2>
            </div>
        </div>
    </nav>

    <div class="admin-dashboard-section min-h-screen pt-24 px-4">
        <div class="container mx-auto">
            <h1 class="text-4xl font-bold text-center text-teal-700 mb-12 animate-fadeInDown">
                <i class="fas fa-cogs ml-2"></i>
                لوحة التحكم
            </h1>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                <a href="/admin/questions" 
                   class="dashboard-card bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition-all duration-300 animate-fadeInUp">
                    <i class="fas fa-question-circle text-6xl text-blue-600 mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800">إدارة الأسئلة</h3>
                </a>

                <a href="/admin/access-codes" 
                   class="dashboard-card bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition-all duration-300 animate-fadeInUp" style="animation-delay: 0.1s">
                    <i class="fas fa-key text-6xl text-green-600 mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800">الأرقام السرية</h3>
                </a>

                <a href="/admin/results" 
                   class="dashboard-card bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition-all duration-300 animate-fadeInUp" style="animation-delay: 0.2s">
                    <i class="fas fa-chart-bar text-6xl text-purple-600 mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800">النتائج</h3>
                </a>

                <a href="/admin/videos" 
                   class="dashboard-card bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition-all duration-300 animate-fadeInUp" style="animation-delay: 0.3s">
                    <i class="fas fa-video text-6xl text-red-600 mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800">رفع الفيديوهات</h3>
                </a>
            </div>
        </div>
    </div>

    <script src="/static/js/admin-dashboard.js"></script>
</body>
</html>`);
});

// صفحة إدارة الأسئلة
app.get('/admin/questions', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة الأسئلة</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <a href="/admin/dashboard" class="hover:text-yellow-300 transition-colors">
                    <i class="fas fa-arrow-right ml-2"></i>
                    العودة للوحة التحكم
                </a>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 pt-24 pb-12">
        <h1 class="text-4xl font-bold text-center text-teal-700 mb-8">
            <i class="fas fa-question-circle ml-2"></i>
            إدارة الأسئلة
        </h1>

        <div class="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">إضافة سؤال جديد</h2>
            <form id="addQuestionForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">نص السؤال</label>
                    <textarea id="question_text" required rows="3"
                              class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none"></textarea>
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">الإجابة الصحيحة</label>
                    <div class="space-y-2">
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="answer" value="1" required class="ml-2 w-5 h-5">
                            <span class="text-lg">صح</span>
                        </label>
                        <label class="flex items-center cursor-pointer">
                            <input type="radio" name="answer" value="0" class="ml-2 w-5 h-5">
                            <span class="text-lg">خطأ</span>
                        </label>
                    </div>
                </div>
                <button type="submit" 
                        class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
                    <i class="fas fa-plus ml-2"></i>
                    إضافة السؤال
                </button>
            </form>
        </div>

        <div class="bg-white rounded-2xl shadow-xl p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">الأسئلة الموجودة</h2>
            <div id="questionsContainer" class="space-y-4">
                <!-- Questions will be loaded here -->
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/admin-questions.js"></script>
</body>
</html>`);
});

// صفحة إدارة الأرقام السرية
app.get('/admin/access-codes', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة الأرقام السرية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <a href="/admin/dashboard" class="hover:text-yellow-300 transition-colors">
                    <i class="fas fa-arrow-right ml-2"></i>
                    العودة للوحة التحكم
                </a>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 pt-24 pb-12">
        <h1 class="text-4xl font-bold text-center text-teal-700 mb-8">
            <i class="fas fa-key ml-2"></i>
            إدارة الأرقام السرية
        </h1>

        <div class="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">إضافة رقم سري جديد</h2>
            <form id="addCodeForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">الاسم الكامل</label>
                    <input type="text" id="full_name" required
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">الرقم الوظيفي</label>
                    <input type="text" id="employee_number" required
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">المسمى الوظيفي</label>
                    <input type="text" id="job_title" required
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">الرقم السري</label>
                    <input type="text" id="code" required
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none">
                </div>
                <div class="md:col-span-2">
                    <button type="submit" 
                            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
                        <i class="fas fa-plus ml-2"></i>
                        إضافة الرقم السري
                    </button>
                </div>
            </form>
        </div>

        <div class="bg-white rounded-2xl shadow-xl p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">الأرقام السرية المتاحة</h2>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-teal-600 text-white">
                        <tr>
                            <th class="px-4 py-3 text-right">الاسم</th>
                            <th class="px-4 py-3 text-right">الرقم الوظيفي</th>
                            <th class="px-4 py-3 text-right">المسمى الوظيفي</th>
                            <th class="px-4 py-3 text-right">الرقم السري</th>
                            <th class="px-4 py-3 text-right">الحالة</th>
                            <th class="px-4 py-3 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="codesTableBody">
                        <!-- Codes will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/admin-access-codes.js"></script>
</body>
</html>`);
});

// صفحة النتائج
app.get('/admin/results', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نتائج الاختبارات</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <a href="/admin/dashboard" class="hover:text-yellow-300 transition-colors">
                    <i class="fas fa-arrow-right ml-2"></i>
                    العودة للوحة التحكم
                </a>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 pt-24 pb-12">
        <h1 class="text-4xl font-bold text-center text-teal-700 mb-8">
            <i class="fas fa-chart-bar ml-2"></i>
            نتائج الاختبارات
        </h1>

        <div class="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <button onclick="exportToExcel()" 
                    class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
                <i class="fas fa-file-excel ml-2"></i>
                تصدير إلى Excel
            </button>
        </div>

        <div class="bg-white rounded-2xl shadow-xl p-6">
            <div class="overflow-x-auto">
                <table id="resultsTable" class="w-full">
                    <thead class="bg-teal-600 text-white">
                        <tr>
                            <th class="px-4 py-3 text-right">الاسم</th>
                            <th class="px-4 py-3 text-right">الرقم الوظيفي</th>
                            <th class="px-4 py-3 text-right">الدرجة</th>
                            <th class="px-4 py-3 text-right">النسبة</th>
                            <th class="px-4 py-3 text-right">النتيجة</th>
                            <th class="px-4 py-3 text-right">التاريخ</th>
                            <th class="px-4 py-3 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="resultsTableBody">
                        <!-- Results will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <script src="/static/js/admin-results.js"></script>
</body>
</html>`);
});

// صفحة رفع الفيديوهات
app.get('/admin/videos', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رفع الفيديوهات</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <nav class="bg-teal-700 text-white p-4 fixed w-full top-0 z-50 shadow-lg">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4 space-x-reverse">
                <img src="/static/images/logo.png" alt="شعار الشركة" class="h-12 w-12 rounded-full animate-pulse" onerror="this.style.display='none'">
                <h1 class="text-2xl font-bold">Hero</h1>
            </div>
            <div class="flex items-center space-x-4 space-x-reverse">
                <a href="/admin/dashboard" class="hover:text-yellow-300 transition-colors">
                    <i class="fas fa-arrow-right ml-2"></i>
                    العودة للوحة التحكم
                </a>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 pt-24 pb-12">
        <h1 class="text-4xl font-bold text-center text-teal-700 mb-8">
            <i class="fas fa-video ml-2"></i>
            رفع الفيديوهات
        </h1>

        <div class="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">رفع فيديو جديد</h2>
            <form id="uploadVideoForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">اسم القسم</label>
                        <input type="text" id="section_name" required
                               class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">عنوان الفيديو</label>
                        <input type="text" id="video_title" required
                               class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">ترتيب القسم</label>
                        <input type="number" id="section_order" required min="1"
                               class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">ترتيب الفيديو</label>
                        <input type="number" id="video_order" required min="1"
                               class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none">
                    </div>
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">ملف الفيديو</label>
                    <input type="file" id="video_file" required accept="video/*"
                           class="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:border-teal-600 focus:outline-none">
                </div>
                <div id="uploadProgress" class="hidden">
                    <div class="bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div id="progressBar" class="bg-teal-600 h-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <p id="progressText" class="text-center mt-2 font-semibold"></p>
                </div>
                <button type="submit" 
                        class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
                    <i class="fas fa-upload ml-2"></i>
                    رفع الفيديو
                </button>
            </form>
        </div>

        <div class="bg-white rounded-2xl shadow-xl p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">الفيديوهات المرفوعة</h2>
            <div id="videosContainer" class="space-y-4">
                <!-- Videos will be loaded here -->
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/admin-videos.js"></script>
</body>
</html>`);
});

export default app;
