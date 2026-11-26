# Upfall — v2.1  Update

A full-screen gravity-reversal platformer built with HTML, CSS, and vanilla JavaScript ES modules.

## Run locally
Open this folder in VS Code and use Live Server on `index.html`. Alternatively run `python -m http.server 8000` in this directory and visit `http://localhost:8000`.

## Controls
- A / D or Left / Right — move
- Space, W, or Up — jump while grounded
- G — reverse gravity
- Esc — pause / resume
- R — restart current level

## Campaign
Ten progressively harder missions:
1. First Contact — learn movement and gravity
2. Upside Down — ceiling routes
3. Danger Zone — static spikes
4. Moving Ground — moving platforms
5. Deadly Rhythm — patrolling spike hazards
6. Laser Grid — timed laser beams
7. No Safe Side — hazards on floor and ceiling
8. Collision Course — multiple moving hazards
9. Gravity Maze — narrow routes and timed hazards
10. The Singularity — combined final challenge

## Systems
- Reusable level configuration in `js/config.js`
- Oscillating moving platforms and spike hazards
- Timed laser beams
- Campaign progression and level unlocking saved in localStorage
- Per-level best score saved locally
- Level select, retry, pause and next-level flow

The levels use hand-authored challenge layouts with reusable movement patterns. This gives controlled difficulty and avoids unfair random generation.
