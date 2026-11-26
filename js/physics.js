import { W } from "./config.js";
export class Physics {
  update(p, input, gravity, platforms) {
    const left = input.down("a", "arrowleft"),
      right = input.down("d", "arrowright");
    if (left) {
      p.vx -= 0.72;
      p.facing = -1;
    }
    if (right) {
      p.vx += 0.72;
      p.facing = 1;
    }
    if (!left && !right) p.vx *= 0.82;
    p.vx = Math.max(-6.2, Math.min(6.2, p.vx));
    const oldY = p.y;
    p.vy = Math.max(-15, Math.min(15, p.vy + gravity * 0.62));
    p.x += p.vx;
    p.y += p.vy;
    p.grounded = false;
    p.x = Math.max(0, Math.min(W - p.w, p.x));
    for (const q of platforms) {
      if (p.x + p.w <= q.x || p.x >= q.x + q.w) continue;
      if (gravity > 0 && oldY + p.h <= q.y && p.y + p.h >= q.y) {
        p.y = q.y - p.h;
        p.vy = 0;
        p.grounded = true;
      } else if (gravity < 0 && oldY >= q.y + q.h && p.y <= q.y + q.h) {
        p.y = q.y + q.h;
        p.vy = 0;
        p.grounded = true;
      }
    }
  }
  jump(p, g) {
    if (p.grounded) {
      p.vy = -g * 13.5;
      p.grounded = false;
    }
  }
}
