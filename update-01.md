# update-01 — Premium Photo Mode (5-Step Fashion Photography)

## 0. Context

This update introduces a new **Premium Photo Mode** on top of the existing AI video storytelling platform.

Goal:  
Let creators (especially fashion / e-commerce brands) turn **basic product + model photos** into **editorial-quality fashion imagery and short animations** in 5 guided steps — without needing a studio, photographer, or retoucher.

---

## 1. High-Level Overview

### 1.1 What We Are Adding

- A new **“Premium Photo (Beta)”** entry in the creation flow.
- A guided **5-step wizard**:

  1. Upload product and model photos  
  2. AI enhancement (poses, lighting, scene)  
  3. Pose & angle variations  
  4. High-resolution upscale (2×, 4×, custom)  
  5. Photo-to-video animation (5–10s, 30 FPS, 1080p)

- Result:
  - A **set of premium still images** (for website, catalog, ads).
  - Optional **short cinematic videos** generated from those images, ready for social media.

### 1.2 Primary User Stories

- “I have basic catalogue shots and a few model photos. I want **editorial-level fashion shoots** for my product in minutes.”
- “I want multiple poses, angles, and moods (minimalist, dynamic, dramatic) for the **same outfit** on the **same face/model**.”
- “I want to **upscale** these for printing or high-end campaigns.”
- “I want to turn my favorite stills into **short social videos** without opening another editor.”

---

## 2. User Flow: 5-Step Premium Photography

Premium Photo Mode is a **wizard-style flow**. Each step is a separate screen with clear progress indicators.

> The text below is aligned with the original Turkish copy and should be reused/translated as needed in the UI and marketing surfaces.

### Step 1 — Upload Product & Model Photos

**User action:**

- Upload:
  - Product-only photos (e.g. flat lay, ghost mannequin, packshot).
  - Model photos (face + body), not necessarily wearing the product.

**System behavior:**

- Detect:
  - Product shape, color, material.
  - Model face, body proportions, pose.
- Perform:
  - Virtual try-on: map the product onto the model.
  - Preserve the **model’s identity (face)** across all generated shots.
- Validation:
  - Enforce minimum resolution (e.g. ≥ 1024px shortest side).
  - Supported formats: JPG, PNG; max file count and size limits.
  - Content safety / NSFW checks (respect platform policy).

### Step 2 — AI Enhancement Process

**User action:**

- Choose:
  - Scene style presets (e.g. studio, urban, editorial, lifestyle).
  - Lighting presets (soft, dramatic, high-key, etc.) – optional.
- Click **“Generate Editorial Shots”**.

**System behavior:**

- Generate a set of **new poses and scenes** for the model wearing the product:
  - Adjust body pose, head tilt, hand positions.
  - Re-compose background (according to chosen style).
  - Apply **professional lighting** and contrast suitable for fashion shoots.
- Ensure:
  - Face consistency across all generated images.
  - Product fidelity (color, texture, logos stay accurate as much as model allows).

### Step 3 — Pose & Angle Variations

**User action:**

- Select:
  - Desired “mood” / style:
    - Minimalist
    - Dynamic
    - Dramatic  
- Select:
  - Desired framing presets:
    - Close-up (face / product detail)
    - Waist-up
    - Full-body
    - Back view / side view, etc.
- Choose the number of variations (e.g. 4 / 8 / 12).

**System behavior:**

- Generate variant shots of **the same model + product** with:
  - Different poses (walking, turning, looking away, interacting with product).
  - Different camera angles (low angle, eye-level, slight top-down).
- Organize results into a **variation grid**:
  - Allow marking “favorites”.
  - Allow discarding unwanted ones.

### Step 4 — High-Resolution Upscale

**User action:**

- Pick upscale factor:
  - 2×
  - 4×
  - Custom (up to configured limit, e.g. target resolution input).
- Choose **output profile**:
  - Web (balanced file size / quality).
  - Print (maximum detail).

**System behavior:**

- Run images through the **AI upscaling pipeline**:
  - Preserve fine details: fabric texture, stitching, accessories.
  - Minimize halos and artifacts around edges.
- Output:
  - Print-ready versions (as far as model output allows).
  - Optional metadata about original vs upscaled resolution.

> Copy source example (TR, to be localized):  
> “Vibedesign'ın AI upscaling teknolojisiyle görsellerinizi baskı kalitesine çıkarın. Detay kaybı olmadan 2×, 4× veya özel çözünürlükte büyütün.”

### Step 5 — Create Video Animation

**User action:**

- Choose:
  - Duration: 5–10 seconds (range or presets: 5s, 7s, 10s).
  - Format: 1080p, 30 FPS.
  - Animation style:
    - “Subtle cinematic” (slow push-in / pan).
    - “Lookbook” (sequence of stills with crossfades).
    - “Dynamic” (quick cuts, zoom effects).
- Pick which still images from previous steps will be used.

**System behavior:**

- Turn selected stills into a **short cinematic clip**:
  - Apply camera-like motion (Ken Burns, parallax, subtle 3D feel if model supports).
  - Add automatic cuts between poses.
- Output:
  - 1080p, 30 FPS MP4 (baseline).
  - Duration 5–10 seconds depending on user choice.
- Option:
  - Allow sending resulting video **directly into the existing Story Editor** as a clip.
  - Or download / share as standalone asset.

---

## 3. Functional Requirements

### 3.1 Entry Points & Navigation

- Add “Premium Photo (Beta)” to:
  - Main “Create” menu.
  - Possibly a homepage banner or onboarding spotlight.

- Users can:
  - Start from scratch (product + model).
  - Or from existing assets already uploaded in the workspace.

### 3.2 Model & Pipeline Requirements

- Requires access to:
  - **Virtual try-on / garment transfer** model that:
    - Takes product images + model image.
    - Outputs model wearing the product.
  - **Pose generation & scene recomposition** model (or chained pipeline).
  - **Super-resolution / upscaling** model.
  - **Image-to-video** or animation model to generate 5–10s videos.

- Each step should be modeled as a **Job**:
  - `photo_tryon_job`
  - `photo_enhance_job`
  - `photo_variation_job`
  - `photo_upscale_job`
  - `photo_animation_job`

- Use queues & workers similar to existing video generation jobs.

### 3.3 UX & Error Handling

- Each step must:
  - Show **progress and status** (queued, processing, done).
  - Provide clear error messages for:
    - Invalid input formats.
    - Resolution too low.
    - Safety / policy violations.
  - Allow user to **go back** and change parameters.

- Autosave:
  - The entire 5-step session should be saved as a **Photo Session** object.
  - Users can leave and come back without losing progress.

---

## 4. Data Model Extensions (Conceptual)

New / extended entities (names are indicative):

**PhotoSession**
- id  
- owner_user_id  
- title  
- status (draft / completed)  
- created_at, updated_at  

**PhotoAsset**
- id  
- session_id  
- type (product, model, generated, upscaled, animation_cover)  
- source_type (uploaded / generated)  
- url  
- resolution_w, resolution_h  
- related_job_id (if generated)  
- metadata_json (pose, camera, style, etc.)  
- created_at  

**PhotoAnimation**
- id  
- session_id  
- video_url  
- duration_seconds  
- fps (e.g. 30)  
- resolution (e.g. 1920×1080)  
- style (subtle / lookbook / dynamic)  
- created_at  

Existing **Job**, **User**, and **Story** models can be reused/linked where relevant.

---

## 5. Integration with Existing Story System

- From the final step of Premium Photo Mode:
  - **“Send to Story Editor”** button:
    - Adds the generated animation clip (and optionally selected stills) as:
      - A new Story, or
      - New clips in an existing Story (user choice in a modal).
- From the Story Editor:
  - Optionally allow:
    - “Create premium photo shoot for this product” shortcut that opens the wizard pre-populated with related assets (future enhancement, not mandatory in this update).

---

## 6. Analytics & Success Metrics (For This Update)

Examples:

- Number of **Photo Sessions** created per week.
- Completion rate from Step 1 → Step 5.
- Average number of variations generated per product.
- % of sessions that produce at least:
  - One upscaled image.
  - One animation video.
- % of animations that get exported into Stories or downloaded.
- Conversion lift to paid plan among users who use Premium Photo Mode.

---

## 7. User-Facing Copy (Original TR)

> Aşağıdaki metin ürün/marketing yüzü için ham içeriktir; lokalizasyon ve marka adı (Nim / Vibedesign vb.) kararı sonradan güncellenmelidir.

**5 Adımda Premium Fotoğrafçılık**  
Basit fotoğraftan premium moda çekimine saniyeler içinde. AI, aydınlatma, kompozisyon ve post-prodüksiyonu otomatik halleder.

**Adım 1 — Ürün Fotoğraflarınızı ve Mankeninizi Yükleyin**  
Ürün fotoğraflarınızı ve model görselinizi yükleyin. AI'mız görsellerinizi analiz eder, manken yüzünü koruyarak ürününüzü modele giydirip profesyonel editöryel çekimler oluşturur.

**Adım 2 — AI İyileştirme Süreci**  
Gelişmiş AI'mız yeni pozlar ve sahneler oluşturur, profesyonel aydınlatma uygular ve hipergerçekçi moda çekimleri üretir.

**Adım 3 — Poz & Açı Varyasyonları Oluşturun**  
Aynı üründen farklı pozlar ve kamera açıları oluşturun. Minimalist, dinamik veya dramatik—her kampanyaya uygun varyasyonlar saniyeler içinde.

**Adım 4 — Yüksek Çözünürlük (Upscale)**  
Orijinalden daha keskin, daha gerçek. Vibedesign'ın AI upscaling teknolojisiyle görsellerinizi baskı kalitesine çıkarın. Detay kaybı olmadan 2×, 4× veya özel çözünürlükte büyütün.

**Adım 5 — Video Animasyon Oluştur**  
Fotoğraf değil, sahne. Görsellerinizi sinematik videolara dönüştürün. Işık, derinlik ve hareketle sosyal medya için kusursuz, profesyonel animasyonlar oluşturun.

**Teknik Hedefler (Örnek)**  
- 5–10 Saniye  
- 30 FPS Akıcılık  
- 1080p HD Kalite

---
s
