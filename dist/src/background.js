// ============================================================
// background.js — 多彩卡通世界背景（Canvas 绘制，不用画板）
// 8 种主题：体育场/海洋/绿茵/竞技场/雪山/室内馆/靶场/自然
// ============================================================
const BG_THEMES = {
  stadium: { sky:['#5ec8ff','#aee3ff'], sun:'#ffd166', ground:['#2ecc71','#27ae60'], hill:'#7ed6a5', line:'#ffffff', deco:'跑道' },
  ocean:   { sky:['#0091ff','#5ec8ff'], sun:'#ffe66d', ground:['#0066cc','#003d99'], hill:'#00a8e8', line:'#b3e5ff', deco:'浪花' },
  field:   { sky:['#74c0ff','#c5e8ff'], sun:'#ffd166', ground:['#52c41a','#3f9b17'], hill:'#8fd460', line:'#ffffff', deco:'草地' },
  arena:   { sky:['#b197fc','#e0d4ff'], sun:'#ffd166', ground:['#7048e8','#5a34c9'], hill:'#9b8adf', line:'#ffd166', deco:'擂台' },
  snow:    { sky:['#87b5ff','#d6ecff'], sun:'#fff3b0', ground:['#e8f4ff','#c9e2ff'], hill:'#ffffff', line:'#4aa3ff', deco:'雪峰' },
  gym:     { sky:['#ff9a9e','#fecfef'], sun:'#ffd166', ground:['#f4a261','#e76f51'], hill:'#ffc9a3', line:'#ffffff', deco:'彩带' },
  range:   { sky:['#3d9970','#8fd4a8'], sun:'#ffd166', ground:['#2e8b57','#1e6b3f'], hill:'#5fc48b', line:'#ffffff', deco:'靶' },
  nature:  { sky:['#74c0ff','#d0ebff'], sun:'#ffd166', ground:['#37b24d','#2b8a3e'], hill:'#7fd0a0', line:'#ffffff', deco:'森林' },
};

class BgWorld {
  constructor(scene, key, color) {
    this.scene = scene; this.key = key; this.color = color;
    this.th = BG_THEMES[key] || BG_THEMES.stadium;
    this.w = scene.scale.width; this.h = scene.scale.height;
    this.build();
  }
  build() {
    const { w, h, th } = this;
    // 多彩渐变天空（分层，卡通感）
    const g = this.scene.add.graphics();
    const grad = g.fillGradientStyle(
      Phaser.Display.Color.HexStringToColor(th.sky[0]).color,
      Phaser.Display.Color.HexStringToColor(th.sky[1]).color,
      Phaser.Display.Color.HexStringToColor(th.sky[0]).color,
      Phaser.Display.Color.HexStringToColor(th.sky[1]).color, 1);
    g.fillRect(0, 0, w, h);
    // 太阳（光晕）
    const sx = w * 0.8, sy = h * 0.18;
    const glow = this.scene.add.circle(sx, sy, 42, Phaser.Display.Color.HexStringToColor(th.sun).color, 0.35);
    const sun = this.scene.add.circle(sx, sy, 26, Phaser.Display.Color.HexStringToColor(th.sun).color);
    // 云朵（卡通椭圆）
    for (let i = 0; i < 4; i++) {
      const cx = (i * 0.27 + 0.08) * w + ((i * 37) % 60);
      const cy = (0.08 + (i % 3) * 0.07) * h;
      const cloud = this.scene.add.container(cx, cy);
      const cg = this.scene.add.graphics();
      cg.fillStyle(0xffffff, 0.9);
      cg.fillEllipse(0, 0, 90, 34); cg.fillEllipse(-28, -10, 55, 26); cg.fillEllipse(28, -8, 48, 24);
      cloud.add(cg); cloud.setScale(0.6 + (i % 3) * 0.25);
      this.scene.tweens.add({ targets: cloud, x: cx - 60, duration: 20000 + i * 8000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // 远景山丘
    const hill = this.scene.add.graphics();
    hill.fillStyle(Phaser.Display.Color.HexStringToColor(th.hill).color, 1);
    hill.fillEllipse(w * 0.18, h * 0.78, w * 0.75, h * 0.5);
    hill.fillEllipse(w * 0.72, h * 0.82, w * 0.9, h * 0.55);
    // 地面（亮丽渐变草地/场地）
    const gg = this.scene.add.graphics();
    const gcol = Phaser.Display.Color.HexStringToColor(th.ground[0]).color;
    gg.fillStyle(gcol, 1);
    gg.fillRect(0, h * 0.62, w, h * 0.38);
    // 场地标志线（卡通）
    const line = this.scene.add.graphics();
    line.lineStyle(4, Phaser.Display.Color.HexStringToColor(th.line).color, 0.7);
    line.strokeRoundedRect(w * 0.06, h * 0.68, w * 0.88, h * 0.24, 12);
    // 主题装饰
    this.decorate(line, gcol);
  }
  decorate(g, base) {
    const { w, h, th, key } = this;
    const wcol = Phaser.Display.Color.HexStringToColor('#ffffff').color;
    if (th.deco === '跑道') {
      g.lineStyle(5, wcol, 0.8);
      g.strokeLineShape(new Phaser.Geom.Line(0, h * 0.62, w, h * 0.62));
      for (let i = 0; i < 5; i++) {
        g.lineStyle(2, wcol, 0.4);
        g.strokeLineShape(new Phaser.Geom.Line(w * 0.08 + i * 0.05 * w, h * 0.63, w * 0.08 + i * 0.05 * w, h * 0.85));
      }
    } else if (th.deco === '浪花') {
      for (let i = 0; i < 6; i++) {
        const cx = (i * 0.18 + 0.05) * w, cy = h * (0.66 + (i % 3) * 0.06);
        this.scene.add.circle(cx, cy, 8, wcol, 0.8).setScale(1, 0.6);
      }
    } else if (th.deco === '草地') {
      for (let i = 0; i < 8; i++) {
        const cx = (i * 0.13 + 0.04) * w, cy = h * (0.64 + (i % 2) * 0.05);
        this.scene.add.text(cx, cy, '🌿', { fontSize: 22 }).setAlpha(0.9);
      }
    } else if (th.deco === '擂台') {
      for (let i = 0; i < 3; i++) {
        this.scene.add.text(w * (0.15 + i * 0.35), h * 0.56, '🎪', { fontSize: 30 }).setAlpha(0.8);
      }
    } else if (th.deco === '雪峰') {
      const mt = this.scene.add.graphics();
      mt.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color, 0.95);
      mt.fillTriangle(w * 0.05, h * 0.55, w * 0.18, h * 0.3, w * 0.31, h * 0.55);
      mt.fillTriangle(w * 0.7, h * 0.55, w * 0.85, h * 0.35, w * 0.98, h * 0.55);
    } else if (th.deco === '彩带') {
      for (let i = 0; i < 4; i++) {
        this.scene.add.text(w * (0.12 + i * 0.24), h * 0.12, '🎈', { fontSize: 28 }).setAlpha(0.9);
      }
    } else if (th.deco === '靶') {
      this.scene.add.circle(w * 0.5, h * 0.45, 26, 0xffffff).setStrokeStyle(6, 0xff6b6b).setAlpha(0.7);
      this.scene.add.circle(w * 0.5, h * 0.45, 12, 0xff6b6b).setAlpha(0.7);
    } else if (th.deco === '森林') {
      for (let i = 0; i < 4; i++) {
        this.scene.add.text(w * (0.1 + i * 0.26), h * 0.52, '🌳', { fontSize: 32 }).setAlpha(0.9);
      }
    }
    // 地面小光点（活泼粒子感）
    for (let i = 0; i < 6; i++) {
      const px = Math.random() * w, py = h * 0.66 + Math.random() * h * 0.2;
      const dot = this.scene.add.circle(px, py, 3, wcol, 0.4);
      this.scene.tweens.add({ targets: dot, alpha: 0.05, duration: 800 + Math.random() * 800, yoyo: true, repeat: -1 });
    }
  }
}
