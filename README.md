# Designverse-fashion Video Platform — MVP Specification (v0.1)

## 0. Product Summary

Nim is an AI-native video creation platform that lets creators:
- Generate short videos from text, images, and basic references
- Assemble those clips into simple stories with music and text
- Share them on a social feed and as portfolio items
- Start building an audience and income through future templates and assets

This document defines the **MVP (v0.1)** scope derived from the longer-term roadmap.

---

## 1. Goals & Non-Goals

### 1.1 MVP Goals

- Provide a **single workspace** where creators can:
  - Generate short-form AI videos from prompts
  - Edit their story (timeline, text overlays, single audio track)
  - Share and discover creations via a basic social feed
- Validate:
  - Do creators complete their **first high-quality story** quickly?
  - Do they come back to create more?
  - Do they share their work and attract viewers?

### 1.2 Non-Goals (Post-MVP / Later Phases)

These appear in the roadmap but are **explicitly out of scope for MVP**:

- Custom training for characters, styles, or domains
- Full-featured 3D scene generation and 3D-to-video
- Advanced keyframe systems and complex transitions
- NSFW explore page and dedicated adult-content models
- Full mobile apps (iOS/Android) — MVP is responsive web only
- Multi-cloud cost optimization and complex queue strategies
- Full affiliate program, leaderboards, hosted challenges, and badges
- Deep in-app education library (MVP will have minimal starter content)

---

## 2. Target Users & Core Use Cases

### 2.1 Primary Personas

1. **Short-form Creator (TikTok/Reels/Shorts)**
   - Wants to quickly generate eye-catching clips and assemble them into a story.
   - Needs templates, fast generation, and easy social export.

2. **Solo Creative Pro (Designer / Marketer / Founder)**
   - Uses Nim to produce explainer videos, pitches, ads.
   - Cares about quality, branding, and simple collaboration.

3. **Aspiring AI Creator**
   - Wants to experiment with AI video without complex tools.
   - Needs guidance, default templates, and a forgiving UX.

### 2.2 Core MVP Use Cases

- UC1: Create an account and complete an onboarding story in < 30 minutes.
- UC2: Generate **a short video clip** (5–15 seconds) from a text prompt.
- UC3: Turn a few clips into a **story** with basic timeline edit:
  - Arrange clips, trim, add one background music track, add text overlays.
- UC4: Publish the story to:
  - Public Nim URL
  - Appear in global/home feed
- UC5: View, like, and comment on stories from other creators.
- UC6: Manage creations in a basic workspace (folders/projects).

---

## 3. MVP Feature Scope

### 3.1 AI Models & Tools (Core)

**MVP Objective:** Allow creators to generate useful short clips with minimal friction.

#### 3.1.1 Foundational Model Integration

- Integrate at least **one commercial text-to-video API** provider.
- Support:
  - Text → video (primary)
  - (Optional but desired) Image → video (extend/animate a still image)
- Basic generation parameters:
  - Duration presets: 5s / 10s / 15s
  - Aspect ratios: 9:16, 1:1, 16:9
  - Resolution presets: e.g. 720p
  - FPS preset: e.g. 24 fps

#### 3.1.2 Prompt Tools

- **Prompt Enhancer (MVP)**:
  - User enters a short idea.
  - System suggests 2–3 “enhanced prompts” including:
    - Camera hints
    - Style hints
    - More concrete actions
- **Comprehension Tools (MVP-light)**:
  - “Describe this clip” for an uploaded or generated video:
    - Summarize what happens in the video in 1–2 sentences.
  - “Suggest improvements”:
    - Short list (e.g. “add more close-ups”, “try a darker mood”).

#### 3.1.3 Quality Tools

- **Basic Upscale / Enhance**:
  - One-click “Improve quality” that:
    - Requests higher-quality settings from the same model OR
    - Applies a secondary enhancement model (if provider supports).
- **Basic Restyle**:
  - Prompt-based restyle: user selects existing clip and enters a style prompt (e.g. “cinematic, golden hour”).

> Out of scope for MVP, but in roadmap: Inpainting, outpainting, advanced lip-sync, Foley, full green-screen compositing, deep negative-prompt controls.

---

### 3.2 Story-Level Tools

**Goal:** Let users go from **clips → coherent story** with a minimal editor.

#### 3.2.1 Story Editor (Timeline)

- Linear track-based editor:
  - Clips track (reorder, trim in/out).
  - Single music track (one audio layer for the whole story).
  - Text overlays track (per clip).
- Clip operations:
  - Add clip (from generation or upload).
  - Reorder via drag-and-drop.
  - Trim in/out.
  - Delete.
- Text overlays:
  - Simple styles: position presets (top/bottom/center), size, weight.
  - Basic fade-in/out transitions.
- Preview:
  - Play full story.
  - Show estimated duration.

#### 3.2.2 Story Templates (MVP)

- 3–5 built-in templates:
  - “Product showcase”
  - “Talking-head + B-roll”
  - “Travel montage”
- Each template predefines:
  - Number of clips and approximate duration per clip.
  - Suggested prompts for each clip.
  - Basic transitions and text defaults.

#### 3.2.3 Export & Publishing

- Export as MP4 (single resolution preset for MVP).
- Hosted **public story page**:
  - Player
  - Title, description, creator handle
  - Like count, comments
- One-click share links:
  - Copy link
  - Share to X (Twitter) / TikTok / generic

---

### 3.3 Social Features (MVP)

**Goal:** Make creations visible and create feedback loops.

#### 3.3.1 Feed & Discovery

- Global **Home Feed**:
  - Sorted by “recent & popular” heuristic.
  - Cards show:
    - Thumbnail / cover frame
    - Title
    - Creator handle
    - Basic metrics (views, likes)
- **Following Feed**:
  - Shows stories from creators the user follows.

#### 3.3.2 Creator Profiles (Portfolio-lite)

- Public profile page:
  - Avatar, display name, short bio, social links (optional).
  - Grid of public stories.
- “Set as featured” for selected stories (max N).

#### 3.3.3 Social Interactions

- Likes:
  - One-tap like on story.
  - Like count visible.
- Comments:
  - Basic comment thread per story.
  - Delete own comments.
- Activity Notifications (MVP):
  - In-app notifications for:
    - New like on story.
    - New comment on story.
    - New follower.
  - Simple notifications dropdown.

> Badges, hosted challenges, leaderboards are post-MVP.

---

### 3.4 Workspace & UX

**Goal:** Provide a modern but simple workspace: projects, folders, privacy.

#### 3.4.1 Project & Folder System

- Entities:
  - **Story** (main project object).
  - **Folder** (optional grouping).
- Basic behaviors:
  - Create / rename / move / delete folders.
  - Move a story between folders.
  - Default “All Stories” and “Unsorted” views.

#### 3.4.2 Reference Management (MVP)

- Users can **upload reference images** and short reference videos.
- Use cases:
  - Prompt context (“use this as visual style reference” — text annotation only).
  - B-roll planner (MVP-light: static suggestions, no complex automation).
- Minimal metadata:
  - Name, type (image/video), tags.

#### 3.4.3 Privacy Controls

- Per-story privacy settings:
  - Private (only user).
  - Unlisted (anyone with link).
  - Public (listed in feeds & profile).
- Default: **Unlisted** or **Private** (TBD via product decision).

#### 3.4.4 Chat Assistant & Guidance (MVP)

- Context-limited Chat Assistant in the editor:
  - Suggest prompts for next clip.
  - Rewrite prompts for clarity.
  - Suggest story structure ideas.

---

### 3.5 Performance & Scalability (MVP level)

**Objective:** Keep architecture simple but prepared for growth.

- Single cloud provider with:
  - **App backend** (API, auth, data).
  - **Queue + worker** system for generation jobs.
- Basic job lifecycle:
  - User submits generation request.
  - Job stored in DB + enqueued.
  - Worker calls external model API and stores result.
  - Frontend polls or uses websockets for status.
- Basic safeguards:
  - Per-user rate limits.
  - Simple priority: paid > free queue.

Detailed cost optimization, on-device generation, and multi-cloud balancing are post-MVP.

---

### 3.6 Growth & Monetization

#### 3.6.1 Plans & Credits (MVP)

- Free plan:
  - Monthly credit allowance (e.g. number of generations/minutes).
- Single paid plan:
  - Higher credit quota.
  - Priority in queue.
  - Higher resolution exports (if model supports).

#### 3.6.2 Onboarding

- First-run guided flow:
  - Explain how to go from idea → story in 3–4 steps.
  - Prebuilt sample project for experimentation.
- “First Exceptional Video” path:
  - Template-driven wizard for the first story.

#### 3.6.3 Notifications & Emails

- In-app notifications (see 3.3.3).
- Basic transactional emails:
  - Welcome email.
  - Story export ready.
  - Low credits warning.

#### 3.6.4 Localization

- MVP:
  - App copy designed to be localizable.
  - Start with **one primary language** (e.g. English).
- Internationalization framework included from day one.

Asset marketplace, affiliate program, SEO landing pages at scale are post-MVP, but the data model should not block them.

---

## 4. System Architecture (High-Level)

### 4.1 Components

- **Web Client (SPA)**
  - Tech: React (or similar) + TypeScript.
  - Responsibilities:
    - Auth flows.
    - Story editor UI.
    - Feeds and profiles.
    - Prompt assistant UI.

- **Backend API**
  - REST/GraphQL endpoints.
  - Auth (JWT).
  - Core resources: users, stories, clips, assets, jobs, social graph, notifications.

- **Job Queue + Workers**
  - Generation jobs: text/image → video, upscale, restyle.
  - Poll external AI providers.
  - Emit job status updates.

- **Storage**
  - Blob storage for video and assets.
  - Database (SQL or NoSQL) for metadata.

- **External AI Providers**
  - Text-to-video.
  - Optional: enhancement/restyle APIs.
  - LLM provider for assistant + prompt enhancer.

---

## 5. Draft Data Model (MVP)

> This is a conceptual model; exact DB schemas and types may vary.

### 5.1 Core Entities

**User**
- id
- email
- password_hash (if email/password)
- auth_provider (google, github, etc.)
- display_name
- handle (unique)
- bio
- avatar_url
- plan_type (free / paid)
- credits_balance
- created_at, updated_at

**Story**
- id
- owner_user_id
- title
- description
- status (draft / published)
- privacy (private / unlisted / public)
- cover_clip_id
- total_duration_seconds
- published_at
- created_at, updated_at

**Clip**
- id
- story_id
- order_index
- source_type (generated / uploaded)
- input_prompt
- model_provider
- model_name
- video_url
- thumbnail_url
- duration_seconds
- metadata (json: aspect_ratio, fps, resolution, etc.)
- created_at, updated_at

**TextOverlay**
- id
- story_id
- clip_id
- start_time
- end_time
- content
- position (top / center / bottom)
- style_json

**AudioTrack**
- id
- story_id
- type (music / voiceover)
- source_type (library / upload)
- audio_url
- start_time
- end_time
- volume

**Folder**
- id
- owner_user_id
- name
- parent_folder_id (nullable)
- created_at, updated_at

**StoryFolder**
- id
- story_id
- folder_id

**Asset (Reference)**
- id
- owner_user_id
- type (image / video / audio)
- url
- name
- tags (array)
- metadata_json
- created_at

**Job**
- id
- owner_user_id
- job_type (generate_clip / upscale / restyle)
- status (queued / running / succeeded / failed)
- input_payload_json
- output_payload_json
- model_provider
- created_at, updated_at

**Like**
- id
- user_id
- story_id
- created_at

**Comment**
- id
- story_id
- author_user_id
- parent_comment_id (nullable)
- content
- created_at, updated_at

**Follow**
- id
- follower_user_id
- followed_user_id
- created_at

**Notification**
- id
- user_id
- type (like_story / comment_story / new_follower)
- payload_json
- read_at (nullable)
- created_at

---

## 6. UX Map / Main Screens

### 6.1 Auth & Onboarding

- **Sign Up / Sign In**
  - Email + password and/or OAuth providers.
- **Onboarding Wizard**
  - 3–4 screens explaining:
    - Generate clips
    - Edit story
    - Publish & share

### 6.2 Home

- Tabs:
  - “For You” (home/global feed)
  - “Following”
- Story cards with autoplay-on-hover preview (optional for MVP).

### 6.3 My Workspace

- Sidebar:
  - All Stories
  - Folders
- Main panel:
  - List/grid of stories.
  - Filters: draft / published.

### 6.4 Story Editor

- Layout:
  - **Center**: video preview.
  - **Bottom**: timeline with clip thumbnails.
  - **Left**: generation panel (prompts, jobs).
  - **Right**: properties (text overlays, story details).
- Actions:
  - Add new clip (text prompt → job).
  - Add reference assets.
  - Trim, reorder clips.
  - Add/edit text overlays.
  - Add single audio track.
  - Preview full story.
  - Publish.

### 6.5 Story Public Page

- Player (auto-loop).
- Story title, description.
- Creator info (avatar, handle, follow button).
- Like button and count.
- Comment section.
- Share button (copy link).

### 6.6 Profile Page

- Header with avatar, bio, social links.
- Tabs:
  - Stories
  - (Optional) Liked stories (later).

### 6.7 Notifications

- Bell icon in main nav.
- Dropdown with latest notifications.
- “View all” page.

---

## 7. MVP Success Metrics (Examples)

- Time-to-first-published-story (median).
- % of new users who publish at least 1 story in first 7 days.
- Average stories created per active creator per week.
- % of stories that receive at least 1 like or comment.
- Free → paid conversion rate (once paid plan is launched).

---

## 8. Post-MVP Expansion Hooks

The MVP is intentionally small but leaves room for:

- NSFW explore (separate content domains on same data model).
- Custom character/style training attached to users or teams.
- Story-level templates marketplace (Story as sellable template).
- Hosted challenges & leaderboards built on top of Story + metrics.
- Deeper analytics per story and per creator.

---
