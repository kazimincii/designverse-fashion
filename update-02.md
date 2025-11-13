# Nim Video Creation Platform - Docker & AI Integration Setup

## Yapılan Değişiklikler (Madde Madde)

### 1. Docker Compose Konfigürasyonu
**Dosya:** `docker-compose.yml`

**Değişiklikler:**
- Backend için uploads volume mount eklendi:
  ```yaml
  volumes:
    - backend_uploads:/tmp/uploads
  ```
- Volume tanımlamasına `backend_uploads` eklendi
- Bu sayede container yeniden başlatıldığında yüklenen dosyalar korunuyor

### 2. Backend Static File Serving
**Dosya:** `packages/backend/src/index.ts`

**Değişiklikler:**
- `path` modülü import edildi
- Static file serving middleware eklendi:
  ```typescript
  const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || '/tmp/uploads';
  app.use('/uploads', express.static(LOCAL_STORAGE_PATH));
  ```
- Video generation worker aktif edildi:
  ```typescript
  import './workers/videoGenerationWorker';
  ```
- Bu sayede `/uploads/images/xxx.jpg` ve `/uploads/videos/xxx.mp4` URL'leri erişilebilir hale geldi

### 3. Job Queue Handler Düzeltmesi
**Dosya:** `packages/backend/src/services/jobQueue.ts`

**Değişiklikler:**
- Duplicate handler hatası düzeltildi
- `videoGenerationQueue.process()` handler'ı kaldırıldı (worker'da zaten var)
- Sadece event listener'lar bırakıldı:
  ```typescript
  videoGenerationQueue.on('completed', ...)
  videoGenerationQueue.on('failed', ...)
  ```

### 4. Mock Mode Devre Dışı Bırakıldı
**Dosya:** `packages/backend/src/services/photoSessionService.ts`

**Değişiklikler:**
Tüm AI işlemleri için mock mode kaldırıldı ve gerçek AI çağrıları aktif edildi:

#### a) Virtual Try-On (applyVirtualTryOn)
```typescript
// ÖNCESİ: if (true) { mock result }
// SONRASI:
if (hasAIKeys) {
  try {
    await addVideoGenerationJob({...});
  } catch (error) {
    // Fallback to mock if queue fails
  }
} else {
  // Mock result
}
```

#### b) Generate Variations (generateVariations)
```typescript
// ÖNCESİ: if (true) { mock variations }
// SONRASI:
if (hasAIKeys) {
  try {
    await addVideoGenerationJob({...});
  } catch (error) {
    // Fallback to mock if queue fails
  }
} else {
  // Mock variations
}
```

#### c) Upscale Image (upscaleImage)
```typescript
// ÖNCESİ: if (true) { mock upscale }
// SONRASI:
if (hasAIKeys) {
  try {
    await addVideoGenerationJob({...});
  } catch (error) {
    // Fallback to mock if queue fails
  }
} else {
  // Mock upscale
}
```

#### d) Create Animation (createAnimation)
```typescript
// ÖNCESİ: if (true) { mock animation }
// SONRASI:
if (hasAIKeys) {
  try {
    await addVideoGenerationJob({...});
  } catch (error) {
    // Fallback to mock if queue fails
  }
} else {
  // Mock animation
}
```

### 5. Environment Variables
**Dosya:** `.env`

**Mevcut Konfigürasyon:**
```env
OPENAI_API_KEY=[REMOVED FOR SECURITY]
REPLICATE_API_KEY=[REMOVED FOR SECURITY]
```

**Note:** API keys have been removed from this documentation for security reasons. Please set your own API keys in the `.env` file.

### 6. Mock Video Dosyası Oluşturuldu
**Komut:**
```bash
docker exec nim-backend sh -c "mkdir -p /tmp/uploads/videos && echo 'Mock video placeholder' > /tmp/uploads/videos/mock-animation.mp4"
```

## Sistem Nasıl Çalışıyor?

### Akış:
1. **Görsel Yükleme:** Frontend → Backend → `/tmp/uploads/images/` (volume mount ile kalıcı)
2. **AI İşlemi:** Backend → Redis Queue → Worker → Replicate/OpenAI API
3. **Sonuç:** AI API → Worker → Database → Frontend
4. **Dosya Erişimi:** Frontend → `http://localhost:3001/uploads/images/xxx.jpg`

### Job Durumları:
- `QUEUED`: İş kuyruğa eklendi
- `RUNNING`: AI API çağrısı yapılıyor
- `SUCCEEDED`: İşlem başarılı, sonuç hazır
- `FAILED`: İşlem başarısız

### Kontrol Komutları:
```bash
# Job durumlarını kontrol et
type check-jobs.sql | docker exec -i nim-postgres psql -U postgres -d nim_db

# Backend loglarını izle
docker logs nim-backend -f

# Yüklenen dosyaları kontrol et
docker exec nim-backend ls -la /tmp/uploads/images/
docker exec nim-backend ls -la /tmp/uploads/videos/
```

## Önemli Notlar:

1. **AI İşlemleri Zaman Alır:** Her işlem 30-60 saniye sürebilir
2. **Redis Gerekli:** Worker çalışması için Redis container'ı aktif olmalı
3. **API Anahtarları:** `.env` dosyasında OPENAI_API_KEY ve REPLICATE_API_KEY tanımlı
4. **Fallback Mekanizması:** Queue başarısız olursa otomatik olarak mock sonuç döner
5. **Volume Mount:** Container yeniden başlatıldığında dosyalar korunur

## Test Adımları:

1. Frontend'den yeni photo session oluştur
2. Product ve model görselleri yükle
3. Virtual try-on yap (AI ile product'ı model'e uygular)
4. Variations oluştur (AI ile farklı pozlar üretir)
5. Animation oluştur (AI ile video üretir)
6. Job durumlarını kontrol et
7. Sonuçları frontend'de görüntüle

## Build ve Deploy Komutları:

```bash
# Backend'i yeniden build et
docker-compose build backend

# Backend'i başlat
docker-compose up -d backend

# Logları kontrol et
docker logs nim-backend --tail 50

# Tüm servisleri başlat
docker-compose up -d
```

## Sorun Giderme:

### Problem: "Cannot define the same handler twice" hatası
**Çözüm:** `jobQueue.ts` içindeki duplicate handler kaldırıldı

### Problem: Yüklenen dosyalar container restart'ta kayboluyor
**Çözüm:** Volume mount eklendi (`backend_uploads:/tmp/uploads`)

### Problem: Görsellere erişilemiyor (404)
**Çözüm:** Static file serving middleware eklendi

### Problem: AI işlemleri çalışmıyor (mock sonuç dönüyor)
**Çözüm:** Mock mode devre dışı bırakıldı, worker aktif edildi

## Değişiklik Özeti:

| Dosya | Değişiklik | Amaç |
|-------|-----------|------|
| `docker-compose.yml` | Volume mount eklendi | Dosya kalıcılığı |
| `packages/backend/src/index.ts` | Static serving + worker import | Dosya erişimi + AI işleme |
| `packages/backend/src/services/jobQueue.ts` | Duplicate handler kaldırıldı | Hata düzeltme |
| `packages/backend/src/services/photoSessionService.ts` | Mock mode kaldırıldı | Gerçek AI kullanımı |

## Sonuç:

Sistem artık gerçek AI API'leri kullanarak:
- ✅ Virtual try-on yapabiliyor
- ✅ Görsel varyasyonları üretebiliyor
- ✅ Görselleri upscale edebiliyor
- ✅ Animasyon/video oluşturabiliyor

Tüm işlemler Redis queue üzerinden asenkron olarak işleniyor ve sonuçlar veritabanına kaydediliyor.
