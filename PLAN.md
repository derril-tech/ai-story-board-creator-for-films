# AI Storyboard Creator for Films — Delivery Plan (v0.1)
_Date: 2025-08-28 • Owner: PM/Tech Lead • Status: Draft_

## 0) One-liner
**“Transform a script into a fully illustrated storyboard: scene breakdowns, dialogue timing, camera angles, and shot composition—ready for directors and crews.”**

## 1) Goals & Non-Goals (V1)
**Goals**
- End-to-end pipeline from script ingest → scene/shot breakdown → dialogue timing → illustrated frames → animatic → exports (PDF/CSV/JSON/MP4).
- Camera plans per shot (size/angle/movement/lens) with editable suggestions.
- Dialogue timing per line with estimated durations and optional TTS audio.
- Illustration generation in storyboard/concept-art styles with overlays (thirds/safe zones/shot-size labels).
- Export booklets (PDF), shot lists (CSV), animatics (MP4), and JSON bundle with full scene/shot/dialogue/camera metadata.
- Project governance (roles, comments, versioning), observability, and security (RLS, signed URLs).

**Non-Goals**
- Replacing directors/DPs or human storyboard artists.
- Photoreal VFX previs; V1 focuses on sketch/concept styles.
- Automatic public posting/sharing beyond signed links.

## 2) Scope
**In-scope**
- Script parsing for FDX/Fountain/PDF; scene slug parsing (INT/EXT, location, time of day).
- Shot list generation templates (dialogue-heavy, action, montage).
- Dialogue timing (heuristics + optional audio alignment if track provided).
- Frame generation via AI image worker; frame replacement with user art.
- Animatic builder: stills + TTS/dialogue + optional temp music; captions.
- Exports: PDF booklet, CSV shot list, MP4 animatic, JSON bundle.
- Commenting, review links, audit logs.

**Out-of-scope**
- Full non-linear video editing; production scheduling/call sheets; final lighting plans.

## 3) Workstreams & Success Criteria
1. **Ingest & Parse** — ✅ Robust script ingestion and accurate scene/slug/dialogue extraction.
2. **Shot Planning & Dialogue Timing** — ✅ Useful per-shot camera metadata and reliable line timings.
3. **Illustration & Frames** — ✅ Consistent storyboard-style frames with overlays and regeneration controls.
4. **Animatic & Exports** — ✅ Fast MP4 animatics, polished PDF/CSV/JSON exports with traceability.
5. **SRE & Governance** — ✅ RLS + audit; OTel traces/metrics; error budgets and runbooks.

## 4) Milestones (~10–12 weeks)
- **Weeks 1–2**: Infra, schema, FDX/Fountain/PDF parser, scene cards.
- **Weeks 3–4**: Shot templates & camera planner; dialogue timing; dialogue timeline UI.
- **Weeks 5–6**: Illustration worker + frame viewer/overlays; regeneration & uploads.
- **Weeks 7–8**: Animatic worker (TTS optional), captions; PDF/CSV/JSON exporters.
- **Weeks 9–10**: Performance/QC; comments/versioning; beta pilots.
- **Weeks 11–12**: Hardening, localization, accessibility, GA.

## 5) Deliverables
- OpenAPI 3.1 spec + TypeScript SDK; Postman collection.
- Demo project (3 scenes) with shots, frames, animatic, and exports.
- Playwright E2E + integration tests; parser accuracy report.
- SRE dashboards (parse latency, frame gen p95, render p95) + runbooks.

## 6) Risks & Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Parser errors on messy PDFs | Medium | Hybrid PDF+OCR fallback; Fountain/FDX preferred; manual correction UI |
| Low-quality frames for complex scenes | Medium | Style presets; multi-pass prompts; allow quick regenerate & upload replacement |
| Dialogue timing drift | Medium | Heuristic syllable-based timing + optional audio alignment; timeline nudging tools |
| GPU image-gen queue latency | High | Worker autoscale; caching of model weights; DLQ with retries |
| Export failures (fonts/assets) | Medium | Preflight asset validation; deterministic fonts; embed brand assets |

## 7) Acceptance Criteria (V1)
- Script parse (120 pages) **< 15 s p95**; frame generation per shot **< 8 s p95 (GPU)**.
- Animatic render (3 min) **< 60 s p95**; PDF export **< 5 s p95**.
- Shot suggestion usefulness (pilot, human-rated) **≥ 70%**.
- Time-to-first storyboard draft (120p) **< 20 min median**.
- All exports include scene/shot IDs and timecodes for traceability.

## 8) Rollout
- Private pilot with 2 directors + 1 indie studio.
- Beta with feature flags (TTS voices, alt art styles).
- GA with templates (Action, Dialogue, Montage) and tutorial projects.