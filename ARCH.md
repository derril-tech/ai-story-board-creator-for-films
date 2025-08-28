# AI Storyboard Creator — Architecture (V1)

## 1) System Overview
**Frontend/BFF:** Next.js 14 (Vercel) — SSR for storyboard preview; ISR for share links; Server Actions for signed uploads.  
**API Gateway:** NestJS (Node 20) — REST **/v1** with OpenAPI 3.1, Zod validation, Problem+JSON, RBAC (Casbin), RLS, Idempotency‑Key + Request‑ID.  
**Workers (Python 3.11 + FastAPI):**
- **script-worker** (FDX/Fountain/PDF parsing; slug/action/dialogue extraction; OCR fallback for PDFs)
- **shot-worker** (scene → shot list; camera metadata: angle/size/movement/lens; blocking notes)
- **illustration-worker** (AI sketch/line‑art/concept frames; style presets; prompt seed from shot metadata)
- **dialogue-worker** (timing estimation; optional alignment to audio; TTS generation if enabled)
- **animatic-worker** (MP4 from stills + audio/captions; pacing by dialogue timings)
- **export-worker** (PDF booklet, CSV shot list, JSON bundle; ZIP packaging)

**Event Bus/Queues:** NATS subjects (`script.ingest`, `shot.breakdown`, `illustration.make`, `dialogue.sync`, `animatic.make`, `export.make`) + Redis Streams DLQ; Celery/RQ orchestration.  
**Datastores:** Postgres 16 (projects/scripts/scenes/shots/dialogues/frames/animatics/exports), S3/R2 (frames/animatics/exports), Redis (session/job state), optional Neo4j (character/scene graph).  
**Observability:** OpenTelemetry (traces/metrics/logs) + Prometheus/Grafana; Sentry errors.  
**Security:** TLS/HSTS/CSP; KMS‑wrapped secrets; signed URLs; Postgres RLS; audit logs; content filters.

## 2) Data Model (summary)
- **Projects/Scripts:** projects, scripts (s3_key, status).  
- **Scenes:** scenes (slug, location, TOD, summary, est_runtime).  
- **Shots:** shots (order_idx, description, angle, size, movement, lens, duration, meta).  
- **Dialogues:** dialogues (character, line, t_start/t_end/est_duration).  
- **Frames:** frames (shot_id, s3_key, style, meta).  
- **Animatics/Exports:** animatics (timeline, s3_mp4), exports (kind, s3_key).  
- **Audit:** audit_log.

**Invariants**
- RLS by project_id.  
- Every shot belongs to a scene; every frame belongs to a shot.  
- Dialogue timings must not overlap and should cover scene runtime (gaps allowed but flagged).  
- Exports embed IDs/timecodes for traceability.

## 3) Key Flows

### 3.1 Script → Scenes
1. Upload FDX/Fountain/PDF → **script-worker** parses slugs (INT/EXT/location/TOD), action and dialogue; maps pages to scenes.  
2. Persist scenes and dialogue lines; compute estimated runtimes.

### 3.2 Scenes → Shots
1. **shot-worker** applies templates (dialogue-heavy/action/montage) to generate per‑scene shot lists with camera metadata (size/angle/movement/lens) and blocking hints.  
2. User edits in ShotList; dialogue timings overlaid.

### 3.3 Shots → Frames
1. **illustration-worker** generates sketch/concept frames seeded from shot metadata (characters, angle, lens).  
2. **FrameViewer** shows overlays (thirds/safe zones/labels); users can regenerate or upload replacements.

### 3.4 Animatic & Exports
1. **dialogue-worker** estimates timings and optional TTS; aligns captions.  
2. **animatic-worker** builds MP4 from stills + audio; applies pacing from timings; renders captions.  
3. **export-worker** emits PDF booklet, CSV shot list, JSON bundle, and ZIP; signed URLs returned.

## 4) API Surface (/v1)
- **Projects/Scripts:** `POST /projects`, `POST /scripts/upload`, `GET /scenes/:id`.  
- **Shots:** `POST /shots/generate {scene_id, style}`, `GET /shots?scene_id=…`.  
- **Frames:** `POST /frames/generate {shot_id, style}`, `GET /frames/:id`.  
- **Dialogue:** `POST /dialogues/sync {scene_id}`, `GET /dialogues?scene_id=…`.  
- **Animatics/Exports:** `POST /animatics {project_id}`, `POST /exports/storyboard {project_id, format}`.

**Conventions:** Idempotency‑Key; cursor pagination; Problem+JSON; SSE for long jobs (frame batches, animatic encodes).

## 5) Observability & SLOs
- **Spans:** script.parse, shot.plan, frame.make, dialogue.sync, animatic.render, export.make.  
- **Targets:** Script parse (120p) < 15 s p95; frame gen < 8 s p95 (GPU); animatic 3 min < 60 s p95; PDF export < 5 s p95.  
- **Metrics:** parser accuracy, frame gen success rate, render p95, WER for dialogue alignment.

## 6) Security & Governance
- Tenant isolation via RLS; RBAC (Casbin).  
- Signed URLs with short TTL; KMS‑wrapped secrets.  
- Content filters for unsafe imagery; audit trail for edits/exports.  
- Data export/delete endpoints; versioned storyboards and comments.

## 7) Performance & Scaling
- Cache parsed scripts; reuse frames across exports/variants.  
- GPU workers with warmed models; batch frame generation.  
- DLQ with retries/backoff; autoscale by queue depth.  
- CDN for frame/animatic delivery; chunked uploads.

## 8) Accessibility & i18n
- Keyboard navigation on timeline and shot tables; ARIA labels on frames and shots.  
- High‑contrast overlays; localization of UI and captions; RTL support in timelines.