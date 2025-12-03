# دليل النشر على Cloudflare Pages

## المتطلبات الأساسية

1. حساب Cloudflare
2. API Token من Cloudflare
3. Git Repository (اختياري)

## خطوات النشر

### 1. تسجيل الدخول إلى Cloudflare
```bash
npx wrangler login
```

### 2. إنشاء قاعدة بيانات D1
```bash
# إنشاء قاعدة البيانات الإنتاجية
npx wrangler d1 create webapp-production

# انسخ database_id من النتيجة
# ضعه في wrangler.toml في السطر الخاص بـ database_id
```

### 3. إنشاء R2 Bucket للفيديوهات
```bash
npx wrangler r2 bucket create webapp-videos
```

### 4. تحديث wrangler.toml
قم بتحديث ملف `wrangler.toml` بـ `database_id` الصحيح:
```toml
[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "your-database-id-here"  # ضع الـ ID هنا
```

### 5. تطبيق Migrations على قاعدة البيانات الإنتاجية
```bash
npx wrangler d1 migrations apply webapp-production
```

### 6. إنشاء مشروع Cloudflare Pages
```bash
npx wrangler pages project create webapp --production-branch main
```

### 7. بناء المشروع
```bash
npm run build
```

### 8. نشر المشروع
```bash
npx wrangler pages deploy dist --project-name webapp
```

### 9. تهيئة قاعدة البيانات الإنتاجية
بعد النشر، قم بزيارة:
```
https://webapp.pages.dev/api/setup-db
```

## البدائل: النشر عبر GitHub

### 1. ربط Repository بـ Cloudflare Pages

1. انتقل إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اختر "Pages" من القائمة
3. اضغط "Create a project"
4. اختر "Connect to Git"
5. اختر Repository الخاص بك
6. قم بالإعدادات التالية:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

### 2. إضافة Environment Variables

في إعدادات المشروع في Cloudflare Pages، أضف:
- أي متغيرات بيئة إضافية تحتاجها

### 3. ربط D1 Database و R2 Bucket

في إعدادات المشروع:
1. اذهب إلى "Settings" → "Functions"
2. أضف D1 Database Binding:
   - Variable name: `DB`
   - D1 Database: `webapp-production`
3. أضف R2 Bucket Binding:
   - Variable name: `R2`
   - R2 Bucket: `webapp-videos`

## التحقق من النشر

بعد النشر، تحقق من:

1. ✅ الصفحة الرئيسية تعمل
2. ✅ صفحة تسجيل الأدمن تعمل
3. ✅ يمكن تسجيل الدخول كأدمن (admin / admin123)
4. ✅ يمكن إضافة أكواد وصول
5. ✅ يمكن رفع الفيديوهات
6. ✅ يمكن إدارة الأسئلة

## الأوامر المفيدة

```bash
# معاينة محلية
npm run dev:sandbox

# بناء للإنتاج
npm run build

# نشر
npm run deploy:prod

# عرض logs
npx wrangler pages deployment tail

# إدارة D1 Database
npx wrangler d1 execute webapp-production --command="SELECT COUNT(*) FROM admins"
```

## استكشاف الأخطاء

### خطأ: "Database not found"
- تأكد من إنشاء قاعدة البيانات: `npx wrangler d1 create webapp-production`
- تأكد من تطبيق migrations: `npx wrangler d1 migrations apply webapp-production`

### خطأ: "R2 bucket not found"
- تأكد من إنشاء bucket: `npx wrangler r2 bucket create webapp-videos`
- تأكد من الـ binding في wrangler.toml

### الفيديوهات لا تعمل
- تأكد من رفع الفيديوهات عبر لوحة الأدمن
- تحقق من صلاحيات R2 bucket

## الدعم

للمساعدة:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
