var Z = Object.defineProperty;
var ee = (n, e, t) =>
  e in n ? Z(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : (n[e] = t);
var c = (n, e, t) => ee(n, typeof e != 'symbol' ? e + '' : e, t);
(function () {
  const e = document.createElement('link').relList;
  if (e && e.supports && e.supports('modulepreload')) return;
  for (const i of document.querySelectorAll('link[rel="modulepreload"]')) s(i);
  new MutationObserver((i) => {
    for (const o of i)
      if (o.type === 'childList')
        for (const r of o.addedNodes) r.tagName === 'LINK' && r.rel === 'modulepreload' && s(r);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(i) {
    const o = {};
    return (
      i.integrity && (o.integrity = i.integrity),
      i.referrerPolicy && (o.referrerPolicy = i.referrerPolicy),
      i.crossOrigin === 'use-credentials'
        ? (o.credentials = 'include')
        : i.crossOrigin === 'anonymous'
          ? (o.credentials = 'omit')
          : (o.credentials = 'same-origin'),
      o
    );
  }
  function s(i) {
    if (i.ep) return;
    i.ep = !0;
    const o = t(i);
    fetch(i.href, o);
  }
})();
var te = Object.defineProperty,
  ne = (n, e) => {
    for (var t in e) te(n, t, { get: e[t], enumerable: !0 });
  };
function se(n, e, t) {
  return !(
    (t.all && !t.all.every((s) => n.getComponent(e, s) !== void 0)) ||
    (t.any && !t.any.some((s) => n.getComponent(e, s) !== void 0)) ||
    (t.none && t.none.some((s) => n.getComponent(e, s) !== void 0))
  );
}
function ie(n, e, t) {
  const s = e.filter((i) => se(n, i, t));
  return {
    size: s.length,
    [Symbol.iterator]() {
      let i = 0;
      return {
        next: () => {
          var l;
          if (i >= s.length) return { done: !0, value: void 0 };
          const o = s[i++],
            r = { entity: o },
            a = new Set(t.all ?? []);
          return (
            (l = t.any) == null || l.forEach((d) => a.add(d)),
            a.forEach((d) => {
              const p = n.getComponent(o, d);
              p !== void 0 && (r[d.name] = p);
            }),
            { done: !1, value: r }
          );
        },
      };
    },
  };
}
var oe = ['init', 'preUpdate', 'update', 'postUpdate', 'render', 'cleanup'],
  ae = class {
    constructor() {
      c(this, 'nextEntity', 1);
      c(this, 'entities', new Set());
      c(this, 'stores', new Map());
      c(this, 'systems', []);
      c(this, 'elapsed', 0);
    }
    createEntity() {
      const n = this.nextEntity++;
      return (this.entities.add(n), n);
    }
    destroyEntity(n) {
      if (this.entities.delete(n)) for (const e of this.stores.values()) e.data.delete(n);
    }
    hasEntity(n) {
      return this.entities.has(n);
    }
    ensureStore(n) {
      const e = this.stores.get(n.name);
      if (e) return e;
      const t = { definition: n, data: new Map() };
      return (this.stores.set(n.name, t), t);
    }
    addComponent(n, e, t) {
      if (!this.entities.has(n)) throw new Error(`Entity ${n} does not exist`);
      this.ensureStore(e).data.set(n, t);
    }
    upsertComponent(n, e, t) {
      const s = this.ensureStore(e);
      (this.entities.has(n) || this.entities.add(n), s.data.set(n, t));
    }
    getComponent(n, e) {
      const t = this.stores.get(e.name);
      if (t) return t.data.get(n);
    }
    ensureComponent(n, e) {
      const t = this.getComponent(n, e);
      if (t !== void 0) return t;
      if (!e.defaults) throw new Error(`Component ${e.name} not found for entity ${n}`);
      const s = e.defaults();
      return (this.addComponent(n, e, s), s);
    }
    removeComponent(n, e) {
      const t = this.stores.get(e.name);
      t == null || t.data.delete(n);
    }
    query(n) {
      return ie(this, Array.from(this.entities), n);
    }
    registerSystem(n) {
      const e = oe.indexOf(n.stage);
      if (e === -1) throw new Error(`Unknown system stage: ${n.stage}`);
      const t = n.order ?? 0;
      (this.systems.push({ system: n, stageIndex: e, order: t }),
        this.systems.sort((s, i) => s.stageIndex - i.stageIndex || s.order - i.order));
    }
    unregisterSystem(n) {
      const e = this.systems.findIndex((t) => t.system.id === n);
      e >= 0 && this.systems.splice(e, 1);
    }
    step(n) {
      this.elapsed += n;
      const e = { world: this, delta: n, elapsed: this.elapsed };
      for (const { system: t } of this.systems) t.execute(e);
    }
    serialize() {
      const n = Array.from(this.entities.values()),
        e = Array.from(this.stores.values()).map((t) => ({
          name: t.definition.name,
          entities: Array.from(t.data.keys()),
          data: Array.from(t.data.values()),
        }));
      return { entities: n, components: e };
    }
    snapshot(n) {
      if (!this.entities.has(n)) throw new Error(`Entity ${n} does not exist`);
      const e = {};
      for (const t of this.stores.values()) t.data.has(n) && (e[t.definition.name] = t.data.get(n));
      return { entity: n, components: e };
    }
    clear() {
      (this.entities.clear(), this.stores.clear(), (this.systems.length = 0), (this.elapsed = 0));
    }
  },
  re = class {
    constructor(n, e) {
      ((this.id = n), (this.world = e));
    }
    onEnter(n) {}
    onExit() {}
    update(n) {}
    render() {}
  },
  le = class {
    constructor() {
      c(this, 'id', 'noop');
      c(this, 'duration', 0);
    }
    start() {}
    update() {}
    finish() {}
  },
  q = class {
    constructor() {
      c(this, 'listeners', new Map());
    }
    on(n, e) {
      const t = this.listeners.get(n) ?? new Set();
      return (t.add(e), this.listeners.set(n, t), () => this.off(n, e));
    }
    once(n, e) {
      const t = (s) => {
        (this.off(n, t), e(s));
      };
      return this.on(n, t);
    }
    off(n, e) {
      const t = this.listeners.get(n);
      t && (t.delete(e), t.size === 0 && this.listeners.delete(n));
    }
    emit(n, e) {
      const t = this.listeners.get(n);
      if (t) for (const s of Array.from(t)) s(e);
    }
    clear() {
      this.listeners.clear();
    }
  },
  ce = class {
    constructor(n) {
      c(this, 'stack', []);
      c(this, 'transitions', new Map());
      c(this, 'activeTransition', null);
      c(this, 'events', new q());
      ((this.worldFactory = n), this.registerTransition(new le()));
    }
    registerTransition(n) {
      this.transitions.set(n.id, n);
    }
    get current() {
      return this.stack[this.stack.length - 1];
    }
    async push(n, e = 'noop') {
      const t = this.worldFactory(),
        s = n(t);
      (await s.onEnter(),
        this.stack.push(s),
        this.events.emit('pushed', { scene: s }),
        this.beginTransition(void 0, s, e));
    }
    async replace(n, e = 'noop') {
      const t = this.current,
        s = this.worldFactory(),
        i = n(s);
      (await i.onEnter(),
        t
          ? ((this.stack[this.stack.length - 1] = i),
            this.events.emit('replaced', { from: t, to: i }),
            this.beginTransition(t, i, e))
          : (this.stack.push(i),
            this.events.emit('pushed', { scene: i }),
            this.beginTransition(void 0, i, e)));
    }
    async pop(n = 'noop') {
      const e = this.stack.pop();
      if (!e) return;
      (await e.onExit(), this.events.emit('popped', { scene: e }));
      const t = this.current;
      t && this.beginTransition(e, t, n);
    }
    update(n) {
      var e;
      if (this.activeTransition) {
        const t = this.activeTransition;
        t.elapsed += n;
        const s = t.transition.duration ? Math.min(1, t.elapsed / t.transition.duration) : 1;
        (t.transition.update(t.to, s),
          s >= 1 && (t.transition.finish(t.to), (this.activeTransition = null)));
      }
      (e = this.current) == null || e.update(n);
    }
    render() {
      var n;
      (n = this.current) == null || n.render();
    }
    beginTransition(n, e, t) {
      const s = this.transitions.get(t);
      if (!s) throw new Error(`Unknown transition: ${t}`);
      (s.start(e), (this.activeTransition = { transition: s, from: n, to: e, elapsed: 0 }));
    }
  },
  de = class {
    constructor() {
      c(this, 'cache', {});
    }
    load() {
      return { ...this.cache };
    }
    save(n) {
      this.cache = { ...n };
    }
  },
  he = class {
    constructor(n = 'web-game-engine-bindings') {
      this.key = n;
    }
    load() {
      if (typeof localStorage > 'u') return {};
      try {
        const n = localStorage.getItem(this.key);
        return n ? JSON.parse(n) : {};
      } catch {
        return {};
      }
    }
    save(n) {
      typeof localStorage > 'u' || localStorage.setItem(this.key, JSON.stringify(n));
    }
  },
  ue = class {
    constructor(n = {}) {
      c(this, 'bindings', new Map());
      c(this, 'states', new Map());
      c(this, 'storage');
      c(this, 'events', new q());
      this.storage = n.storage ?? (typeof localStorage < 'u' ? new he() : new de());
      const e = this.storage.load();
      Object.entries(e).forEach(([t, s]) => {
        this.bindings.set(
          t,
          s.map((i) => ({ ...i }))
        );
      });
    }
    getBindings(n) {
      var e;
      return ((e = this.bindings.get(n)) == null ? void 0 : e.map((t) => ({ ...t }))) ?? [];
    }
    bind(n, e) {
      const t = this.bindings.get(n) ?? [];
      (t.push({ ...e }), this.bindings.set(n, t), this.persist());
    }
    rebind(n, e) {
      (this.bindings.set(
        n,
        e.map((t) => ({ ...t }))
      ),
        this.persist());
    }
    removeBinding(n, e) {
      const t = this.bindings.get(n);
      t &&
        (this.bindings.set(
          n,
          t.filter((s) => !e(s))
        ),
        this.persist());
    }
    handleKey(n, e, t = performance.now()) {
      this.processInput('keyboard', n, e, t);
    }
    handleGamepadButton(n, e, t = performance.now()) {
      this.processInput('gamepad', n, e, t);
    }
    handleAction(n, e, t = 1, s = performance.now()) {
      const i = this.getOrCreateState(n);
      ((i.pressed = e), (i.value = t), (i.updatedAt = s), this.emitState(n, i, e));
    }
    processInput(n, e, t, s) {
      for (const [i, o] of this.bindings)
        if (o.some((r) => r.device === n && r.code === e)) {
          const r = this.getOrCreateState(i);
          ((r.pressed = t), (r.value = t ? 1 : 0), (r.updatedAt = s), this.emitState(i, r, t));
        }
    }
    getOrCreateState(n) {
      var s;
      const e = this.states.get(n);
      if (e) return e;
      const t = {
        pressed: !1,
        value: 0,
        updatedAt: ((s = performance.now) == null ? void 0 : s.call(performance)) ?? Date.now(),
      };
      return (this.states.set(n, t), t);
    }
    emitState(n, e, t) {
      const s = t ? 'actionDown' : 'actionUp';
      this.events.emit(s, { action: n, state: { ...e } });
    }
    persist() {
      const n = {};
      for (const [e, t] of this.bindings.entries()) n[e] = t.map((s) => ({ ...s }));
      this.storage.save(n);
    }
  },
  pe = {};
ne(pe, { detectBackendForCanvas: () => me, isWebGL2Available: () => fe });
function fe() {
  if (typeof document > 'u' || typeof window > 'u' || !window.WebGL2RenderingContext) return !1;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return !1;
  }
}
function me(n) {
  try {
    const t = n.getContext('webgl2'),
      s = window.WebGL2RenderingContext;
    if (t && s && t instanceof s) return 'webgl2';
  } catch {}
  return n.getContext('2d') ? 'canvas2d' : 'none';
}
var ge = class {
  constructor(n) {
    c(this, 'container');
    c(this, 'root');
    ((this.container = (n == null ? void 0 : n.container) ?? document.body),
      (this.root = document.createElement('div')));
    const e = this.root.style;
    ((e.position = 'fixed'),
      (e.top = '0'),
      (e.left = '0'),
      (e.width = '100%'),
      (e.height = '100%'),
      (e.pointerEvents = 'none'),
      (e.zIndex = '9998'));
  }
  attach() {
    this.root.isConnected || this.container.appendChild(this.root);
  }
  detach() {
    this.root.parentElement && this.root.parentElement.removeChild(this.root);
  }
  clear() {
    this.root.innerHTML = '';
  }
  addText(n) {
    const e = document.createElement('div');
    return (
      (e.textContent = n.text),
      (e.style.color = '#e8f0ff'),
      (e.style.font = '14px/1.4 system-ui, sans-serif'),
      this.position(e, n),
      this.root.appendChild(e),
      e
    );
  }
  addImage(n) {
    const e = document.createElement('img');
    return (
      (e.src = n.src),
      n.alt && (e.alt = n.alt),
      n.width && (e.width = n.width),
      n.height && (e.height = n.height),
      this.position(e, n),
      this.root.appendChild(e),
      e
    );
  }
  addButton(n) {
    const e = document.createElement('button');
    return (
      (e.textContent = n.label),
      (e.style.pointerEvents = 'auto'),
      (e.style.padding = '6px 10px'),
      (e.style.borderRadius = '8px'),
      (e.style.border = '1px solid #223040'),
      (e.style.background = '#11151a'),
      (e.style.color = '#e8f0ff'),
      n.onClick &&
        e.addEventListener('click', () => {
          var t;
          return (t = n.onClick) == null ? void 0 : t.call(n);
        }),
      this.position(e, n),
      this.root.appendChild(e),
      e
    );
  }
  addPanel(n = {}) {
    const e = document.createElement('div'),
      t = e.style;
    if (
      ((t.pointerEvents = 'auto'),
      (t.background = 'rgba(10, 12, 16, 0.9)'),
      (t.border = '1px solid #223040'),
      (t.borderRadius = '10px'),
      (t.padding = '10px 12px'),
      (t.minWidth = '160px'),
      n.title)
    ) {
      const s = document.createElement('div');
      ((s.textContent = n.title),
        (s.style.fontWeight = '600'),
        (s.style.marginBottom = '6px'),
        e.appendChild(s));
    }
    return (this.position(e, n), this.root.appendChild(e), e);
  }
  position(n, e) {
    const t = n.style;
    t.position = 'absolute';
    const s = e.anchor ?? 'top-left',
      i = e.x ?? 0,
      o = e.y ?? 0;
    switch (s) {
      case 'top-left':
        ((t.top = `${o}px`), (t.left = `${i}px`));
        break;
      case 'top-right':
        ((t.top = `${o}px`), (t.right = `${i}px`));
        break;
      case 'bottom-left':
        ((t.bottom = `${o}px`), (t.left = `${i}px`));
        break;
      case 'bottom-right':
        ((t.bottom = `${o}px`), (t.right = `${i}px`));
        break;
      case 'center':
        ((t.top = '50%'),
          (t.left = '50%'),
          (t.transform = `translate(-50%, -50%) translate(${i}px, ${o}px)`));
        break;
    }
  }
};
const _ = (n) => `${n.x},${n.y}`;
function B(n) {
  return { x: n.x, y: n.y };
}
function ye(n, e) {
  const t = e ?? n.defaultLevelId;
  return n.levels.find((s) => s.id === t) ?? n.levels[0];
}
function be(n, e, t, s = 0) {
  const i = ye(n, t);
  if (!i) {
    ((e.levelId = 'default'),
      (e.levelName = 'Unknown'),
      (e.obstacles = []),
      (e.obstacleSet = new Set()),
      (e.hazardDefinitions = {}),
      (e.hazards = []),
      (e.nextHazardId = 1),
      (e.hazardsDisabledUntil = -1 / 0));
    return;
  }
  ((e.levelId = i.id),
    (e.levelName = i.name),
    (e.theme = { ...i.theme }),
    (e.obstacles = i.obstacles.map((o) => B(o))),
    (e.obstacleSet = new Set()),
    e.obstacles.forEach((o) => e.obstacleSet.add(_(o))),
    (e.hazardDefinitions = {}),
    i.hazards.forEach((o) => {
      const r = o.path.length > 0 ? o.path : [{ x: 0, y: 0 }];
      e.hazardDefinitions[o.id] = { ...o, path: r.map((a) => B(a)) };
    }),
    (e.hazards = i.hazards.map((o, r) => ve(o, r, s))),
    (e.nextHazardId = e.hazards.length + 1),
    (e.hazardsDisabledUntil = -1 / 0));
}
function ve(n, e, t) {
  const s = n.path[0] ?? { x: 0, y: 0 },
    i = B(s);
  return {
    id: e + 1,
    definitionId: n.id,
    position: i,
    pathIndex: 0,
    direction: 1,
    nextMoveAt: t + n.stepIntervalMs,
  };
}
function G(n) {
  if (!n) return [];
  const e = n.hazards.map((t) => B(t.position));
  return [...n.obstacles.map((t) => B(t)), ...e];
}
function xe(n, e) {
  return n ? n.obstacleSet.has(_(e)) : !1;
}
function we(n, e) {
  if (n) return n.hazards.find((t) => t.position.x === e.x && t.position.y === e.y);
}
function Se(n, e) {
  n.hazards.forEach((t) => {
    if (t.nextMoveAt > e) return;
    const s = n.hazardDefinitions[t.definitionId];
    if (!s) {
      t.nextMoveAt = e + 1e3;
      return;
    }
    if (s.path.length === 0) {
      t.nextMoveAt = e + (s.stepIntervalMs || 1e3);
      return;
    }
    if (s.path.length === 1) {
      t.nextMoveAt = e + s.stepIntervalMs;
      return;
    }
    let i = t.pathIndex + t.direction;
    if (s.pingPong !== !1)
      (i >= s.path.length || i < 0) && ((t.direction *= -1), (i = t.pathIndex + t.direction));
    else {
      const r = s.path.length;
      i = ((i % r) + r) % r;
    }
    t.pathIndex = Math.max(0, Math.min(s.path.length - 1, i));
    const o = s.path[t.pathIndex];
    ((t.position = B(o)), (t.nextMoveAt = e + s.stepIntervalMs));
  });
}
function Ce(n) {
  let e = 1779033703 ^ n.length,
    t = 3144134277 ^ n.length;
  for (let s = 0; s < n.length; s += 1) {
    const i = n.charCodeAt(s);
    ((e = Math.imul(e ^ i, 597399067)), (t = Math.imul(t ^ i, 2869860233)));
  }
  return (
    (e = Math.imul(e ^ (e >>> 15), 2246822507)),
    (e ^= Math.imul(t ^ (t >>> 13), 3266489909)),
    (t = Math.imul(t ^ (t >>> 16), 2246822507)),
    (t ^= Math.imul(e ^ (e >>> 16), 3266489909)),
    () => (
      (t = Math.imul(t ^ (t >>> 15), 2246822507)),
      (t ^= Math.imul(t ^ (t >>> 13), 3266489909)),
      ((t >>> 0) / 4294967296) % 1
    )
  );
}
function z(n, e, t) {
  return Math.floor(n() * (t - e + 1)) + e;
}
function Me(n, e, t, s, i) {
  const o = Math.floor(t / 2),
    r = Math.floor(s / 2);
  return Math.abs(n - o) <= i && Math.abs(e - r) <= i;
}
function ke(n, e, t) {
  const i = new Set(),
    o = 24,
    r = 2;
  let a = 0;
  for (; a < 4; ) {
    let d = !1;
    for (let p = 0; p < o && !d; p += 1) {
      const h = z(t, 2, 3),
        w = z(t, 2, 3),
        b = z(t, 1, Math.max(1, n - h - 2)),
        u = z(t, 1, Math.max(1, e - w - 2));
      let f = !1;
      for (let m = 0; m < w && !f; m += 1)
        for (let y = 0; y < h && !f; y += 1) {
          const v = b + y,
            g = u + m,
            S = `${v},${g}`;
          (i.has(S) || Me(v, g, n, e, r)) && (f = !0);
        }
      if (!f) {
        for (let m = 0; m < w; m += 1)
          for (let y = 0; y < h; y += 1) {
            const v = b + y,
              g = u + m;
            i.add(`${v},${g}`);
          }
        ((d = !0), (a += 1));
      }
    }
    if (!d) break;
  }
  return {
    obstacles: Array.from(i).map((d) => {
      const [p, h] = d.split(',').map((w) => Number.parseInt(w, 10));
      return { x: p, y: h };
    }),
    obstacleSet: i,
  };
}
function F(n, e, t, s, i, o) {
  for (let a = 0; a < 12; a += 1)
    if (e === 'horizontal') {
      const l = z(o, 2, s - 3),
        d = [];
      for (let p = 1; p < t - 1; p += 1) {
        const h = `${p},${l}`;
        i.has(h) || d.push({ x: p, y: l });
      }
      if (d.length > 1) return { id: n, path: d, stepIntervalMs: z(o, 520, 660), pingPong: !0 };
    } else {
      const l = z(o, 2, t - 3),
        d = [];
      for (let p = 1; p < s - 1; p += 1) {
        const h = `${l},${p}`;
        i.has(h) || d.push({ x: l, y: p });
      }
      if (d.length > 1) return { id: n, path: d, stepIntervalMs: z(o, 560, 700), pingPong: !0 };
    }
  return null;
}
function Ee(n, e, t) {
  const s = Ce(t),
    { obstacles: i, obstacleSet: o } = ke(n, e, s),
    r = [],
    a = F('h-sweeper', 'horizontal', n, e, o, s);
  a && r.push(a);
  const l = F('v-sweeper', 'vertical', n, e, o, s);
  return (l && r.push(l), { obstacles: i, hazards: r });
}
const k = {
    name: 'super-snake.grid',
    defaults: () => ({ width: 16, height: 16, cellSize: 32, mode: 'wrap' }),
  },
  C = {
    name: 'super-snake.snake',
    defaults: () => ({
      segments: [],
      direction: 'right',
      nextDirection: 'right',
      pendingGrowth: 0,
      alive: !0,
    }),
  },
  $ = {
    name: 'super-snake.snakeMovement',
    defaults: () => ({ moveIntervalMs: 140, accumulatorMs: 0 }),
  },
  A = {
    name: 'super-snake.state',
    defaults: () => ({
      ticks: 0,
      lastMoveAt: 0,
      mode: 'wrap',
      score: 0,
      comboCount: 0,
      maxCombo: 0,
      lastConsumedAt: -1 / 0,
    }),
  },
  H = {
    name: 'super-snake.foodConfig',
    defaults: () => ({
      definitions: [
        {
          id: 'apple',
          rarity: 'common',
          weight: 7,
          growth: 1,
          score: 10,
          comboBonus: 0,
          tint: [0.85, 0.2, 0.2, 1],
        },
        {
          id: 'berry',
          rarity: 'uncommon',
          weight: 3,
          growth: 2,
          score: 25,
          comboBonus: 1,
          tint: [0.2, 0.4, 0.9, 1],
        },
        {
          id: 'starfruit',
          rarity: 'rare',
          weight: 1,
          growth: 3,
          score: 75,
          comboBonus: 2,
          tint: [0.95, 0.85, 0.2, 1],
        },
      ],
      maxActive: 3,
      spawnIntervalMs: 2e3,
      comboWindowMs: 4e3,
      random: void 0,
    }),
  },
  D = {
    name: 'super-snake.foodState',
    defaults: () => ({ items: [], lastSpawnAt: -1 / 0, nextId: 1 }),
  },
  U = {
    name: 'super-snake.powerUpConfig',
    defaults: () => ({
      definitions: [
        {
          id: 'slow-mo',
          type: 'slow-mo',
          weight: 3,
          durationMs: 6e3,
          effect: { speedMultiplier: 1.8 },
          tint: [0.25, 0.65, 0.95, 1],
          icon: '🐢',
        },
        {
          id: 'ghost',
          type: 'ghost',
          weight: 2,
          durationMs: 5e3,
          effect: { ghostPhase: !0 },
          tint: [0.7, 0.8, 0.95, 1],
          icon: '👻',
        },
        {
          id: 'magnet',
          type: 'magnet',
          weight: 2,
          durationMs: 7e3,
          effect: { magnetRange: 4 },
          tint: [0.9, 0.6, 0.15, 1],
          icon: '🧲',
        },
        {
          id: 'double-score',
          type: 'double-score',
          weight: 2,
          durationMs: 8e3,
          effect: { scoreMultiplier: 2 },
          tint: [0.95, 0.3, 0.6, 1],
          icon: '✨',
        },
        {
          id: 'shockwave',
          type: 'shockwave',
          weight: 2,
          durationMs: 5e3,
          effect: { hazardDisableMs: 6e3 },
          tint: [0.55, 0.9, 0.95, 1],
          icon: '⚡',
        },
      ],
      maxActive: 1,
      spawnIntervalMs: 12e3,
      initialDelayMs: 6e3,
      random: void 0,
    }),
  },
  P = {
    name: 'super-snake.powerUpState',
    defaults: () => ({ items: [], active: [], lastSpawnAt: -1 / 0, nextId: 1 }),
  },
  W = {
    name: 'super-snake.levelConfig',
    defaults: () => {
      const { obstacles: t, hazards: s } = Ee(16, 16, 'aurora');
      return {
        levels: [
          {
            id: 'aurora-garden',
            name: 'Aurora Garden',
            theme: {
              id: 'aurora',
              backgroundColor: '#041924',
              gridLineColor: 'rgba(255, 255, 255, 0.06)',
              snakeBodyColor: '#74f7b4',
              snakeHeadColor: '#c6ffe0',
              obstacleColor: '#1b2f3c',
              hazardColor: '#f26c6c',
              hazardIcon: '✴️',
              overlayColor: 'rgba(36, 23, 58, 0.2)',
            },
            obstacles: t,
            hazards: s,
          },
        ],
        defaultLevelId: 'aurora-garden',
      };
    },
  },
  I = {
    name: 'super-snake.levelState',
    defaults: () => ({
      levelId: 'default',
      levelName: 'Unknown',
      theme: {
        id: 'default',
        backgroundColor: '#051622',
        gridLineColor: 'rgba(255, 255, 255, 0.05)',
        snakeBodyColor: '#2ecc71',
        snakeHeadColor: '#a2ffd9',
        obstacleColor: '#234052',
        hazardColor: '#f25f5c',
        hazardIcon: '✴️',
        overlayColor: void 0,
      },
      obstacles: [],
      obstacleSet: new Set(),
      hazardDefinitions: {},
      hazards: [],
      nextHazardId: 1,
      hazardsDisabledUntil: -1 / 0,
    }),
  },
  Ie = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
function j(n) {
  return Ie[n];
}
function Ae(n, e) {
  return { x: n.x + e.x, y: n.y + e.y };
}
function Pe(n, e) {
  return n.x >= 0 && n.x < e.width && n.y >= 0 && n.y < e.height;
}
function ze(n, e) {
  let { x: t, y: s } = n;
  return (
    (t = ((t % e.width) + e.width) % e.width),
    (s = ((s % e.height) + e.height) % e.height),
    { x: t, y: s }
  );
}
function De(n, e, t, s) {
  const i = j(e),
    o = Ae(n, i);
  return s === 'wrap'
    ? { position: ze(o, t), collided: !1 }
    : Pe(o, t)
      ? { position: o, collided: !1 }
      : { position: o, collided: !0 };
}
function Le(n, e, t) {
  ((n.segments = e.map(({ x: s, y: i }) => ({ x: s, y: i }))),
    (n.direction = t),
    (n.nextDirection = t),
    (n.pendingGrowth = Math.max(0, n.pendingGrowth)),
    (n.alive = !0));
}
function T(n) {
  if (n.segments.length === 0) throw new Error('Snake has no segments');
  return n.segments[0];
}
function Be(n, e) {
  const t = n.pendingGrowth === 0 ? n.segments.length - 1 : n.segments.length;
  return n.segments.slice(0, t).some((s) => s.x === e.x && s.y === e.y);
}
function Ue(n, e) {
  const t = { x: e.x, y: e.y };
  n.segments.unshift(t);
  let s = null,
    i = !1;
  return (
    n.pendingGrowth > 0 ? ((n.pendingGrowth -= 1), (i = !0)) : (s = n.segments.pop() ?? null),
    { tail: s, grew: i }
  );
}
function $e(n, e) {
  const t = { up: 'down', down: 'up', left: 'right', right: 'left' };
  (n.segments.length <= 1 || e !== t[n.direction]) && (n.nextDirection = e);
}
function He(n) {
  return ((n.direction = n.nextDirection), n.direction);
}
function V(n, e) {
  const t = n.definitions,
    s = t.reduce((r, a) => r + a.weight, 0);
  if (s <= 0) throw new Error('Food definitions must have positive cumulative weight');
  const i = e() * s;
  let o = 0;
  for (const r of t) if (((o += r.weight), i <= o)) return r;
  return t[t.length - 1];
}
function X(n, e, t, s = []) {
  const i = new Set();
  (e.segments.forEach((r) => {
    i.add(`${r.x},${r.y}`);
  }),
    t.items.forEach((r) => {
      i.add(`${r.x},${r.y}`);
    }));
  for (const r of s) i.add(`${r.x},${r.y}`);
  const o = [];
  for (let r = 0; r < n.height; r += 1)
    for (let a = 0; a < n.width; a += 1) {
      const l = `${a},${r}`;
      i.has(l) || o.push({ x: a, y: r });
    }
  return o;
}
function Y(n, e, t, s) {
  return {
    id: n.nextId++,
    type: e.id,
    x: t.x,
    y: t.y,
    spawnedAt: s,
    growth: e.growth,
    score: e.score,
    comboBonus: e.comboBonus ?? 0,
    tint: [...e.tint],
  };
}
function Te(n, e = {}) {
  const t = {
      ...k.defaults(),
      width: e.gridWidth ?? 16,
      height: e.gridHeight ?? 16,
      cellSize: e.cellSize ?? 32,
      mode: e.mode ?? 'wrap',
    },
    s = n.createEntity();
  n.addComponent(s, k, t);
  const i = {
      ...C.defaults(),
      segments: [],
      direction: e.direction ?? 'right',
      nextDirection: e.direction ?? 'right',
      pendingGrowth: 0,
      alive: !0,
    },
    o = e.spawn ?? { x: Math.floor(t.width / 2), y: Math.floor(t.height / 2) },
    r = i.direction,
    a = j(r),
    l = Math.max(1, e.initialLength ?? 3),
    d = [];
  for (let x = 0; x < l; x += 1) d.push({ x: o.x - a.x * x, y: o.y - a.y * x });
  (Le(i, d, r), n.addComponent(s, C, i));
  const p = $.defaults(),
    h = {
      ...p,
      moveIntervalMs: Math.max(16, e.moveIntervalMs ?? p.moveIntervalMs),
      accumulatorMs: 0,
    };
  n.addComponent(s, $, h);
  const w = A.defaults();
  ((w.mode = t.mode), n.addComponent(s, A, w));
  const b = W.defaults(),
    u = {
      levels:
        e.levelDefinitions ??
        b.levels.map((x) => ({
          ...x,
          theme: { ...x.theme },
          obstacles: x.obstacles.map((L) => ({ ...L })),
          hazards: x.hazards.map((L) => ({ ...L, path: L.path.map((J) => ({ ...J })) })),
        })),
      defaultLevelId: e.levelId ?? b.defaultLevelId,
    };
  n.addComponent(s, W, u);
  const f = I.defaults();
  (be(u, f, e.levelId, 0), n.addComponent(s, I, f));
  const m = H.defaults(),
    y = {
      ...m,
      definitions: e.foodDefinitions ?? m.definitions.map((x) => ({ ...x })),
      maxActive: e.foodMaxActive ?? m.maxActive,
      spawnIntervalMs: e.foodSpawnIntervalMs ?? m.spawnIntervalMs,
      comboWindowMs: e.comboWindowMs ?? m.comboWindowMs,
      random: e.random ?? m.random,
    };
  n.addComponent(s, H, y);
  const v = D.defaults();
  (n.addComponent(s, D, v), Re(y, v, t, i, f));
  const g = U.defaults(),
    S = {
      ...g,
      definitions: e.powerUpDefinitions ?? g.definitions.map((x) => ({ ...x })),
      maxActive: e.powerUpMaxActive ?? g.maxActive,
      spawnIntervalMs: e.powerUpSpawnIntervalMs ?? g.spawnIntervalMs,
      initialDelayMs: e.powerUpInitialDelayMs ?? g.initialDelayMs,
      random: e.random ?? g.random,
    };
  n.addComponent(s, U, S);
  const M = P.defaults();
  return (n.addComponent(s, P, M), s);
}
function Re(n, e, t, s, i) {
  const o = n.random ?? Math.random,
    r = Math.min(n.maxActive, t.width * t.height - s.segments.length);
  for (let a = e.items.length; a < r; a += 1) {
    const l = G(i),
      d = X(t, s, e, l);
    if (d.length === 0) break;
    const p = d[Math.floor(o() * d.length)],
      h = V(n, o),
      w = Y(e, h, p, 0);
    (e.items.push(w), (e.lastSpawnAt = 0));
  }
}
function Ge(n, e) {
  const t = n.definitions.reduce((i, o) => i + o.weight, 0);
  if (t <= 0) throw new Error('Power-up definitions must have positive cumulative weight');
  let s = e() * t;
  for (const i of n.definitions) if (((s -= i.weight), s <= 0)) return i;
  return n.definitions[n.definitions.length - 1];
}
function Fe(n, e, t, s) {
  return {
    id: n.nextId++,
    definitionId: e.id,
    type: e.type,
    x: t.x,
    y: t.y,
    spawnedAt: s,
    tint: [...e.tint],
    icon: e.icon,
  };
}
function We(n, e, t, s, i) {
  const o = new Set();
  (e.segments.forEach((a) => {
    o.add(`${a.x},${a.y}`);
  }),
    t == null ||
      t.items.forEach((a) => {
        o.add(`${a.x},${a.y}`);
      }),
    s.items.forEach((a) => {
      o.add(`${a.x},${a.y}`);
    }),
    i && G(i).forEach((l) => o.add(`${l.x},${l.y}`)));
  const r = [];
  for (let a = 0; a < n.height; a += 1)
    for (let l = 0; l < n.width; l += 1) {
      const d = `${l},${a}`;
      o.has(d) || r.push({ x: l, y: a });
    }
  return r;
}
function Oe(n, e) {
  n.active.length !== 0 && (n.active = n.active.filter((t) => t.expiresAt > e));
}
function R(n, e, t) {
  if (n) return n.active.find((s) => s.type === e && s.expiresAt > t);
}
function Ne(n, e) {
  const t = R(n, 'slow-mo', e),
    s = t == null ? void 0 : t.effect.speedMultiplier;
  return s && s > 0 ? s : 1;
}
function Ke(n, e) {
  const t = R(n, 'ghost', e);
  return !!(t != null && t.effect.ghostPhase);
}
function qe(n, e) {
  const t = R(n, 'double-score', e),
    s = t == null ? void 0 : t.effect.scoreMultiplier;
  return s && s > 0 ? s : 1;
}
function _e(n, e) {
  const t = R(n, 'magnet', e),
    s = t == null ? void 0 : t.effect.magnetRange;
  return s && s > 0 ? s : null;
}
function je(n, e) {
  return {
    speedMultiplier: e.speedMultiplier ?? n.speedMultiplier,
    ghostPhase: e.ghostPhase ?? n.ghostPhase,
    scoreMultiplier: e.scoreMultiplier ?? n.scoreMultiplier,
    magnetRange: e.magnetRange ?? n.magnetRange,
    hazardDisableMs: e.hazardDisableMs ?? n.hazardDisableMs,
  };
}
function Ve() {
  return {
    id: 'super-snake.systems.snake-movement',
    stage: 'update',
    order: 0,
    execute: ({ world: n, delta: e, elapsed: t }) => {
      const s = n.query({ all: [k, C, $, A] });
      if (s.size !== 0)
        for (const i of s) {
          const o = i.entity,
            r = n.getComponent(o, k),
            a = n.getComponent(o, C),
            l = n.getComponent(o, $),
            d = n.getComponent(o, A),
            p = n.getComponent(o, P),
            h = n.getComponent(o, I);
          if (!r || !a || !l || !d || !a.alive || a.segments.length === 0) continue;
          ((d.mode = r.mode), (l.accumulatorMs += e));
          const w = Ne(p, t),
            b = Math.max(1, l.moveIntervalMs * w),
            u = Ke(p, t);
          for (; l.accumulatorMs >= b; ) {
            l.accumulatorMs -= b;
            const f = He(a),
              m = T(a),
              { position: y, collided: v } = De(m, f, r, d.mode),
              g = u ? !1 : Be(a, y),
              S = h ? h.hazardsDisabledUntil > t : !1,
              M = h ? xe(h, y) : !1,
              x = h && !S ? we(h, y) !== void 0 : !1;
            if (v || g || M || x) {
              ((a.alive = !1), (l.accumulatorMs = 0));
              break;
            }
            (Ue(a, y), (d.ticks += 1), (d.lastMoveAt = t));
          }
        }
    },
  };
}
function Xe() {
  return {
    id: 'super-snake.systems.hazards',
    stage: 'update',
    order: 1,
    execute: ({ world: n, elapsed: e }) => {
      const t = n.query({ all: [k, C, I] });
      if (t.size !== 0)
        for (const s of t) {
          const i = s.entity,
            o = n.getComponent(i, C),
            r = n.getComponent(i, I);
          if (!o || !r || !o.alive || o.segments.length === 0) continue;
          const a = r.hazardsDisabledUntil > e;
          (a || Se(r, e),
            a ||
              (r.hazards.some((d) =>
                o.segments.some((p) => p.x === d.position.x && p.y === d.position.y)
              ) &&
                (o.alive = !1)));
        }
    },
  };
}
function Ye() {
  return {
    id: 'super-snake.systems.food',
    stage: 'update',
    order: 3,
    execute: ({ world: n, elapsed: e }) => {
      const t = n.query({ all: [k, C, A, H, D] });
      if (t.size !== 0)
        for (const s of t) {
          const i = s.entity,
            o = n.getComponent(i, k),
            r = n.getComponent(i, C),
            a = n.getComponent(i, A),
            l = n.getComponent(i, H),
            d = n.getComponent(i, D),
            p = n.getComponent(i, P),
            h = n.getComponent(i, I);
          if (!o || !r || !a || !l || !d) continue;
          const w = l.random ?? Math.random;
          if (r.alive && r.segments.length > 0) {
            const b = T(r),
              u = d.items.findIndex((f) => f.x === b.x && f.y === b.y);
            if (u >= 0) {
              const f = d.items.splice(u, 1)[0];
              r.pendingGrowth += f.growth;
              const v =
                (e - a.lastConsumedAt <= l.comboWindowMs ? a.comboCount + 1 : 1) + f.comboBonus;
              ((a.comboCount = v),
                (a.maxCombo = Math.max(a.maxCombo, a.comboCount)),
                (a.lastConsumedAt = e));
              const g = Math.max(1, a.comboCount),
                S = p ? qe(p, e) : 1;
              ((a.score += f.score * g * S), (d.lastSpawnAt = e - l.spawnIntervalMs));
            }
          }
          for (; d.items.length < l.maxActive && e - d.lastSpawnAt >= l.spawnIntervalMs; ) {
            const b = G(h),
              u = X(o, r, d, b);
            if (u.length === 0) break;
            let f = u;
            if (p && r.segments.length > 0) {
              const g = _e(p, e);
              if (g !== null) {
                const S = T(r),
                  M = u.filter((x) => Math.abs(x.x - S.x) + Math.abs(x.y - S.y) <= g);
                M.length > 0 && (f = M);
              }
            }
            const m = f[Math.floor(w() * f.length)],
              y = V(l, w),
              v = Y(d, y, m, e);
            (d.items.push(v), (d.lastSpawnAt = e));
          }
        }
    },
  };
}
function Qe() {
  return {
    id: 'super-snake.systems.power-ups',
    stage: 'update',
    order: 2,
    execute: ({ world: n, elapsed: e }) => {
      const t = n.query({ all: [k, C, U, P] });
      if (t.size !== 0)
        for (const s of t) {
          const i = s.entity,
            o = n.getComponent(i, k),
            r = n.getComponent(i, C),
            a = n.getComponent(i, U),
            l = n.getComponent(i, P),
            d = n.getComponent(i, D),
            p = n.getComponent(i, I);
          if (!o || !r || !a || !l) continue;
          if ((Oe(l, e), r.alive && r.segments.length > 0 && l.items.length > 0)) {
            const b = T(r),
              u = l.items.findIndex((f) => f.x === b.x && f.y === b.y);
            if (u >= 0) {
              const f = l.items.splice(u, 1)[0],
                m = a.definitions.find((y) => y.id === f.definitionId);
              if (m) {
                const y = e + m.durationMs,
                  v = l.active.findIndex((g) => g.type === f.type);
                if (v >= 0) {
                  const g = l.active[v];
                  ((g.expiresAt = Math.max(g.expiresAt, y)), (g.effect = je(g.effect, m.effect)));
                } else
                  l.active.push({ id: f.id, type: f.type, expiresAt: y, effect: { ...m.effect } });
                m.effect.hazardDisableMs &&
                  p &&
                  (p.hazardsDisabledUntil = Math.max(
                    p.hazardsDisabledUntil,
                    e + m.effect.hazardDisableMs
                  ));
              }
            }
          }
          const h = a.random ?? Math.random;
          if (
            a.definitions.length > 0 &&
            l.items.length < a.maxActive &&
            e >= a.initialDelayMs &&
            e - l.lastSpawnAt >= a.spawnIntervalMs &&
            r.segments.length > 0
          ) {
            const b = We(o, r, d, l, p);
            if (b.length > 0) {
              const u = b[Math.floor(h() * b.length)],
                f = Ge(a, h),
                m = Fe(l, f, u, e);
              (l.items.push(m), (l.lastSpawnAt = e));
            } else l.lastSpawnAt = e;
          }
        }
    },
  };
}
const O = {
    'move-up': [
      { action: 'move-up', device: 'keyboard', code: 'ArrowUp' },
      { action: 'move-up', device: 'keyboard', code: 'KeyW' },
    ],
    'move-down': [
      { action: 'move-down', device: 'keyboard', code: 'ArrowDown' },
      { action: 'move-down', device: 'keyboard', code: 'KeyS' },
    ],
    'move-left': [
      { action: 'move-left', device: 'keyboard', code: 'ArrowLeft' },
      { action: 'move-left', device: 'keyboard', code: 'KeyA' },
    ],
    'move-right': [
      { action: 'move-right', device: 'keyboard', code: 'ArrowRight' },
      { action: 'move-right', device: 'keyboard', code: 'KeyD' },
    ],
    pause: [
      { action: 'pause', device: 'keyboard', code: 'Escape' },
      { action: 'pause', device: 'keyboard', code: 'Space' },
    ],
  },
  N = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
class Je {
  constructor(e = {}) {
    c(this, 'manager');
    c(this, 'window');
    c(this, 'navigator');
    c(this, 'gamepadDeadzone');
    c(this, 'enableKeyboard');
    c(this, 'enableTouch');
    c(this, 'enableGamepad');
    c(this, 'directionQueue', []);
    c(this, 'gamepadButtonStates', new Map());
    c(this, 'lastAxisDirection', null);
    c(this, 'pointerSnapshot', null);
    c(this, 'pointerThreshold', 24);
    c(this, 'attached', !1);
    c(this, 'listeners', []);
    c(this, 'unsubscribes', []);
    c(this, 'pauseListeners', new Set());
    c(this, 'onKeyDown', (e) => {
      this.enableKeyboard &&
        (e.repeat ||
          (N.has(e.code) && e.preventDefault(), this.manager.handleKey(e.code, !0, this.now())));
    });
    c(this, 'onKeyUp', (e) => {
      this.enableKeyboard &&
        (N.has(e.code) && e.preventDefault(), this.manager.handleKey(e.code, !1, this.now()));
    });
    c(this, 'onBlur', () => {
      ['move-up', 'move-down', 'move-left', 'move-right'].forEach((t) => {
        this.manager.handleAction(t, !1, 0, this.now());
      });
    });
    c(this, 'onPointerDown', (e) => {
      this.enableTouch &&
        ((e.pointerType !== 'touch' && e.pointerType !== 'pen') ||
          ((this.pointerSnapshot = {
            id: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startTime: this.now(),
          }),
          e.preventDefault()));
    });
    c(this, 'onPointerUp', (e) => {
      if (!this.enableTouch || !this.pointerSnapshot || e.pointerId !== this.pointerSnapshot.id)
        return;
      const t = e.clientX - this.pointerSnapshot.startX,
        s = e.clientY - this.pointerSnapshot.startY,
        i = Math.abs(t),
        o = Math.abs(s);
      if (i < this.pointerThreshold && o < this.pointerThreshold) {
        this.pointerSnapshot = null;
        return;
      }
      (i > o
        ? this.queueDirection(t > 0 ? 'right' : 'left')
        : this.queueDirection(s > 0 ? 'down' : 'up'),
        (this.pointerSnapshot = null),
        e.preventDefault());
    });
    c(this, 'onPointerCancel', () => {
      this.enableTouch && (this.pointerSnapshot = null);
    });
    ((this.window = e.window ?? window),
      (this.navigator = e.navigator ?? (typeof navigator < 'u' ? navigator : void 0)),
      (this.gamepadDeadzone = e.gamepadDeadzone ?? 0.35),
      (this.enableKeyboard = e.enableKeyboard ?? !0),
      (this.enableTouch = e.enableTouch ?? !0),
      (this.enableGamepad = e.enableGamepad ?? !0));
    const t = e.storage ? { storage: e.storage } : {};
    ((this.manager = new ue(t)), this.ensureDefaultBindings(), this.subscribeActions());
  }
  attach(e) {
    this.attached ||
      ((this.attached = !0),
      this.enableKeyboard &&
        (this.addListener(this.window, 'keydown', this.onKeyDown, { passive: !1 }),
        this.addListener(this.window, 'keyup', this.onKeyUp, { passive: !1 }),
        this.addListener(this.window, 'blur', this.onBlur)),
      this.enableTouch &&
        (this.addListener(e, 'pointerdown', this.onPointerDown, { passive: !1 }),
        this.addListener(e, 'pointerup', this.onPointerUp, { passive: !1 }),
        this.addListener(e, 'pointercancel', this.onPointerCancel, { passive: !1 }),
        this.addListener(e, 'pointerleave', this.onPointerCancel, { passive: !1 })));
  }
  detach() {
    if (this.attached) {
      for (this.attached = !1; this.listeners.length > 0; ) {
        const e = this.listeners.pop();
        e == null || e();
      }
      for (; this.unsubscribes.length > 0; ) {
        const e = this.unsubscribes.pop();
        e == null || e();
      }
      (this.gamepadButtonStates.clear(),
        (this.lastAxisDirection = null),
        (this.pointerSnapshot = null),
        (this.directionQueue.length = 0),
        this.pauseListeners.clear());
    }
  }
  update() {
    var t, s, i;
    if (!this.enableGamepad || !((t = this.navigator) != null && t.getGamepads)) return;
    const e = (i = (s = this.navigator).getGamepads) == null ? void 0 : i.call(s);
    if (e) for (const o of e) o && (this.processGamepadButtons(o), this.processGamepadAxes(o));
  }
  consumeDirection() {
    return this.directionQueue.shift() ?? null;
  }
  queueDirection(e) {
    this.directionQueue[this.directionQueue.length - 1] !== e && this.directionQueue.push(e);
  }
  getBindings(e) {
    return this.manager.getBindings(e);
  }
  rebind(e, t) {
    this.manager.rebind(e, t);
  }
  onPause(e) {
    return (this.pauseListeners.add(e), () => this.pauseListeners.delete(e));
  }
  ensureDefaultBindings() {
    Object.keys(O).forEach((e) => {
      this.manager.getBindings(e).length === 0 && this.manager.rebind(e, O[e]);
    });
  }
  subscribeActions() {
    this.unsubscribes.push(
      this.manager.events.on('actionDown', ({ action: e }) => {
        switch (e) {
          case 'move-up':
            this.queueDirection('up');
            break;
          case 'move-down':
            this.queueDirection('down');
            break;
          case 'move-left':
            this.queueDirection('left');
            break;
          case 'move-right':
            this.queueDirection('right');
            break;
          case 'pause':
            this.emitPause();
            break;
        }
      })
    );
  }
  addListener(e, t, s, i) {
    (e.addEventListener(t, s, i), this.listeners.push(() => e.removeEventListener(t, s, i)));
  }
  emitPause() {
    for (const e of Array.from(this.pauseListeners)) e();
  }
  processGamepadButtons(e) {
    [
      { index: 12, direction: 'up' },
      { index: 13, direction: 'down' },
      { index: 14, direction: 'left' },
      { index: 15, direction: 'right' },
    ].forEach(({ index: s, direction: i }) => {
      const o = e.buttons[s];
      if (!o) return;
      const r = `${e.index}:button:${s}`,
        a = this.gamepadButtonStates.get(r) ?? !1;
      (o.pressed && !a && this.queueDirection(i), this.gamepadButtonStates.set(r, o.pressed));
    });
  }
  processGamepadAxes(e) {
    const t = e.axes ?? [];
    if (t.length < 2) {
      this.lastAxisDirection = null;
      return;
    }
    const [s, i] = t,
      o = Math.abs(s),
      r = Math.abs(i);
    let a = null;
    (o > r && o > this.gamepadDeadzone
      ? (a = s > 0 ? 'right' : 'left')
      : r > this.gamepadDeadzone && (a = i > 0 ? 'down' : 'up'),
      a && a !== this.lastAxisDirection && (this.queueDirection(a), (this.lastAxisDirection = a)),
      a || (this.lastAxisDirection = null));
  }
  now() {
    var e;
    return ((e = this.window.performance) == null ? void 0 : e.now()) ?? Date.now();
  }
}
const Ze = ['classic', 'timed', 'endless', 'challenge'],
  E = '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif';
class et {
  constructor(e = {}) {
    c(this, 'overlay');
    c(this, 'state', 'main-menu');
    c(this, 'modes');
    c(this, 'availableModes');
    c(this, 'leaderboard', []);
    c(this, 'lastScore', null);
    c(this, 'replayPreview', null);
    c(this, 'listeners', new Map());
    c(this, 'modeFeedback', null);
    c(this, 'hudState', null);
    c(this, 'hudBar', null);
    c(this, 'hudLevelLabel', null);
    c(this, 'hudScoreLabel', null);
    c(this, 'hudComboLabel', null);
    c(this, 'hudHighScoreLabel', null);
    c(this, 'hudPowerUpsContainer', null);
    ((this.overlay = new ge({ container: e.container })),
      (this.modes = e.modes ?? Ze),
      (this.availableModes = new Set(e.availableModes ?? ['classic'])),
      this.overlay.attach(),
      this.render());
  }
  on(e, t) {
    const i = this.listeners.get(e) ?? new Set();
    return (
      i.add(t),
      this.listeners.set(e, i),
      () => {
        (i.delete(t), i.size === 0 && this.listeners.delete(e));
      }
    );
  }
  setState(e) {
    ((this.state = e), e !== 'mode-select' && (this.modeFeedback = null), this.render());
  }
  getState() {
    return this.state;
  }
  setLeaderboard(e) {
    ((this.leaderboard = e),
      (this.state === 'leaderboard' || this.state === 'game-over') && this.render());
  }
  setLastScore(e) {
    ((this.lastScore = e), this.state === 'game-over' && this.render());
  }
  setReplayPreview(e) {
    ((this.replayPreview = e), this.state === 'replay-view' && this.render());
  }
  setHudState(e) {
    if (((this.hudState = e), e === null)) {
      this.destroyHud();
      return;
    }
    (this.state === 'playing' || this.state === 'paused') &&
      (this.ensureHudBar(), this.updateHudContent());
  }
  dispose() {
    (this.overlay.clear(), this.overlay.detach());
  }
  render() {
    switch (
      (this.overlay.clear(),
      this.resetHudRefs(),
      this.hudState &&
        (this.state === 'playing' || this.state === 'paused') &&
        (this.ensureHudBar(), this.updateHudContent()),
      this.state)
    ) {
      case 'main-menu':
        this.renderMainMenu();
        break;
      case 'mode-select':
        this.renderModeSelect();
        break;
      case 'settings':
        this.renderSettings();
        break;
      case 'paused':
        this.renderPause();
        break;
      case 'game-over':
        this.renderGameOver();
        break;
      case 'leaderboard':
        this.renderLeaderboard();
        break;
      case 'replay-view':
        this.renderReplayView();
        break;
    }
  }
  renderMainMenu() {
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Super Snake' });
    this.stylePanel(e, 320);
    const t = this.createButton('Start', () => this.setState('mode-select'));
    e.appendChild(t);
    const s = this.createButton('Leaderboard', () => this.setState('leaderboard'));
    e.appendChild(s);
    const i = this.createButton('Settings', () => {
      (this.emit('openSettings', void 0), this.setState('settings'));
    });
    e.appendChild(i);
  }
  renderModeSelect() {
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Select Mode' });
    this.stylePanel(e, 360);
    const t = document.createElement('p');
    ((t.textContent = this.modeFeedback ?? 'Classic is ready to play. Other modes are on the way!'),
      (t.style.margin = '0 0 12px 0'),
      (t.style.opacity = '0.85'),
      (t.style.fontSize = '15px'),
      (t.style.color = '#dbe6ff'),
      (t.style.fontFamily = E),
      e.appendChild(t),
      this.modes.forEach((i) => {
        const o = this.availableModes.has(i),
          r = o ? this.formatMode(i) : `${this.formatMode(i)} · Coming Soon`,
          a = this.createButton(r, () => {
            o
              ? this.emit('start', { mode: i })
              : ((this.modeFeedback = `${this.formatMode(i)} mode is coming soon.`), this.render());
          });
        (o ||
          ((a.style.background = 'linear-gradient(135deg, #242d3a, #141922)'),
          (a.style.borderColor = '#55657a'),
          (a.style.opacity = '0.7')),
          e.appendChild(a));
      }));
    const s = this.createButton('Back', () => this.setState('main-menu'));
    e.appendChild(s);
  }
  renderSettings() {
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Settings' });
    this.stylePanel(e, 360);
    const t = document.createElement('p');
    ((t.textContent = 'Remap controls via coming UI or use browser dev tools (future work).'),
      (t.style.margin = '0 0 12px 0'),
      (t.style.fontFamily = E),
      (t.style.fontSize = '15px'),
      (t.style.opacity = '0.85'),
      e.appendChild(t));
    const s = this.createButton('Close', () => {
      (this.emit('closeSettings', void 0), this.setState('main-menu'));
    });
    e.appendChild(s);
  }
  renderPause() {
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Paused' });
    (this.stylePanel(e, 300),
      e.appendChild(this.createButton('Resume', () => this.emit('resume', void 0))),
      e.appendChild(
        this.createButton('Restart', () => {
          this.emit('restart', void 0);
        })
      ),
      e.appendChild(
        this.createButton('Settings', () => {
          (this.emit('openSettings', void 0), this.setState('settings'));
        })
      ),
      e.appendChild(
        this.createButton('Exit to Menu', () => {
          (this.emit('exitToMenu', void 0), this.setState('main-menu'));
        })
      ));
  }
  renderGameOver() {
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Game Over' });
    this.stylePanel(e, 360);
    const t = document.createElement('p'),
      s = this.lastScore
        ? `Mode: ${this.formatMode(this.lastScore.mode)} · Score ${this.lastScore.score} · Combo x${this.lastScore.combo}`
        : 'Score unavailable';
    ((t.textContent = s),
      (t.style.margin = '0 0 12px 0'),
      (t.style.fontFamily = E),
      (t.style.fontSize = '15px'),
      e.appendChild(t));
    const i = document.createElement('label');
    ((i.textContent = 'Enter initials:'),
      (i.style.display = 'block'),
      (i.style.marginBottom = '4px'),
      (i.style.fontFamily = E),
      (i.style.fontSize = '14px'),
      e.appendChild(i));
    const o = document.createElement('input');
    ((o.type = 'text'),
      (o.maxLength = 3),
      (o.value = 'AAA'),
      (o.style.textTransform = 'uppercase'),
      (o.style.marginBottom = '10px'),
      (o.style.fontFamily = E),
      (o.style.fontSize = '16px'),
      o.addEventListener('input', () => {
        o.value = o.value
          .replace(/[^A-Za-z]/g, '')
          .toUpperCase()
          .slice(0, 3);
      }),
      e.appendChild(o));
    const r = this.createButton('Save Score', () => {
      const d = o.value.trim().toUpperCase() || 'AAA';
      this.emit('saveInitials', { initials: d });
    });
    e.appendChild(r);
    const a = this.createButton('View Leaderboard', () => this.setState('leaderboard'));
    e.appendChild(a);
    const l = this.createButton('Play Again', () => this.emit('restart', void 0));
    e.appendChild(l);
  }
  renderLeaderboard() {
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Leaderboard' });
    this.stylePanel(e, 420);
    const t = document.createElement('div');
    if (
      ((t.style.display = 'flex'),
      (t.style.flexDirection = 'column'),
      (t.style.gap = '6px'),
      this.leaderboard.length === 0)
    ) {
      const i = document.createElement('p');
      ((i.textContent = 'No scores yet.'), (i.style.fontFamily = E), t.appendChild(i));
    } else
      this.leaderboard.forEach((i) => {
        const o = document.createElement('div');
        ((o.style.display = 'flex'),
          (o.style.justifyContent = 'space-between'),
          (o.style.alignItems = 'center'),
          (o.style.gap = '8px'),
          (o.style.fontFamily = E));
        const r = document.createElement('span');
        ((r.textContent = `${i.initials} · ${this.formatMode(i.mode)} · ${i.score}`),
          (r.style.fontFamily = E),
          (r.style.fontSize = '14px'),
          o.appendChild(r));
        const a = document.createElement('div');
        if (((a.style.display = 'flex'), (a.style.gap = '4px'), i.replay)) {
          const d = this.createButton('Replay', () => {
            ((this.replayPreview = i),
              this.setState('replay-view'),
              this.emit('viewReplay', { entry: i }));
          });
          a.appendChild(d);
        }
        const l = this.createButton('Delete', () => {
          this.emit('deleteEntry', { entry: i });
        });
        (a.appendChild(l), o.appendChild(a), t.appendChild(o));
      });
    e.appendChild(t);
    const s = this.createButton('Back', () => this.setState('main-menu'));
    e.appendChild(s);
  }
  renderReplayView() {
    var i;
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Replay Details' });
    this.stylePanel(e, 420);
    const t = this.replayPreview;
    if (t) {
      const o = document.createElement('p');
      ((o.textContent = `${t.initials} · ${this.formatMode(t.mode)} · ${t.score}`),
        e.appendChild(o));
      const r = document.createElement('pre');
      ((r.textContent = JSON.stringify((i = t.replay) == null ? void 0 : i.data, null, 2)),
        (r.style.maxHeight = '200px'),
        (r.style.overflow = 'auto'),
        e.appendChild(r));
    } else {
      const o = document.createElement('p');
      ((o.textContent = 'No replay selected.'), e.appendChild(o));
    }
    const s = this.createButton('Back to Leaderboard', () => this.setState('leaderboard'));
    e.appendChild(s);
  }
  ensureHudBar() {
    if (this.hudBar) return;
    const e = this.overlay.addPanel({ anchor: 'top-left' });
    e.dataset.testid = 'super-snake-hud';
    const t = e.style;
    ((t.pointerEvents = 'none'),
      (t.position = 'absolute'),
      (t.top = '24px'),
      (t.left = '50%'),
      (t.transform = 'translateX(-50%)'),
      (t.width = 'min(960px, calc(100% - 48px))'),
      (t.display = 'flex'),
      (t.flexWrap = 'wrap'),
      (t.alignItems = 'center'),
      (t.justifyContent = 'space-between'),
      (t.gap = '18px'),
      (t.padding = '14px 20px'),
      (t.borderRadius = '16px'),
      (t.border = '1px solid rgba(98, 134, 178, 0.45)'),
      (t.background = 'linear-gradient(155deg, rgba(8, 14, 24, 0.92), rgba(6, 10, 18, 0.88))'),
      (t.boxShadow = '0 20px 40px rgba(4, 8, 16, 0.45)'),
      (t.backdropFilter = 'blur(12px)'),
      (e.style.fontFamily = E));
    const s = this.createHudGroup(e, 'Level'),
      i = this.createHudGroup(e, 'Score'),
      o = this.createHudGroup(e, 'Combo'),
      r = this.createHudGroup(e, 'High Score'),
      a = this.createHudGroup(e, 'Power-Ups', !0);
    ((a.style.display = 'flex'),
      (a.style.flexWrap = 'wrap'),
      (a.style.alignItems = 'center'),
      (a.style.gap = '8px'),
      (this.hudBar = e),
      (this.hudLevelLabel = s),
      (this.hudScoreLabel = i),
      (this.hudComboLabel = o),
      (this.hudHighScoreLabel = r),
      (this.hudPowerUpsContainer = a));
  }
  createHudGroup(e, t, s = !1) {
    const i = document.createElement('div');
    ((i.style.display = 'flex'),
      (i.style.flexDirection = 'column'),
      (i.style.gap = '4px'),
      (i.style.minWidth = s ? '220px' : '120px'),
      (i.style.flex = s ? '1 1 260px' : '0 0 auto'));
    const o = document.createElement('div');
    ((o.textContent = t.toUpperCase()),
      (o.style.fontSize = '11px'),
      (o.style.letterSpacing = '0.18em'),
      (o.style.fontWeight = '600'),
      (o.style.opacity = '0.65'));
    const r = document.createElement('div');
    return (
      (r.style.fontSize = '20px'),
      (r.style.fontWeight = '600'),
      (r.style.lineHeight = '1.2'),
      (r.style.color = '#f5fbff'),
      i.appendChild(o),
      i.appendChild(r),
      e.appendChild(i),
      r
    );
  }
  updateHudContent() {
    if (
      !(!this.hudBar || !this.hudState) &&
      (this.hudLevelLabel && (this.hudLevelLabel.textContent = this.hudState.levelName),
      this.hudScoreLabel && (this.hudScoreLabel.textContent = this.hudState.score.toLocaleString()),
      this.hudComboLabel && (this.hudComboLabel.textContent = `x${this.hudState.combo}`),
      this.hudHighScoreLabel &&
        (this.hudHighScoreLabel.textContent = this.hudState.highScore.toLocaleString()),
      this.hudPowerUpsContainer)
    )
      if (((this.hudPowerUpsContainer.innerHTML = ''), this.hudState.activePowerUps.length === 0)) {
        const e = document.createElement('span');
        ((e.textContent = 'None'),
          (e.style.opacity = '0.6'),
          (e.style.fontSize = '14px'),
          this.hudPowerUpsContainer.appendChild(e));
      } else
        this.hudState.activePowerUps.forEach((e) => {
          const t = document.createElement('div');
          ((t.textContent = `${e.icon} ${e.label} · ${this.formatPowerUpCountdown(e.remainingMs)}`),
            (t.style.padding = '6px 10px'),
            (t.style.borderRadius = '999px'),
            (t.style.background = 'rgba(35, 52, 74, 0.65)'),
            (t.style.border = '1px solid rgba(105, 155, 225, 0.35)'),
            (t.style.fontSize = '13px'),
            (t.style.fontWeight = '500'),
            (t.style.letterSpacing = '0.01em'),
            (t.style.color = '#e5f1ff'),
            this.hudPowerUpsContainer.appendChild(t));
        });
  }
  formatPowerUpCountdown(e) {
    const t = Math.max(0, e / 1e3);
    return t >= 10 ? `${Math.floor(t)}s` : `${t.toFixed(1)}s`;
  }
  destroyHud() {
    (this.hudBar && this.hudBar.remove(), this.resetHudRefs());
  }
  resetHudRefs() {
    ((this.hudBar = null),
      (this.hudLevelLabel = null),
      (this.hudScoreLabel = null),
      (this.hudComboLabel = null),
      (this.hudHighScoreLabel = null),
      (this.hudPowerUpsContainer = null));
  }
  createButton(e, t) {
    const s = document.createElement('button');
    s.textContent = e;
    const i = s.style;
    return (
      (i.pointerEvents = 'auto'),
      (i.padding = '12px 14px'),
      (i.marginBottom = '10px'),
      (i.borderRadius = '10px'),
      (i.border = '1px solid #3f4f66'),
      (i.background = 'linear-gradient(135deg, #0f141c, #1b2738)'),
      (i.color = '#f7fbff'),
      (i.cursor = 'pointer'),
      (i.width = '100%'),
      (i.fontSize = '15px'),
      (i.fontWeight = '600'),
      s.addEventListener('click', (o) => {
        (o.preventDefault(), o.stopPropagation(), t());
      }),
      s
    );
  }
  formatMode(e) {
    switch (e) {
      case 'classic':
        return 'Classic';
      case 'timed':
        return 'Timed';
      case 'endless':
        return 'Endless';
      case 'challenge':
        return 'Challenge';
      default:
        return e;
    }
  }
  emit(e, t) {
    const s = this.listeners.get(e);
    if (s) for (const i of Array.from(s)) i(t);
  }
  stylePanel(e, t) {
    ((e.style.minWidth = `${t}px`),
      (e.style.display = 'flex'),
      (e.style.flexDirection = 'column'),
      (e.style.alignItems = 'stretch'),
      (e.style.gap = '10px'),
      (e.style.textAlign = 'center'),
      (e.style.boxShadow = '0 18px 38px rgba(5, 8, 12, 0.45)'),
      (e.style.background =
        'linear-gradient(155deg, rgba(15, 22, 34, 0.95), rgba(7, 10, 16, 0.93))'),
      (e.style.borderColor = '#42536b'),
      (e.style.color = '#eef3ff'),
      (e.style.backdropFilter = 'blur(18px)'),
      (e.style.padding = '18px 22px'),
      (e.style.fontFamily = E));
  }
}
class tt {
  constructor(e = {}) {
    c(this, 'maxEntries');
    c(this, 'key');
    c(this, 'storage');
    ((this.maxEntries = e.maxEntries ?? 10),
      (this.key = e.storageKey ?? 'super-snake-leaderboard'),
      (this.storage = e.storage ?? (typeof localStorage < 'u' ? localStorage : null)));
  }
  load() {
    if (!this.storage) return [];
    const e = this.storage.getItem(this.key);
    if (!e) return [];
    try {
      const t = JSON.parse(e);
      return Array.isArray(t) ? t : [];
    } catch {
      return [];
    }
  }
  save(e) {
    if (!this.storage) return;
    const t = JSON.stringify(e.slice(0, this.maxEntries));
    this.storage.setItem(this.key, t);
  }
  add(e) {
    const s = [...this.load(), e]
      .sort((i, o) => o.score - i.score || o.combo - i.combo || o.occurredAt - i.occurredAt)
      .slice(0, this.maxEntries);
    return (this.save(s), s);
  }
  remove(e) {
    const s = this.load().filter((i) => i.id !== e);
    return (this.save(s), s);
  }
}
class K extends re {
  constructor(t, { context: s, input: i, ui: o, leaderboard: r, ...a }) {
    super('super-snake.scene', t);
    c(this, 'movementSystemId', 'super-snake.systems.snake-movement');
    c(this, 'foodSystemId', 'super-snake.systems.food');
    c(this, 'hazardSystemId', 'super-snake.systems.hazards');
    c(this, 'powerUpSystemId', 'super-snake.systems.power-ups');
    c(this, 'context');
    c(this, 'options');
    c(this, 'input');
    c(this, 'ui');
    c(this, 'leaderboard');
    c(this, 'highScore', 0);
    c(this, 'snakeEntity', null);
    c(this, 'devicePixelRatio', 1);
    c(this, 'phase', 'menu');
    c(this, 'currentMode', 'classic');
    c(this, 'replayEvents', []);
    c(this, 'elapsedMs', 0);
    c(this, 'lastScoreSnapshot', null);
    ((this.context = s),
      (this.options = a),
      (this.devicePixelRatio = globalThis.devicePixelRatio ?? 1),
      (this.input = new Je(i)),
      (this.leaderboard = new tt(r)),
      (this.ui = new et({ container: s.canvas.parentElement ?? void 0, ...o })),
      this.styleCanvas(s.canvas),
      this.ui.setState('main-menu'));
    const l = this.leaderboard.load();
    ((this.highScore = this.computeHighScore(l)),
      this.ui.setLeaderboard(l),
      this.registerUiEvents(),
      this.input.onPause(() => {
        this.phase === 'playing'
          ? (this.setPhase('paused'), this.ui.setState('paused'))
          : this.phase === 'paused' && this.resume();
      }));
  }
  onEnter() {
    (this.world.registerSystem(Ve()),
      this.world.registerSystem(Xe()),
      this.world.registerSystem(Qe()),
      this.world.registerSystem(Ye()),
      this.input.attach(this.context.canvas),
      this.setPhase('menu'),
      this.ui.setState('main-menu'));
  }
  onExit() {
    (this.world.unregisterSystem(this.movementSystemId),
      this.world.unregisterSystem(this.foodSystemId),
      this.world.unregisterSystem(this.hazardSystemId),
      this.world.unregisterSystem(this.powerUpSystemId),
      this.input.detach(),
      this.ui.dispose(),
      this.snakeEntity !== null &&
        this.world.hasEntity(this.snakeEntity) &&
        this.world.destroyEntity(this.snakeEntity),
      (this.snakeEntity = null));
  }
  update(t) {
    if (!(this.phase === 'menu' || this.phase === 'game-over')) {
      if (this.phase === 'paused') {
        this.input.update();
        return;
      }
      if ((this.input.update(), this.snakeEntity !== null)) {
        const s = this.world.getComponent(this.snakeEntity, C);
        if (s) {
          let i = this.input.consumeDirection();
          for (; i; )
            ($e(s, i),
              this.replayEvents.push({ time: this.elapsedMs, direction: i }),
              (i = this.input.consumeDirection()));
        }
      }
      ((this.elapsedMs += t), this.world.step(t), this.syncHudWithState(), this.checkForGameOver());
    }
  }
  render() {
    if (this.snakeEntity === null) return;
    const t = this.world.getComponent(this.snakeEntity, k),
      s = this.world.getComponent(this.snakeEntity, C),
      i = this.world.getComponent(this.snakeEntity, D),
      o = this.world.getComponent(this.snakeEntity, P),
      r = this.world.getComponent(this.snakeEntity, I);
    if (!t || !s || !i) return;
    this.ensureCanvasSize(t.width, t.height, t.cellSize);
    const a = this.context,
      l = a.canvas,
      d = t.width * t.cellSize,
      p = t.height * t.cellSize;
    (a.save(), a.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0));
    const h = r == null ? void 0 : r.theme;
    ((a.fillStyle = (h == null ? void 0 : h.backgroundColor) ?? '#051622'),
      a.fillRect(0, 0, d, p),
      (a.strokeStyle = (h == null ? void 0 : h.gridLineColor) ?? 'rgba(255, 255, 255, 0.05)'),
      (a.lineWidth = 1));
    for (let u = 0; u <= t.width; u += 1)
      (a.beginPath(), a.moveTo(u * t.cellSize, 0), a.lineTo(u * t.cellSize, p), a.stroke());
    for (let u = 0; u <= t.height; u += 1)
      (a.beginPath(), a.moveTo(0, u * t.cellSize), a.lineTo(d, u * t.cellSize), a.stroke());
    if (
      (r &&
        r.obstacles.length > 0 &&
        ((a.fillStyle = (h == null ? void 0 : h.obstacleColor) ?? '#2c3e50'),
        r.obstacles.forEach((u) => {
          const f = u.x * t.cellSize,
            m = u.y * t.cellSize;
          a.fillRect(f, m, t.cellSize, t.cellSize);
        })),
      i.items.forEach((u) => {
        const f = u.tint,
          [m, y, v, g] = f;
        a.fillStyle = `rgba(${Math.round(m * 255)}, ${Math.round(y * 255)}, ${Math.round(v * 255)}, ${g})`;
        const S = 6,
          M = t.cellSize - S * 2,
          x = u.x * t.cellSize + S,
          L = u.y * t.cellSize + S;
        a.fillRect(x, L, M, M);
      }),
      o &&
        o.items.forEach((u) => {
          const [f, m, y, v] = u.tint,
            g = u.x * t.cellSize + t.cellSize / 2,
            S = u.y * t.cellSize + t.cellSize / 2,
            M = t.cellSize * 0.35;
          (a.beginPath(),
            (a.fillStyle = `rgba(${Math.round(f * 255)}, ${Math.round(m * 255)}, ${Math.round(y * 255)}, ${v})`),
            a.arc(g, S, M, 0, Math.PI * 2),
            a.fill(),
            (a.lineWidth = 2),
            (a.strokeStyle = 'rgba(255, 255, 255, 0.25)'),
            a.stroke());
          const x = Math.max(16, Math.floor(t.cellSize * 0.55));
          ((a.font = `${x}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`),
            (a.textAlign = 'center'),
            (a.textBaseline = 'middle'),
            (a.fillStyle = '#ffffff'),
            a.fillText(u.icon, g, S));
        }),
      r && r.hazards.length > 0)
    ) {
      const u = (h == null ? void 0 : h.hazardColor) ?? '#f26c6c',
        f = (h == null ? void 0 : h.hazardIcon) ?? '✴️',
        m = 0.85 + Math.sin(this.elapsedMs / 280) * 0.1,
        y = r.hazardsDisabledUntil > this.elapsedMs;
      r.hazards.forEach((v) => {
        const g = v.position.x * t.cellSize + t.cellSize / 2,
          S = v.position.y * t.cellSize + t.cellSize / 2,
          M = t.cellSize * 0.4 * m;
        (a.beginPath(),
          (a.fillStyle = u),
          (a.globalAlpha = y ? 0.25 : 0.8),
          a.arc(g, S, M, 0, Math.PI * 2),
          a.fill(),
          y &&
            ((a.lineWidth = 2),
            (a.strokeStyle = 'rgba(255, 255, 255, 0.45)'),
            a.setLineDash([4, 4]),
            a.stroke(),
            a.setLineDash([])),
          (a.globalAlpha = 1));
        const x = Math.max(16, Math.floor(t.cellSize * 0.6));
        ((a.font = `${x}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`),
          (a.textAlign = 'center'),
          (a.textBaseline = 'middle'),
          (a.fillStyle = y ? 'rgba(255, 255, 255, 0.6)' : '#ffffff'),
          a.fillText(f, g, S));
      });
    }
    const w = (h == null ? void 0 : h.snakeBodyColor) ?? '#2ecc71',
      b = (h == null ? void 0 : h.snakeHeadColor) ?? '#ffffff';
    (s.segments.forEach((u, f) => {
      const m = f === 0 ? 2 : 4,
        y = t.cellSize - m * 2,
        v = u.x * t.cellSize + m,
        g = u.y * t.cellSize + m;
      ((a.fillStyle = f === 0 ? b : w), a.fillRect(v, g, y, y));
    }),
      s.alive || ((a.fillStyle = 'rgba(255, 64, 64, 0.35)'), a.fillRect(0, 0, d, p)),
      h != null && h.overlayColor && ((a.fillStyle = h.overlayColor), a.fillRect(0, 0, d, p)),
      a.restore(),
      (l.style.width = `${d}px`),
      (l.style.height = `${p}px`));
  }
  ensureCanvasSize(t, s, i) {
    const o = this.context.canvas,
      r = t * i,
      a = s * i,
      l = Math.floor(r * this.devicePixelRatio),
      d = Math.floor(a * this.devicePixelRatio);
    (o.width !== l || o.height !== d) && ((o.width = l), (o.height = d));
  }
  styleCanvas(t) {
    const s = t.style;
    ((s.display = 'block'),
      (s.margin = '0 auto'),
      (s.maxWidth = '100%'),
      (s.height = 'auto'),
      (s.borderRadius = '16px'),
      (s.boxShadow = '0 24px 48px rgba(5, 12, 20, 0.45)'),
      (s.backgroundColor = 'transparent'));
  }
  computeHighScore(t) {
    return t.reduce((s, i) => Math.max(s, i.score), 0);
  }
  buildHudState() {
    if (this.snakeEntity === null) return null;
    const t = this.world.getComponent(this.snakeEntity, A);
    if (!t) return null;
    const s = this.world.getComponent(this.snakeEntity, I),
      i = this.world.getComponent(this.snakeEntity, P),
      o = this.world.getComponent(this.snakeEntity, U),
      r = new Map();
    o == null ||
      o.definitions.forEach((l) => {
        r.set(l.type, { icon: l.icon, label: this.formatPowerUpType(l.type) });
      });
    const a =
      (i == null
        ? void 0
        : i.active
            .filter((l) => l.expiresAt > this.elapsedMs)
            .map((l) => {
              const d = r.get(l.type);
              return {
                id: l.id,
                icon: (d == null ? void 0 : d.icon) ?? '✨',
                label: (d == null ? void 0 : d.label) ?? this.formatPowerUpType(l.type),
                remainingMs: Math.max(0, l.expiresAt - this.elapsedMs),
              };
            })
            .sort((l, d) => l.remainingMs - d.remainingMs)) ?? [];
    return {
      levelName: (s == null ? void 0 : s.levelName) ?? 'Arcade',
      score: t.score,
      combo: t.comboCount,
      highScore: Math.max(this.highScore, t.score),
      activePowerUps: a,
    };
  }
  updateHud() {
    this.ui.setHudState(this.buildHudState());
  }
  formatPowerUpType(t) {
    switch (t) {
      case 'slow-mo':
        return 'Slow-Mo';
      case 'ghost':
        return 'Ghost';
      case 'magnet':
        return 'Magnet';
      case 'double-score':
        return 'Double Score';
      case 'shockwave':
        return 'Shockwave';
      default:
        return t;
    }
  }
  getDebugState() {
    if (this.snakeEntity === null) return null;
    const t = this.world.getComponent(this.snakeEntity, k),
      s = this.world.getComponent(this.snakeEntity, C),
      i = this.world.getComponent(this.snakeEntity, D),
      o = this.world.getComponent(this.snakeEntity, P),
      r = this.world.getComponent(this.snakeEntity, I),
      a = this.world.getComponent(this.snakeEntity, A);
    return !t || !s || !i || !a
      ? null
      : {
          grid: { ...t },
          snake: {
            alive: s.alive,
            direction: s.direction,
            nextDirection: s.nextDirection,
            segments: s.segments.map((l) => ({ ...l })),
          },
          food: { items: i.items.map((l) => ({ id: l.id, type: l.type, x: l.x, y: l.y })) },
          powerUps: o
            ? {
                items: o.items.map((l) => ({
                  id: l.id,
                  type: l.type,
                  icon: l.icon,
                  x: l.x,
                  y: l.y,
                })),
                active: o.active.map((l) => ({ id: l.id, type: l.type, expiresAt: l.expiresAt })),
              }
            : void 0,
          level: r
            ? {
                id: r.levelId,
                name: r.levelName,
                obstacles: r.obstacles.map((l) => ({ x: l.x, y: l.y })),
                hazards: r.hazards.map((l) => ({
                  id: l.id,
                  type: l.definitionId,
                  x: l.position.x,
                  y: l.position.y,
                })),
                theme: { id: r.theme.id },
              }
            : void 0,
          state: { score: a.score, comboCount: a.comboCount, maxCombo: a.maxCombo },
        };
  }
  checkForGameOver() {
    if (this.phase !== 'playing' || this.snakeEntity === null) return;
    const t = this.world.getComponent(this.snakeEntity, C);
    if (t && !t.alive) {
      const s = this.world.getComponent(this.snakeEntity, A);
      if (!s) return;
      const i = { mode: this.currentMode, score: s.score, combo: s.maxCombo };
      ((this.lastScoreSnapshot = i),
        this.ui.setLastScore(i),
        this.setPhase('game-over'),
        this.ui.setState('game-over'));
    }
  }
  syncHudWithState() {
    this.snakeEntity !== null && this.updateHud();
  }
  startGame(t) {
    ((this.currentMode = t),
      this.snakeEntity !== null &&
        this.world.hasEntity(this.snakeEntity) &&
        this.world.destroyEntity(this.snakeEntity),
      (this.snakeEntity = Te(this.world, { ...this.options })),
      (this.replayEvents = []),
      (this.elapsedMs = 0),
      (this.lastScoreSnapshot = null),
      this.ui.setLastScore(null),
      this.ui.setReplayPreview(null),
      this.updateHud(),
      this.setPhase('playing'),
      this.ui.setState('playing'));
  }
  restart() {
    this.startGame(this.currentMode);
  }
  resume() {
    (this.setPhase('playing'), this.ui.setState('playing'));
  }
  exitToMenu() {
    (this.snakeEntity !== null &&
      this.world.hasEntity(this.snakeEntity) &&
      this.world.destroyEntity(this.snakeEntity),
      (this.snakeEntity = null),
      this.setPhase('menu'),
      this.ui.setState('main-menu'));
  }
  saveScore(t) {
    if (!this.lastScoreSnapshot) return;
    const i = {
        id:
          typeof crypto < 'u' && typeof crypto.randomUUID == 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        initials: t,
        score: this.lastScoreSnapshot.score,
        combo: this.lastScoreSnapshot.combo,
        mode: this.lastScoreSnapshot.mode,
        occurredAt: Date.now(),
        replay: {
          description: 'Direction events recorded during run',
          data: {
            mode: this.lastScoreSnapshot.mode,
            events: this.replayEvents,
            durationMs: this.elapsedMs,
          },
        },
      },
      o = this.leaderboard.add(i);
    (this.ui.setLeaderboard(o),
      this.ui.setReplayPreview(i),
      this.ui.setState('leaderboard'),
      (this.highScore = this.computeHighScore(o)),
      this.updateHud());
  }
  deleteEntry(t) {
    const s = this.leaderboard.remove(t.id);
    (this.ui.setLeaderboard(s),
      this.ui.getState() === 'replay-view' && this.ui.setReplayPreview(null),
      (this.highScore = this.computeHighScore(s)),
      this.updateHud());
  }
  registerUiEvents() {
    (this.ui.on('start', ({ mode: t }) => this.startGame(t)),
      this.ui.on('resume', () => this.resume()),
      this.ui.on('restart', () => this.restart()),
      this.ui.on('exitToMenu', () => this.exitToMenu()),
      this.ui.on('openSettings', () => {
        this.phase === 'playing' && this.setPhase('paused');
      }),
      this.ui.on('closeSettings', () => {
        this.phase === 'playing'
          ? this.ui.setState('playing')
          : this.phase === 'menu' && this.ui.setState('main-menu');
      }),
      this.ui.on('saveInitials', ({ initials: t }) => this.saveScore(t)),
      this.ui.on('deleteEntry', ({ entry: t }) => this.deleteEntry(t)),
      this.ui.on('viewReplay', ({ entry: t }) => this.ui.setReplayPreview(t)));
  }
  setPhase(t) {
    ((this.phase = t),
      t === 'playing' || t === 'paused' ? this.updateHud() : this.ui.setHudState(null));
  }
}
async function nt(n = {}) {
  var h, w;
  const e = n.container ?? document.body,
    t =
      n.canvas ?? ((h = n.context) == null ? void 0 : h.canvas) ?? document.createElement('canvas');
  if (n.context && n.context.canvas !== t)
    throw new Error('Provided context must be created from the supplied canvas');
  t.parentElement || e.appendChild(t);
  const s = n.context ?? t.getContext('2d');
  if (!s) throw new Error('Super Snake requires a 2D canvas context');
  const i = new ce(() => new ae());
  await i.push((b) => new K(b, { context: s, ...(n.scene ?? {}) }));
  let o = !0,
    r = 0,
    a = performance.now();
  const l = (b) => {
    if (!o) return;
    const u = b - a;
    ((a = b), i.update(u), i.render(), (r = requestAnimationFrame(l)));
  };
  r = requestAnimationFrame(l);
  async function d() {
    o && ((o = !1), cancelAnimationFrame(r), await i.pop());
  }
  const p = i.current;
  if (p instanceof K) {
    const b = (w = n.scene) == null ? void 0 : w.autoStartMode;
    b && p.startGame(b);
  }
  return { canvas: t, manager: i, stop: d };
}
const Q = document.getElementById('super-snake-root');
if (!Q) throw new Error('Failed to find root element for Super Snake');
nt({ container: Q }).catch((n) => {
  console.error('Failed to boot Super Snake', n);
});
