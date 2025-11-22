# DesignVerse Fashion - Tests

## Test Dosyaları

Bu dizinde backend API'nin entegrasyon testleri bulunmaktadır.

### Kurulum

Test framework'ü henüz yapılandırılmamış. Testleri çalıştırmak için:

```bash
# Jest ve gerekli paketleri yükle
npm install --save-dev jest @types/jest ts-jest

# Jest configuration ekle
npx ts-jest config:init

# package.json'a test script ekle
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

### Mevcut Testler

**api.test.ts** - Temel API entegrasyon testleri:
- Health check
- User registration
- Authentication  
- Photo session CRUD
- Story CRUD
- Static file serving

### Testleri Çalıştırma

```bash
# Tüm testleri çalıştır
npm test

# Watch modunda çalıştır
npm run test:watch

# Specific test dosyası
npm test api.test.ts
```

### Test Geliştirme

Yeni test dosyaları eklerken:
1. `*.test.ts` veya `*.spec.ts` uzantısı kullan
2. `describe` ve `test` blokları kullan
3. Async/await kullan
4. Cleanup işlemlerini unutma

### Örnek Test

```typescript
describe('Feature Name', () => {
  test('should do something', async () => {
    const result = await someFunction();
    expect(result).toBe(expected);
  });
});
```

## Gelecek İyileştirmeler

- [ ] Jest configuration
- [ ] Test database setup
- [ ] Mock data generators
- [ ] E2E tests
- [ ] Load testing
- [ ] Code coverage reports
