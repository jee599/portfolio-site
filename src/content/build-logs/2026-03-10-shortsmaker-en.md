---
title: "ShortsMaker — Building an automated Shorts video pipeline"
project: "shortsmaker"
date: 2026-03-10
lang: en
pair: "2026-03-10-shortsmaker-ko"
tags: [python, ffmpeg, shorts, automation, tts]
---

Started building a pipeline that auto-generates short-form ad videos. The goal is end-to-end: script in, video out.

## Why

Making a single Shorts video manually takes 30+ minutes of editing. For ad purposes, you need to produce many videos in a similar format — doing this by hand doesn't scale.

> Repetitive work should be automated. Especially when the format is fixed.

## Pipeline architecture

1. **Script input** — accept raw text copy
2. **AI TTS** — convert text to speech
3. **FFmpeg rendering** — composite background video + subtitles + audio
4. **YouTube upload** — auto-upload via API

```
Script → TTS generation → FFmpeg compositing → YouTube upload
```

## Current progress

- Modularizing each step in Python
- FFmpeg command composition is the core — managing subtitle position, font, and timing via templates
- YouTube Data API v3 integration planned for auto-upload

## Next steps

- Compare TTS engines (Google TTS vs ElevenLabs)
- Subtitle style template system
- Batch processing for multiple videos at once
