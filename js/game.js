import { W, H, LEVELS } from "./config.js";
import { Input } from "./input.js";
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const overlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export class Game {
  constructor() {
    this.canvas = $("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.input = new Input();
    this.state = "menu";
    this.gravity = 1;
    this.levelIndex = 0;
    this.unlocked = Number(localStorage.getItem("gs_unlocked") || 1);
    this.bestScores = JSON.parse(localStorage.getItem("gs_scores") || "{}");
    this.bind();
    this.resize();
    addEventListener("resize", () => this.resize());
    this.renderLevelGrid();
    this.refreshMenu();
    requestAnimationFrame(() => this.loop());
  }
  bind() {
    $("play").onclick = () => this.start(Math.min(this.unlocked, 10) - 1);
    $("levelSelectBtn").onclick = () => $("levelModal").classList.add("open");
    $("closeLevels").onclick = () => $("levelModal").classList.remove("open");
    $("how").onclick = () => $("help").classList.add("open");
    $("close").onclick = () => $("help").classList.remove("open");
    $("help").onclick = (e) => {
      if (e.target.id === "help") $("help").classList.remove("open");
    };
    $("pause").onclick = () => this.togglePause();
    $("resume").onclick = () => this.resume();
    $("restart").onclick = () => this.start(this.levelIndex);
    $("retry").onclick = () => this.start(this.levelIndex);
    $("nextLevel").onclick = () => this.nextLevel();
    $("toMenu").onclick = () => this.menu();
    document
      .querySelectorAll("[data-menu]")
      .forEach((b) => (b.onclick = () => this.menu()));
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if ($("help").classList.contains("open"))
          $("help").classList.remove("open");
        else if ($("levelModal").classList.contains("open"))
          $("levelModal").classList.remove("open");
        else this.togglePause();
      }
      if (e.key.toLowerCase() === "r" && this.state === "playing")
        this.start(this.levelIndex);
    });
  }
  resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = W * d;
    this.canvas.height = H * d;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  renderLevelGrid() {
    const grid = $("levelGrid");
    grid.innerHTML = "";
    LEVELS.forEach((level, i) => {
      const b = document.createElement("button");
      b.className =
        "level-card" +
        (i + 1 > this.unlocked ? " locked" : "") +
        (i + 1 === this.unlocked ? " current" : "");
      b.innerHTML = `<b>${String(i + 1).padStart(2, "0")}</b><span>${level.title}<br>${level.difficulty}${i + 1 <= this.unlocked ? " · UNLOCKED" : " · LOCKED"}</span>`;
      b.disabled = i + 1 > this.unlocked;
      b.onclick = () => {
        $("levelModal").classList.remove("open");
        this.start(i);
      };
      grid.appendChild(b);
    });
  }
  refreshMenu() {
    $("progressNote").textContent =
      `MISSION PROGRESS: ${this.unlocked - 1} / 10`;
    $("play").textContent =
      this.unlocked > 1 ? "▶  CONTINUE CAMPAIGN" : "▶  START CAMPAIGN";
  }
  start(index) {
    this.levelIndex = clamp(index, 0, 9);
    this.level = structuredClone(LEVELS[this.levelIndex]);
    this.level.platforms.forEach((p) => {
      if (p.moving) {
        p.baseX = p.x;
        p.baseY = p.y;
        p.t = 0;
      }
    });
    this.level.hazards.forEach((h) => {
      h.baseX = h.x;
      h.baseY = h.y;
      h.t = 0;
    });
    this.player = {
      x: this.level.spawn.x,
      y: this.level.spawn.y,
      w: 30,
      h: 42,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 1,
    };
    this.gravity = 1;
    this.elapsed = 0;
    this.state = "playing";
    this.score = 0;
    $("menu").classList.remove("active");
    $("game").classList.add("active");
    this.overlaysOff();
    $("levelName").textContent = this.level.title;
    $("facilityNo").textContent = String(this.levelIndex + 1).padStart(2, "0");
    $("tip").textContent = "✦  TIP: " + this.level.tip;
    this.updateHud();
  }
  menu() {
    this.state = "menu";
    $("game").classList.remove("active");
    $("menu").classList.add("active");
    this.overlaysOff();
    this.refreshMenu();
    this.renderLevelGrid();
  }
  nextLevel() {
    if (this.levelIndex < 9) this.start(this.levelIndex + 1);
    else this.menu();
  }
  overlaysOff() {
    ["pauseLayer", "winLayer", "deadLayer"].forEach((id) =>
      $(id).classList.remove("visible"),
    );
  }
  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      $("pauseLayer").classList.add("visible");
    } else if (this.state === "paused") this.resume();
  }
  resume() {
    if (this.state === "paused") {
      this.state = "playing";
      $("pauseLayer").classList.remove("visible");
    }
  }
  updateHud() {
    $("gravity").textContent = this.gravity > 0 ? "DOWN" : "UP";
    $("arrow").textContent = this.gravity > 0 ? "↓" : "↑";
    $("score").textContent = String(this.score).padStart(4, "0");
  }
  flip() {
    this.gravity *= -1;
    this.player.vy = 0;
    this.player.grounded = false;
    this.updateHud();
    $("toast").textContent =
      this.gravity > 0 ? "GRAVITY RESTORED: DOWN" : "GRAVITY REVERSED: UP";
    $("toast").classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(
      () => $("toast").classList.remove("show"),
      850,
    );
  }
  update(dt) {
    if (this.state !== "playing") return;
    this.elapsed += dt;
    if (this.input.pressed("g")) this.flip();
    if (this.input.pressed(" ", "arrowup", "w") && this.player.grounded) {
      this.player.vy = -this.gravity * 13.5;
      this.player.grounded = false;
    }
    const p = this.player;
    // Move animated platforms and hazards using deterministic oscillation.
    for (const q of this.level.platforms) {
      if (!q.moving) continue;
      q.t += dt * q.speed * 0.0018;
      const d = Math.sin(q.t) * q.range;
      if (q.axis === "x") q.x = q.baseX + d;
      else q.y = q.baseY + d;
    }
    for (const h of this.level.hazards) {
      if (h.kind === "laser") continue;
      if (!h.moving) continue;
      h.t += dt * h.speed * 0.0018;
      const d = Math.sin(h.t) * h.range;
      if (h.axis === "x") h.x = h.baseX + d;
      else h.y = h.baseY + d;
    }
    const left = this.input.down("a", "arrowleft"),
      right = this.input.down("d", "arrowright");
    if (left) {
      p.vx -= 0.72;
      p.facing = -1;
    }
    if (right) {
      p.vx += 0.72;
      p.facing = 1;
    }
    if (!left && !right) p.vx *= 0.82;
    p.vx = clamp(p.vx, -6.2, 6.2);
    const oldY = p.y,
      oldX = p.x;
    p.vy = clamp(p.vy + this.gravity * 0.62, -15, 15);
    p.x += p.vx;
    p.y += p.vy;
    p.grounded = false;
    p.x = clamp(p.x, 0, W - p.w);
    for (const q of this.level.platforms) {
      if (p.x + p.w <= q.x || p.x >= q.x + q.w) continue;
      if (this.gravity > 0 && oldY + p.h <= q.y + 3 && p.y + p.h >= q.y) {
        p.y = q.y - p.h;
        p.vy = 0;
        p.grounded = true;
        if (q.moving && q.axis === "x") p.x += q.x - q.baseX;
      } else if (
        this.gravity < 0 &&
        oldY >= q.y + q.h - 3 &&
        p.y <= q.y + q.h
      ) {
        p.y = q.y + q.h;
        p.vy = 0;
        p.grounded = true;
      }
    }
    for (const h of this.level.hazards) {
      if (h.kind === "laser") {
        const active = (this.elapsed + h.phase) % h.period < h.on;
        if (active && overlap(p, h)) {
          this.die();
          return;
        }
      } else if (
        overlap(p, { x: h.x + 3, y: h.y + 3, w: h.w - 6, h: h.h - 3 })
      ) {
        this.die();
        return;
      }
    }
    if (p.y > H + 70 || p.y < -90) {
      this.die();
      return;
    }
    if (overlap(p, this.level.exit)) this.complete();
  }
  die() {
    this.state = "dead";
    $("deadLayer").classList.add("visible");
  }
  complete() {
    this.state = "complete";
    const elapsed = Math.floor(this.elapsed / 1000);
    this.score = Math.max(100, 1000 - elapsed * 8);
    const key = String(this.levelIndex + 1);
    this.bestScores[key] = Math.max(this.bestScores[key] || 0, this.score);
    localStorage.setItem("gs_scores", JSON.stringify(this.bestScores));
    if (this.levelIndex + 2 > this.unlocked) {
      this.unlocked = Math.min(10, this.levelIndex + 2);
      localStorage.setItem("gs_unlocked", String(this.unlocked));
    }
    $("resultScore").textContent = this.score;
    $("score").textContent = String(this.score).padStart(4, "0");
    $("winTitle").textContent =
      this.levelIndex === 9 ? "CAMPAIGN COMPLETE" : "LEVEL CLEAR";
    $("winMessage").textContent =
      this.levelIndex === 9
        ? "You mastered all ten gravity trials."
        : "Mission complete. The next facility sector is unlocked.";
    $("nextLevel").textContent =
      this.levelIndex === 9 ? "RETURN TO BASE" : "NEXT MISSION →";
    $("winLayer").classList.add("visible");
  }
  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, W, H);
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0c1529");
    bg.addColorStop(1, "#080b16");
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    c.strokeStyle = "#1a2941";
    c.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, H);
      c.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    }
    for (let i = 0; i < 65; i++) {
      c.fillStyle = i % 4 === 0 ? "#5af3f555" : "#9bb5dc22";
      c.fillRect((i * 197) % W, (i * 113) % H, 2, 2);
    }
    for (const q of this.level.platforms) {
      c.fillStyle = q.moving ? "#35476c" : "#243754";
      c.fillRect(q.x, q.y, q.w, q.h);
      c.fillStyle = q.moving ? "#a78bfa" : "#5af3f5";
      c.shadowColor = c.fillStyle;
      c.shadowBlur = 12;
      c.fillRect(q.x, q.y, q.w, 3);
      c.shadowBlur = 0;
    }
    for (const h of this.level.hazards) {
      if (h.kind === "laser") {
        const active = (this.elapsed + h.phase) % h.period < h.on;
        c.save();
        c.strokeStyle = active ? "#ff5b83" : "#ff5b8340";
        c.lineWidth = active ? 5 : 2;
        c.shadowColor = "#ff5b83";
        c.shadowBlur = active ? 18 : 0;
        c.beginPath();
        c.moveTo(h.x, h.y + h.h / 2);
        c.lineTo(h.x + h.w, h.y + h.h / 2);
        c.stroke();
        c.restore();
        continue;
      }
      const n = Math.max(2, Math.floor(h.w / 18));
      c.fillStyle = "#ff5b83";
      c.shadowColor = "#ff5b83";
      c.shadowBlur = 12;
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const x = h.x + (i * h.w) / n,
          w = h.w / n;
        c.moveTo(x, h.y + h.h);
        c.lineTo(x + w / 2, h.y);
        c.lineTo(x + w, h.y + h.h);
      }
      c.fill();
      c.shadowBlur = 0;
    }
    const e = this.level.exit;
    c.save();
    c.shadowColor = "#a78bfa";
    c.shadowBlur = 25;
    c.strokeStyle = "#c5aaff";
    c.lineWidth = 4;
    c.strokeRect(e.x, e.y, e.w, e.h);
    c.fillStyle = "#a78bfa24";
    c.fillRect(e.x, e.y, e.w, e.h);
    c.restore();
    const p = this.player;
    c.save();
    c.shadowColor = "#5af3f5";
    c.shadowBlur = 22;
    c.fillStyle = "#5af3f5";
    c.fillRect(p.x, p.y, p.w, p.h);
    c.shadowBlur = 0;
    c.fillStyle = "#09202b";
    c.fillRect(p.x + 6, p.y + 10, p.w - 12, 9);
    c.fillStyle = "#fff";
    c.fillRect(p.x + (p.facing > 0 ? p.w - 10 : 7), p.y + 13, 4, 3);
    c.fillStyle = "#a78bfa";
    c.fillRect(p.x + 5, p.y + p.h - 3, p.w - 10, 4);
    c.restore();
    c.fillStyle = "#8fa3c2";
    c.font = "12px monospace";
    c.fillText(
      this.gravity > 0 ? "GRAVITY VECTOR ↓" : "GRAVITY VECTOR ↑",
      24,
      34,
    );
    c.fillStyle = "#5af3f5";
    c.fillRect(24, 44, 78, 2);
  }
  loop(now = performance.now()) {
    const dt = Math.min(now - (this.last || now), 34);
    this.last = now;
    this.update(dt);
    if (this.level) this.draw();
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }
}
