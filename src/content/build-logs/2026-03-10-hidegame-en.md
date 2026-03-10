---
title: "HideGame — Building a hide-and-seek game in Unity"
project: "hidegame"
date: 2026-03-10
lang: en
pair: "2026-03-10-hidegame-ko"
tags: [unity, csharp, game-dev]
---

Started an experimental project to build a simple hide-and-seek game in Unity.

## Purpose

Never done game development before. The goal is to learn Unity and C# hands-on, understanding how a game engine works. Focus on learning, not polish.

> You only get a feel for new tools by actually using them.

## Basic structure

- **Player controller** — WASD movement + mouse look
- **Map** — 3D environment with objects to hide behind
- **AI seeker** — NPC that hunts the player using NavMesh pathfinding

## What I learned from Unity

- `MonoBehaviour` lifecycle: `Awake` → `Start` → `Update` → `FixedUpdate`
- Difference between Rigidbody and Collider. Physics must be handled in `FixedUpdate`
- Prefab system for reusable object patterns

## Current status

- Basic movement and camera rotation implemented
- Simple map prototype in progress
- AI search logic not yet implemented
