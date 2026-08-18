# resources/pgsql/

هذا المجلد يجب أن يحتوي على نسخة PostgreSQL المحمولة (Portable) لويندوز
قبل البناء النهائي — بنية المجلد المتوقعة:

```
resources/pgsql/
├── bin/
│   ├── initdb.exe
│   ├── pg_ctl.exe
│   ├── postgres.exe
│   └── psql.exe
├── lib/
└── share/
```

راجع PHASE6_NOTES.md لتفاصيل المصدر الموصى به وسبب عدم تضمينها في هذا
المستودع مباشرة (حجم الملفات ومتطلبات الترخيص).
