# LectureUnlock 🔓

**A multi-agent AI system that transforms any YouTube lecture into a complete study environment for students and a private pedagogical audit tool for faculty.**

🌐 **Live Demo:** [www.lectureunlock.com](https://www.lectureunlock.com)

Built solo in 7 days for the No Resume Required Hackathon by Cloudforce. 
Co-Winner | CEO Personal Recognition | 100+ builders competed.

---

## What It Does

Paste any public YouTube lecture URL and LectureUnlock instantly produces:

**For Students:**
- 📋 Collapsible timestamped outline with clickable jump-points into the video
- 📝 Three layered summaries — Quick (30 sec), Medium (2 min), Full (5 min)
- 🃏 Flashcards with cited source timestamps
- 🔍 Semantic search with full question classification
- 🌍 Bilingual support — Spanish, French, Arabic, German

**For Faculty:**
- 📊 Five-dimension pedagogical scorecard with letter grades
- 🎯 Prioritized action items with timestamped suggested rewrites
- 🔒 Private report — never surveillance, always voluntary
- ⚠️ Content error detection with exact timestamps

---

## Agent Architecture

LectureUnlock is powered by four distinct AI agents with genuine orchestration:

| Agent | Function | Purpose |
|---|---|---|
| Agent 1 — Ingestion | fetchTranscript | Fetches and structures timestamped transcript via Supadata API |
| Agent 2 — Student | processStudent | Generates outline, summaries, flashcards, semantic index |
| Agent 3 — Faculty | processFaculty | Produces five-dimension pedagogical scorecard and audit |
| Agent 4 — Search | searchQuery | Semantic question classification and grounded retrieval |

An orchestrator routes transcript output from Agent 1 to either Agent 2 or Agent 3 based on mode selection.

---

## Semantic Search Classification

The search agent classifies every query into one of five categories:

- **Greeting** — friendly redirect, no retrieval
- **Invalid input** — nudge to rephrase
- **Unrelated question** — hard stop, zero hallucination risk
- **Lecture question** — semantic retrieval with timestamped answer
- **Study guidance** — synthesis across full lecture with 3 best timestamps

---

## Caching Architecture

Six cache layers for near-zero latency on repeat runs:

- `videoId:transcript` — shared across Student and Faculty modes
- `videoId:is_lecture` — boolean detection cache, saves 5-10 seconds
- `videoId:student:outline/summaries/flashcards/searchIndex` — 4 entries (256KB limit bypass)
- `videoId:faculty:scorecard/details` — 2 entries
- `videoId:language` — translation cache per language
- `videoId:normalizedQuery` — search cache with query normalization

---

## Tech Stack

| Layer | Technology |
|---|---|
| Platform | Base44 (Cloudforce-approved) |
| LLM | Claude Sonnet 4.6 via Base44 InvokeLLM |
| Transcript API | Supadata API |
| Translation | Google Cloud Translation API |
| Frontend | React + Tailwind CSS |
| Backend | Deno serverless functions |
| Database | Base44 entity layer |
| Deployment | Base44 — live 24/7, single public URL |

---

## Key Engineering Decisions

**Why search engine style over chatbot:**
Students under time pressure need direct answers not conversations. One question, one result, done.

**Why Google Translate over LLM translation:**
Purpose-built translation APIs are 10-100x faster for the same output. Right tool for the right job.

**Why single Sonnet call over parallel processing:**
Parallel processing doubled transcript token input — both calls received the full transcript making things slower not faster. Reverted to single optimized call.

**Why four cache entries for student output:**
Base44 has a 256KB field size limit. The full student JSON exceeded it causing silent save failures. Split into four entries mirrors the working faculty pattern.

---

## Failure Modes Handled

- ✅ Private or unavailable YouTube videos
- ✅ Invalid URLs
- ✅ Videos with no transcript available
- ✅ Non-lecture content detection
- ✅ Non-English transcripts — hard English output guardrail on all agents
- ✅ Language mismatch in search — detection banner with switch option

---

## Architecture Diagram

[View Architecture Diagram](./LectureUnlock_Architecture_Diagram%20(1).pdf)

---

## Built By

**Samson Ogunleye**
sogunleye1218@gmail.com

Cybersecurity Management and Policy — University of Maryland Global Campus
Solutions Engineer Intern — Cloudflare (Summer & Fall 2026)

---

*Built for the No Resume Required Hackathon by Cloudforce — May 2026*
