export class Input {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if ([" ", "arrowleft", "arrowright", "arrowup"].includes(k))
        e.preventDefault();
      if (!this.keys.has(k)) this.justPressed.add(k);
      this.keys.add(k);
    });
    addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener("blur", () => {
      this.keys.clear();
      this.justPressed.clear();
    });
  }
  down(...keys) {
    return keys.some((k) => this.keys.has(k));
  }
  pressed(...keys) {
    return keys.some((k) => this.justPressed.has(k));
  }
  endFrame() {
    this.justPressed.clear();
  }
}
