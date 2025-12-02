(function () {
  const e = document.createElement('link').relList;
  if (e && e.supports && e.supports('modulepreload')) return;
  for (const i of document.querySelectorAll('link[rel="modulepreload"]')) s(i);
  new MutationObserver((i) => {
    for (const a of i)
      if (a.type === 'childList')
        for (const o of a.addedNodes) o.tagName === 'LINK' && o.rel === 'modulepreload' && s(o);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(i) {
    const a = {};
    return (
      i.integrity && (a.integrity = i.integrity),
      i.referrerPolicy && (a.referrerPolicy = i.referrerPolicy),
      i.crossOrigin === 'use-credentials'
        ? (a.credentials = 'include')
        : i.crossOrigin === 'anonymous'
          ? (a.credentials = 'omit')
          : (a.credentials = 'same-origin'),
      a
    );
  }
  function s(i) {
    if (i.ep) return;
    i.ep = !0;
    const a = t(i);
    fetch(i.href, a);
  }
})();
var ve = Object.defineProperty,
  xe = (n, e) => {
    for (var t in e) ve(n, t, { get: e[t], enumerable: !0 });
  };
function be(n, e, t) {
  return !(
    (t.all && !t.all.every((s) => n.getComponent(e, s) !== void 0)) ||
    (t.any && !t.any.some((s) => n.getComponent(e, s) !== void 0)) ||
    (t.none && t.none.some((s) => n.getComponent(e, s) !== void 0))
  );
}
function Se(n, e, t) {
  const s = e.filter((i) => be(n, i, t));
  return {
    size: s.length,
    [Symbol.iterator]() {
      let i = 0;
      return {
        next: () => {
          if (i >= s.length) return { done: !0, value: void 0 };
          const a = s[i++],
            o = { entity: a },
            r = new Set(t.all ?? []);
          return (
            t.any?.forEach((l) => r.add(l)),
            r.forEach((l) => {
              const c = n.getComponent(a, l);
              c !== void 0 && (o[l.name] = c);
            }),
            { done: !1, value: o }
          );
        },
      };
    },
  };
}
var we = ['init', 'preUpdate', 'update', 'postUpdate', 'render', 'cleanup'],
  Ce = class {
    nextEntity = 1;
    entities = new Set();
    stores = new Map();
    systems = [];
    totalTime = 0;
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
      this.stores.get(e.name)?.data.delete(n);
    }
    query(n) {
      return Se(this, Array.from(this.entities), n);
    }
    registerSystem(n) {
      const e = we.indexOf(n.stage);
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
      this.totalTime += n;
      const e = { world: this, delta: n, elapsed: this.totalTime, totalTime: this.totalTime },
        t = ['init', 'preUpdate', 'update', 'postUpdate', 'cleanup'];
      for (const { system: s } of this.systems) t.includes(s.stage) && s.execute(e);
    }
    render(n) {
      const e = {
        world: this,
        delta: 0,
        elapsed: this.totalTime,
        totalTime: this.totalTime,
        alpha: n,
      };
      for (const { system: t } of this.systems) t.stage === 'render' && t.execute(e);
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
      (this.entities.clear(), this.stores.clear(), (this.systems.length = 0), (this.totalTime = 0));
    }
  },
  Me = class {
    constructor(n, e) {
      ((this.id = n), (this.world = e));
    }
    onEnter(n) {}
    onExit() {}
    update(n) {}
    render() {}
  },
  ke = class {
    id = 'noop';
    duration = 0;
    start() {}
    update() {}
    finish() {}
  },
  de = class {
    listeners = new Map();
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
  Ee = class {
    constructor(n) {
      ((this.worldFactory = n), this.registerTransition(new ke()));
    }
    stack = [];
    transitions = new Map();
    activeTransition = null;
    events = new de();
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
      if (this.activeTransition) {
        const e = this.activeTransition;
        e.elapsed += n;
        const t = e.transition.duration ? Math.min(1, e.elapsed / e.transition.duration) : 1;
        (e.transition.update(e.to, t),
          t >= 1 && (e.transition.finish(e.to), (this.activeTransition = null)));
      }
      this.current?.update(n);
    }
    render() {
      this.current?.render();
    }
    beginTransition(n, e, t) {
      const s = this.transitions.get(t);
      if (!s) throw new Error(`Unknown transition: ${t}`);
      (s.start(e), (this.activeTransition = { transition: s, from: n, to: e, elapsed: 0 }));
    }
  },
  Ie = class {
    cache = {};
    load() {
      return { ...this.cache };
    }
    save(n) {
      this.cache = { ...n };
    }
  },
  Le = class {
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
  Pe = class {
    bindings = new Map();
    states = new Map();
    storage;
    events = new de();
    constructor(n = {}) {
      this.storage = n.storage ?? (typeof localStorage < 'u' ? new Le() : new Ie());
      const e = this.storage.load();
      Object.entries(e).forEach(([t, s]) => {
        this.bindings.set(
          t,
          s.map((i) => ({ ...i }))
        );
      });
    }
    getBindings(n) {
      return this.bindings.get(n)?.map((e) => ({ ...e })) ?? [];
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
      for (const [i, a] of this.bindings)
        if (a.some((o) => o.device === n && o.code === e)) {
          const o = this.getOrCreateState(i);
          ((o.pressed = t), (o.value = t ? 1 : 0), (o.updatedAt = s), this.emitState(i, o, t));
        }
    }
    getOrCreateState(n) {
      const e = this.states.get(n);
      if (e) return e;
      const t = { pressed: !1, value: 0, updatedAt: performance.now?.() ?? Date.now() };
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
  De = {};
xe(De, { detectBackendForCanvas: () => ze, isWebGL2Available: () => Ae });
function Ae() {
  if (typeof document > 'u' || typeof window > 'u' || !window.WebGL2RenderingContext) return !1;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return !1;
  }
}
function ze(n) {
  try {
    const t = n.getContext('webgl2'),
      s = window.WebGL2RenderingContext;
    if (t && s && t instanceof s) return 'webgl2';
  } catch {}
  return n.getContext('2d') ? 'canvas2d' : 'none';
}
var Ue = class {
  container;
  root;
  constructor(n) {
    ((this.container = n?.container ?? document.body), (this.root = document.createElement('div')));
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
      n.onClick && e.addEventListener('click', () => n.onClick?.()),
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
      a = e.y ?? 0;
    switch (s) {
      case 'top-left':
        ((t.top = `${a}px`), (t.left = `${i}px`));
        break;
      case 'top-right':
        ((t.top = `${a}px`), (t.right = `${i}px`));
        break;
      case 'bottom-left':
        ((t.bottom = `${a}px`), (t.left = `${i}px`));
        break;
      case 'bottom-right':
        ((t.bottom = `${a}px`), (t.right = `${i}px`));
        break;
      case 'center':
        ((t.top = '50%'),
          (t.left = '50%'),
          (t.transform = `translate(-50%, -50%) translate(${i}px, ${a}px)`));
        break;
    }
  }
};
const A = (n) => `${n.x},${n.y}`;
function U(n) {
  return { x: n.x, y: n.y };
}
function Be(n, e, t, s = new Set()) {
  const i = new Set(),
    a = [U(n)],
    o = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
  for (; a.length > 0; ) {
    const r = a.shift(),
      l = A(r);
    if (i.has(l)) continue;
    if (
      (i.add(l), r.x >= 0 && r.y >= 0 && r.x < t.width && r.y < t.height && !e.has(l) && !s.has(l))
    )
      return r;
    o.forEach((d) => {
      const h = { x: r.x + d.x, y: r.y + d.y },
        y = A(h);
      i.has(y) || a.push(h);
    });
  }
  return null;
}
function $e(n, e) {
  const t = e ?? n.defaultLevelId;
  return n.levels.find((s) => s.id === t) ?? n.levels[0];
}
function Te(n, e, t, s = 0) {
  const i = $e(n, t);
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
    (e.obstacles = i.obstacles.map((a) => U(a))),
    (e.obstacleSet = new Set()),
    e.obstacles.forEach((a) => e.obstacleSet.add(A(a))),
    (e.hazardDefinitions = {}),
    i.hazards.forEach((a) => {
      const o = a.path.length > 0 ? a.path : [{ x: 0, y: 0 }];
      e.hazardDefinitions[a.id] = { ...a, path: o.map((r) => U(r)) };
    }),
    (e.hazards = i.hazards.map((a, o) => He(a, o, s))),
    (e.nextHazardId = e.hazards.length + 1),
    (e.hazardsDisabledUntil = -1 / 0));
}
function He(n, e, t) {
  const s = n.path[0] ?? { x: 0, y: 0 },
    i = U(s),
    a = n.pulseDurationMs ?? 0,
    o = n.idleDurationMs ?? 0,
    r = a > 0 && o > 0;
  return {
    id: e + 1,
    definitionId: n.id,
    position: i,
    pathIndex: 0,
    direction: 1,
    nextMoveAt: t + n.stepIntervalMs,
    active: !0,
    nextPulseToggleAt: r ? t + a : Number.POSITIVE_INFINITY,
  };
}
function X(n) {
  if (!n) return [];
  const e = n.hazards.map((t) => U(t.position));
  return [...n.obstacles.map((t) => U(t)), ...e];
}
function Re(n, e) {
  return n ? n.obstacleSet.has(A(e)) : !1;
}
function Ge(n, e) {
  if (n) return n.hazards.find((t) => t.position.x === e.x && t.position.y === e.y);
}
function Fe(n, e) {
  n.hazards.forEach((t) => {
    const s = n.hazardDefinitions[t.definitionId];
    if (!s) {
      t.nextMoveAt = e + 1e3;
      return;
    }
    const i = s.pulseDurationMs ?? 0,
      a = s.idleDurationMs ?? 0;
    if (i > 0 && a > 0) {
      const c = Math.max(1, i),
        d = Math.max(1, a);
      for (
        ;
        e >= t.nextPulseToggleAt &&
        (t.active
          ? ((t.active = !1), (t.nextPulseToggleAt += d))
          : ((t.active = !0), (t.nextPulseToggleAt += c)),
        !!Number.isFinite(t.nextPulseToggleAt));

      );
    } else ((t.active = !0), (t.nextPulseToggleAt = Number.POSITIVE_INFINITY));
    if (t.nextMoveAt > e) return;
    if (s.path.length === 0) {
      t.nextMoveAt = e + (s.stepIntervalMs || 1e3);
      return;
    }
    if (s.path.length === 1) {
      t.nextMoveAt = e + s.stepIntervalMs;
      return;
    }
    let r = t.pathIndex + t.direction;
    if (s.pingPong !== !1)
      (r >= s.path.length || r < 0) && ((t.direction *= -1), (r = t.pathIndex + t.direction));
    else {
      const c = s.path.length;
      r = ((r % c) + c) % c;
    }
    t.pathIndex = Math.max(0, Math.min(s.path.length - 1, r));
    const l = s.path[t.pathIndex];
    ((t.position = U(l)), (t.nextMoveAt = e + s.stepIntervalMs));
  });
}
function Q(n) {
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
function E(n, e, t) {
  return Math.floor(n() * (t - e + 1)) + e;
}
function Ne(n, e, t, s, i) {
  const a = Math.floor(t / 2),
    o = Math.floor(s / 2);
  return Math.abs(n - a) <= i && Math.abs(e - o) <= i;
}
function Oe(n, e, t) {
  const i = new Set(),
    a = 18,
    o = 2;
  let r = 0;
  for (; r < 3; ) {
    let c = !1;
    for (let d = 0; d < a && !c; d += 1) {
      const h = E(t, 2, 3),
        y = E(t, 2, 3),
        p = E(t, 1, Math.max(1, n - h - 2)),
        v = E(t, 1, Math.max(1, e - y - 2));
      let m = !1;
      for (let g = 0; g < y && !m; g += 1)
        for (let f = 0; f < h && !m; f += 1) {
          const x = p + f,
            u = v + g,
            S = `${x},${u}`;
          (i.has(S) || Ne(x, u, n, e, o)) && (m = !0);
        }
      if (!m) {
        for (let g = 0; g < y; g += 1)
          for (let f = 0; f < h; f += 1) {
            const x = p + f,
              u = v + g;
            i.add(`${x},${u}`);
          }
        ((c = !0), (r += 1));
      }
    }
    if (!c) break;
  }
  return {
    obstacles: Array.from(i).map((c) => {
      const [d, h] = c.split(',').map((y) => Number.parseInt(y, 10));
      return { x: d, y: h };
    }),
    obstacleSet: i,
  };
}
function N(n, e, t, s, i, a, o) {
  for (let l = 0; l < 12; l += 1)
    if (e === 'horizontal') {
      const c = E(a, 2, s - 3),
        d = [];
      for (let h = 1; h < t - 1; h += 1) {
        const y = `${h},${c}`;
        i.has(y) || d.push({ x: h, y: c });
      }
      if (d.length > 1)
        return { id: n, path: d, stepIntervalMs: E(a, 520, 660), pingPong: !0, label: o };
    } else {
      const c = E(a, 2, t - 3),
        d = [];
      for (let h = 1; h < s - 1; h += 1) {
        const y = `${c},${h}`;
        i.has(y) || d.push({ x: c, y: h });
      }
      if (d.length > 1)
        return { id: n, path: d, stepIntervalMs: E(a, 560, 700), pingPong: !0, label: o };
    }
  return null;
}
function We(n, e, t) {
  const s = Q(t),
    { obstacleSet: i } = Oe(n, e, s);
  O(i, n, e);
  const a = A({ x: Math.floor(n / 2), y: Math.floor(e / 2) }),
    o = new Set(i);
  o.add(a);
  const r = [],
    l = N('h-sweeper', 'horizontal', n, e, o, s, 'Glacier Drift');
  l && r.push(l);
  const c = N('v-sweeper', 'vertical', n, e, o, s, 'Aurora Beam');
  return (c && r.push(c), { obstacles: J(i), hazards: r });
}
function F(n, e, t) {
  return Math.min(t, Math.max(e, n));
}
function M(n, e, t, s, i, a) {
  for (let o = 0; o < i; o += 1)
    for (let r = 0; r < s; r += 1) {
      const l = e + r,
        c = t + o;
      l < 0 || c < 0 || l >= a.width || c >= a.height || n.add(`${l},${c}`);
    }
}
function J(n) {
  return Array.from(n).map((e) => {
    const [t, s] = e.split(',').map((i) => Number.parseInt(i, 10));
    return { x: t, y: s };
  });
}
function O(n, e, t) {
  const s = Math.floor(e / 2),
    i = Math.floor(t / 2);
  n.delete(`${s},${i}`);
}
function K(n, e, t, s, i, a, o, r) {
  const l = Be(e, a, o, r);
  return l
    ? (a.add(A(l)),
      {
        id: n,
        path: [U(l)],
        stepIntervalMs: t + s,
        pingPong: !1,
        pulseDurationMs: t,
        idleDurationMs: s,
        label: i,
      })
    : null;
}
function Ke(n, e, t, s) {
  const i = [];
  for (let o = n; o <= t; o += 1) i.push({ x: o, y: e });
  for (let o = e + 1; o <= s; o += 1) i.push({ x: t, y: o });
  for (let o = t - 1; o >= n; o -= 1) i.push({ x: o, y: s });
  for (let o = s - 1; o > e; o -= 1) i.push({ x: n, y: o });
  const a = new Set();
  return i.filter((o) => {
    const r = A(o);
    return a.has(r) ? !1 : (a.add(r), !0);
  });
}
function q(n, e, t, s, i, a, o) {
  const r = F(e.x - t, 1, s.width - 2),
    l = F(e.x + t, 1, s.width - 2),
    c = F(e.y - t, 1, s.height - 2),
    d = F(e.y + t, 1, s.height - 2);
  if (r >= l || c >= d) return null;
  const h = Ke(r, c, l, d).filter((y) => !i.has(A(y)));
  return h.length <= 1
    ? null
    : { id: n, path: h.map((y) => U(y)), stepIntervalMs: a, pingPong: !1, label: o };
}
function qe(n, e) {
  const t = { width: n, height: e },
    s = new Set();
  (M(s, 2, 2, 4, 2, t),
    M(s, n - 8, 3, 4, 2, t),
    M(s, 3, e - 5, 3, 2, t),
    M(s, n - 7, e - 6, 3, 2, t));
  const i = Q(`ember-${n}x${e}`),
    a = 2;
  for (let y = 0; y < a; y += 1) {
    const p = E(i, 2, 3),
      v = E(i, 1, 2),
      m = E(i, 1, n - p - 2),
      g = E(i, 2, e - v - 2);
    M(s, m, g, p, v, t);
  }
  O(s, n, e);
  const o = new Set(s),
    r = { x: Math.floor(n / 2), y: Math.floor(e / 2) },
    l = A(r);
  o.add(l);
  const c = new Set([l]),
    d = [
      K(
        'ember-vent-north',
        { x: Math.floor(n * 0.3), y: Math.floor(e * 0.32) },
        900,
        1100,
        'Lava Vent',
        o,
        t,
        c
      ),
      K(
        'ember-vent-east',
        { x: Math.floor(n * 0.65), y: Math.floor(e * 0.58) },
        1200,
        800,
        'Lava Vent',
        o,
        t,
        c
      ),
      K(
        'ember-vent-south',
        { x: Math.floor(n * 0.45), y: Math.floor(e * 0.78) },
        1e3,
        950,
        'Lava Vent',
        o,
        t,
        c
      ),
    ].filter((y) => y !== null),
    h = N('ember-sandstorm', 'horizontal', n, e, o, i, 'Sandstorm Sweep');
  return (
    h && ((h.stepIntervalMs = Math.max(420, h.stepIntervalMs - 80)), d.push(h)),
    { obstacles: J(s), hazards: d }
  );
}
function _e(n, e) {
  const t = { width: n, height: e },
    s = new Set();
  (M(s, 2, 2, 3, 3, t),
    M(s, n - 5, 2, 3, 3, t),
    M(s, 2, e - 5, 3, 3, t),
    M(s, n - 5, e - 5, 3, 3, t),
    M(s, Math.floor(n / 2) - 5, 4, 5, 1, t),
    M(s, Math.floor(n / 2) + 1, 4, 5, 1, t),
    M(s, Math.floor(n / 2) - 5, e - 5, 5, 1, t),
    M(s, Math.floor(n / 2) + 1, e - 5, 5, 1, t),
    O(s, n, e));
  const i = { x: Math.floor(n / 2), y: Math.floor(e / 2) },
    a = A(i),
    o = new Set(s);
  o.add(a);
  const r = [],
    l = q('neon-drone-west', { x: 4, y: Math.floor(e / 2) }, 3, t, o, 360, 'Courier Drone');
  l && r.push(l);
  const c = q('neon-drone-east', { x: n - 5, y: Math.floor(e / 2) }, 3, t, o, 380, 'Courier Drone');
  c && r.push(c);
  const d = q(
    'neon-plaza-orbit',
    { x: Math.floor(n / 2), y: Math.floor(e / 2) },
    4,
    t,
    o,
    440,
    'Lantern Orbit'
  );
  d && r.push(d);
  const h = Q(`midnight-${n}x${e}`),
    y = N('neon-lane', 'vertical', n, e, o, h, 'Blink Sweep');
  return (
    y && ((y.stepIntervalMs = Math.max(360, y.stepIntervalMs - 60)), r.push(y)),
    O(s, n, e),
    { obstacles: J(s), hazards: r }
  );
}
const Z = 20,
  ee = 16;
function Ve(n) {
  return { ...n };
}
function _(n, e, t, s, i) {
  return {
    id: n,
    name: e,
    theme: Ve(t),
    obstacles: s.map((a) => ({ ...a })),
    hazards: i.map((a) => ({ ...a, path: a.path.map((o) => ({ ...o })) })),
  };
}
const V = {
    id: 'aurora',
    backgroundColor: '#041924',
    gridLineColor: 'rgba(255, 255, 255, 0.06)',
    snakeBodyColor: '#74f7b4',
    snakeHeadColor: '#c6ffe0',
    obstacleColor: '#1b2f3c',
    hazardColor: '#f26c6c',
    hazardIcon: '✴️',
    overlayColor: 'rgba(36, 23, 58, 0.2)',
    cardAccent: '#74f7b4',
    cardBackground: '#0a2331',
  },
  j = {
    id: 'ember-dunes',
    backgroundColor: '#2d0d0d',
    gridLineColor: 'rgba(255, 194, 102, 0.12)',
    snakeBodyColor: '#ffb347',
    snakeHeadColor: '#ffd194',
    obstacleColor: '#5f2c1f',
    hazardColor: '#ff6b35',
    hazardIcon: '🔥',
    overlayColor: 'rgba(191, 64, 64, 0.25)',
    cardAccent: '#ff6b35',
    cardBackground: '#3a1412',
  },
  Y = {
    id: 'midnight-market',
    backgroundColor: '#081129',
    gridLineColor: 'rgba(100, 180, 255, 0.12)',
    snakeBodyColor: '#7df9ff',
    snakeHeadColor: '#f8faff',
    obstacleColor: '#14203b',
    hazardColor: '#ff4ecd',
    hazardIcon: '🛸',
    overlayColor: 'rgba(25, 9, 40, 0.3)',
    cardAccent: '#ff4ecd',
    cardBackground: '#101b38',
  },
  te = We(Z, ee, 'aurora'),
  ne = qe(Z, ee),
  se = _e(Z, ee),
  he = [
    {
      definition: _('aurora-garden', 'Aurora Garden', V, te.obstacles, te.hazards),
      preview: {
        id: 'aurora-garden',
        name: 'Aurora Garden',
        description: 'Glide under shimmering skies with wide turns and gentle pacing.',
        difficulty: 'Chill',
        hazardSummary: 'Slow sweeping beams carve lanes through the snow.',
        cardAccent: V.cardAccent ?? '#74f7b4',
        cardBackground: V.cardBackground ?? '#0a2331',
      },
      progression: {
        entryScore: 0,
        nextScoreThreshold: 350,
        moveIntervalMultiplier: 0.94,
        foodSpawnIntervalMultiplier: 0.95,
        powerUpSpawnIntervalMultiplier: 0.92,
        powerUpInitialDelayMultiplier: 0.9,
      },
    },
    {
      definition: _('ember-dunes', 'Ember Dunes', j, ne.obstacles, ne.hazards),
      preview: {
        id: 'ember-dunes',
        name: 'Ember Dunes',
        description: 'Navigate scorched dunes where vents burst without warning.',
        difficulty: 'Moderate',
        hazardSummary: 'Pulsing lava vents and a sweeping sandstorm demand quick reroutes.',
        cardAccent: j.cardAccent ?? '#ff6b35',
        cardBackground: j.cardBackground ?? '#3a1412',
      },
      progression: {
        entryScore: 350,
        nextScoreThreshold: 850,
        moveIntervalMultiplier: 0.9,
        foodSpawnIntervalMultiplier: 0.9,
        powerUpSpawnIntervalMultiplier: 0.88,
        powerUpInitialDelayMultiplier: 0.85,
      },
    },
    {
      definition: _('midnight-market', 'Midnight Market', Y, se.obstacles, se.hazards),
      preview: {
        id: 'midnight-market',
        name: 'Midnight Market',
        description: 'Dash through neon alleys while delivery drones orbit the plaza.',
        difficulty: 'Intense',
        hazardSummary: 'Orbiting drones and rapid lane sweeps keep the heat on.',
        cardAccent: Y.cardAccent ?? '#ff4ecd',
        cardBackground: Y.cardBackground ?? '#101b38',
      },
      progression: {
        entryScore: 850,
        nextScoreThreshold: null,
        moveIntervalMultiplier: 0.85,
        foodSpawnIntervalMultiplier: 0.85,
        powerUpSpawnIntervalMultiplier: 0.8,
        powerUpInitialDelayMultiplier: 0.8,
      },
    },
  ],
  L = {
    name: 'super-snake.grid',
    defaults: () => ({ width: 20, height: 16, cellSize: 32, mode: 'wrap' }),
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
  R = {
    name: 'super-snake.snakeMovement',
    defaults: () => ({ moveIntervalMs: 140, accumulatorMs: 0 }),
  },
  I = {
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
  G = {
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
  $ = {
    name: 'super-snake.foodState',
    defaults: () => ({ items: [], lastSpawnAt: -1 / 0, nextId: 1 }),
  },
  T = {
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
  z = {
    name: 'super-snake.powerUpState',
    defaults: () => ({ items: [], active: [], lastSpawnAt: -1 / 0, nextId: 1 }),
  },
  ie = {
    name: 'super-snake.levelConfig',
    defaults: () => {
      const n = he;
      return {
        levels: n.map((t) => ({
          id: t.definition.id,
          name: t.definition.name,
          theme: { ...t.definition.theme },
          obstacles: t.definition.obstacles.map((s) => ({ ...s })),
          hazards: t.definition.hazards.map((s) => ({ ...s, path: s.path.map((i) => ({ ...i })) })),
        })),
        defaultLevelId: n[0]?.definition.id ?? 'aurora-garden',
      };
    },
  },
  D = {
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
  je = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
function ue(n) {
  return je[n];
}
function Ye(n, e) {
  return { x: n.x + e.x, y: n.y + e.y };
}
function Xe(n, e) {
  return n.x >= 0 && n.x < e.width && n.y >= 0 && n.y < e.height;
}
function Qe(n, e) {
  let { x: t, y: s } = n;
  return (
    (t = ((t % e.width) + e.width) % e.width),
    (s = ((s % e.height) + e.height) % e.height),
    { x: t, y: s }
  );
}
function Je(n, e, t, s) {
  const i = ue(e),
    a = Ye(n, i);
  return s === 'wrap'
    ? { position: Qe(a, t), collided: !1 }
    : Xe(a, t)
      ? { position: a, collided: !1 }
      : { position: a, collided: !0 };
}
function Ze(n, e, t) {
  ((n.segments = e.map(({ x: s, y: i }) => ({ x: s, y: i }))),
    (n.direction = t),
    (n.nextDirection = t),
    (n.pendingGrowth = Math.max(0, n.pendingGrowth)),
    (n.alive = !0));
}
function H(n) {
  if (n.segments.length === 0) throw new Error('Snake has no segments');
  return n.segments[0];
}
function et(n, e) {
  const t = n.pendingGrowth === 0 ? n.segments.length - 1 : n.segments.length;
  return n.segments.slice(0, t).some((s) => s.x === e.x && s.y === e.y);
}
function tt(n, e) {
  const t = { x: e.x, y: e.y };
  n.segments.unshift(t);
  let s = null,
    i = !1;
  return (
    n.pendingGrowth > 0 ? ((n.pendingGrowth -= 1), (i = !0)) : (s = n.segments.pop() ?? null),
    { tail: s, grew: i }
  );
}
function nt(n, e) {
  const t = { up: 'down', down: 'up', left: 'right', right: 'left' };
  (n.segments.length <= 1 || e !== t[n.direction]) && (n.nextDirection = e);
}
function st(n) {
  return ((n.direction = n.nextDirection), n.direction);
}
function pe(n, e) {
  const t = n.definitions,
    s = t.reduce((o, r) => o + r.weight, 0);
  if (s <= 0) throw new Error('Food definitions must have positive cumulative weight');
  const i = e() * s;
  let a = 0;
  for (const o of t) if (((a += o.weight), i <= a)) return o;
  return t[t.length - 1];
}
function fe(n, e, t, s = []) {
  const i = new Set();
  (e.segments.forEach((o) => {
    i.add(`${o.x},${o.y}`);
  }),
    t.items.forEach((o) => {
      i.add(`${o.x},${o.y}`);
    }));
  for (const o of s) i.add(`${o.x},${o.y}`);
  const a = [];
  for (let o = 0; o < n.height; o += 1)
    for (let r = 0; r < n.width; r += 1) {
      const l = `${r},${o}`;
      i.has(l) || a.push({ x: r, y: o });
    }
  return a;
}
function me(n, e, t, s) {
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
function it(n, e = {}) {
  const t = {
      ...L.defaults(),
      width: e.gridWidth ?? 20,
      height: e.gridHeight ?? 16,
      cellSize: e.cellSize ?? 32,
      mode: e.mode ?? 'wrap',
    },
    s = n.createEntity();
  n.addComponent(s, L, t);
  const i = {
      ...C.defaults(),
      segments: [],
      direction: e.direction ?? 'right',
      nextDirection: e.direction ?? 'right',
      pendingGrowth: 0,
      alive: !0,
    },
    a = e.spawn ?? { x: Math.floor(t.width / 2), y: Math.floor(t.height / 2) },
    o = i.direction,
    r = ue(o),
    l = Math.max(1, e.initialLength ?? 3),
    c = [];
  for (let b = 0; b < l; b += 1) c.push({ x: a.x - r.x * b, y: a.y - r.y * b });
  (Ze(i, c, o), n.addComponent(s, C, i));
  const d = R.defaults(),
    h = {
      ...d,
      moveIntervalMs: Math.max(16, e.moveIntervalMs ?? d.moveIntervalMs),
      accumulatorMs: 0,
    };
  n.addComponent(s, R, h);
  const y = I.defaults();
  ((y.mode = t.mode), n.addComponent(s, I, y));
  const p = ie.defaults(),
    v = {
      levels:
        e.levelDefinitions ??
        p.levels.map((b) => ({
          ...b,
          theme: { ...b.theme },
          obstacles: b.obstacles.map((B) => ({ ...B })),
          hazards: b.hazards.map((B) => ({ ...B, path: B.path.map((P) => ({ ...P })) })),
        })),
      defaultLevelId: e.levelId ?? p.defaultLevelId,
    };
  n.addComponent(s, ie, v);
  const m = D.defaults();
  (Te(v, m, e.levelId, 0), n.addComponent(s, D, m));
  const g = G.defaults(),
    f = {
      ...g,
      definitions: e.foodDefinitions ?? g.definitions.map((b) => ({ ...b })),
      maxActive: e.foodMaxActive ?? g.maxActive,
      spawnIntervalMs: e.foodSpawnIntervalMs ?? g.spawnIntervalMs,
      comboWindowMs: e.comboWindowMs ?? g.comboWindowMs,
      random: e.random ?? g.random,
    };
  n.addComponent(s, G, f);
  const x = $.defaults();
  (n.addComponent(s, $, x), ot(f, x, t, i, m));
  const u = T.defaults(),
    S = {
      ...u,
      definitions: e.powerUpDefinitions ?? u.definitions.map((b) => ({ ...b })),
      maxActive: e.powerUpMaxActive ?? u.maxActive,
      spawnIntervalMs: e.powerUpSpawnIntervalMs ?? u.spawnIntervalMs,
      initialDelayMs: e.powerUpInitialDelayMs ?? u.initialDelayMs,
      random: e.random ?? u.random,
    };
  n.addComponent(s, T, S);
  const w = z.defaults();
  return (n.addComponent(s, z, w), s);
}
function ot(n, e, t, s, i) {
  const a = n.random ?? Math.random,
    o = Math.min(n.maxActive, t.width * t.height - s.segments.length);
  for (let r = e.items.length; r < o; r += 1) {
    const l = X(i),
      c = fe(t, s, e, l);
    if (c.length === 0) break;
    const d = c[Math.floor(a() * c.length)],
      h = pe(n, a),
      y = me(e, h, d, 0);
    (e.items.push(y), (e.lastSpawnAt = 0));
  }
}
function at(n, e) {
  const t = n.definitions.reduce((i, a) => i + a.weight, 0);
  if (t <= 0) throw new Error('Power-up definitions must have positive cumulative weight');
  let s = e() * t;
  for (const i of n.definitions) if (((s -= i.weight), s <= 0)) return i;
  return n.definitions[n.definitions.length - 1];
}
function rt(n, e, t, s) {
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
function lt(n, e, t, s, i) {
  const a = new Set();
  (e.segments.forEach((r) => {
    a.add(`${r.x},${r.y}`);
  }),
    t?.items.forEach((r) => {
      a.add(`${r.x},${r.y}`);
    }),
    s.items.forEach((r) => {
      a.add(`${r.x},${r.y}`);
    }),
    i && X(i).forEach((l) => a.add(`${l.x},${l.y}`)));
  const o = [];
  for (let r = 0; r < n.height; r += 1)
    for (let l = 0; l < n.width; l += 1) {
      const c = `${l},${r}`;
      a.has(c) || o.push({ x: l, y: r });
    }
  return o;
}
function ct(n, e) {
  n.active.length !== 0 && (n.active = n.active.filter((t) => t.expiresAt > e));
}
function W(n, e, t) {
  if (n) return n.active.find((s) => s.type === e && s.expiresAt > t);
}
function dt(n, e) {
  const s = W(n, 'slow-mo', e)?.effect.speedMultiplier;
  return s && s > 0 ? s : 1;
}
function ht(n, e) {
  return !!W(n, 'ghost', e)?.effect.ghostPhase;
}
function ut(n, e) {
  const s = W(n, 'double-score', e)?.effect.scoreMultiplier;
  return s && s > 0 ? s : 1;
}
function oe(n, e) {
  const s = W(n, 'magnet', e)?.effect.magnetRange;
  return s && s > 0 ? s : null;
}
function pt(n, e) {
  return {
    speedMultiplier: e.speedMultiplier ?? n.speedMultiplier,
    ghostPhase: e.ghostPhase ?? n.ghostPhase,
    scoreMultiplier: e.scoreMultiplier ?? n.scoreMultiplier,
    magnetRange: e.magnetRange ?? n.magnetRange,
    hazardDisableMs: e.hazardDisableMs ?? n.hazardDisableMs,
  };
}
function ft() {
  return {
    id: 'super-snake.systems.snake-movement',
    stage: 'update',
    order: 0,
    execute: ({ world: n, delta: e, elapsed: t }) => {
      const s = n.query({ all: [L, C, R, I] });
      if (s.size !== 0)
        for (const i of s) {
          const a = i.entity,
            o = n.getComponent(a, L),
            r = n.getComponent(a, C),
            l = n.getComponent(a, R),
            c = n.getComponent(a, I),
            d = n.getComponent(a, z),
            h = n.getComponent(a, D);
          if (!o || !r || !l || !c || !r.alive || r.segments.length === 0) continue;
          ((c.mode = o.mode), (l.accumulatorMs += e));
          const y = dt(d, t),
            p = Math.max(1, l.moveIntervalMs * y),
            v = ht(d, t);
          for (; l.accumulatorMs >= p; ) {
            l.accumulatorMs -= p;
            const m = st(r),
              g = H(r),
              { position: f, collided: x } = Je(g, m, o, c.mode),
              u = v ? !1 : et(r, f),
              S = h ? h.hazardsDisabledUntil > t : !1,
              w = h ? Re(h, f) : !1,
              b = h && !S ? Ge(h, f) !== void 0 : !1;
            if (x || u || w || b) {
              ((r.alive = !1), (l.accumulatorMs = 0));
              break;
            }
            (tt(r, f), (c.ticks += 1), (c.lastMoveAt = t));
          }
        }
    },
  };
}
function mt() {
  return {
    id: 'super-snake.systems.hazards',
    stage: 'update',
    order: 1,
    execute: ({ world: n, elapsed: e }) => {
      const t = n.query({ all: [L, C, D] });
      if (t.size !== 0)
        for (const s of t) {
          const i = s.entity,
            a = n.getComponent(i, C),
            o = n.getComponent(i, D);
          if (!a || !o || !a.alive || a.segments.length === 0) continue;
          const r = o.hazardsDisabledUntil > e;
          (r || Fe(o, e),
            r ||
              (o.hazards.some((c) =>
                a.segments.some(
                  (d) => c.active !== !1 && d.x === c.position.x && d.y === c.position.y
                )
              ) &&
                (a.alive = !1)));
        }
    },
  };
}
function gt() {
  return {
    id: 'super-snake.systems.food',
    stage: 'update',
    order: 3,
    execute: ({ world: n, elapsed: e }) => {
      const t = n.query({ all: [L, C, I, G, $] });
      if (t.size !== 0)
        for (const s of t) {
          const i = s.entity,
            a = n.getComponent(i, L),
            o = n.getComponent(i, C),
            r = n.getComponent(i, I),
            l = n.getComponent(i, G),
            c = n.getComponent(i, $),
            d = n.getComponent(i, z),
            h = n.getComponent(i, D);
          if (!a || !o || !r || !l || !c) continue;
          const y = l.random ?? Math.random,
            p = X(h);
          if (o.alive && o.segments.length > 0) {
            const v = oe(d, e);
            if (v !== null && v > 0 && c.items.length > 0) {
              const f = H(o),
                x = new Set();
              (o.segments.forEach((u) => x.add(`${u.x},${u.y}`)),
                p.forEach((u) => x.add(`${u.x},${u.y}`)),
                c.items.forEach((u) => x.add(`${u.x},${u.y}`)),
                c.items.forEach((u) => {
                  const S = `${u.x},${u.y}`;
                  x.delete(S);
                  const w = Math.sign(f.x - u.x),
                    b = Math.sign(f.y - u.y),
                    B = Math.abs(f.x - u.x) + Math.abs(f.y - u.y);
                  if (B > 0 && B <= v) {
                    const P = { x: u.x + w, y: u.y + b },
                      ye = `${P.x},${P.y}`;
                    P.x >= 0 &&
                      P.y >= 0 &&
                      P.x < a.width &&
                      P.y < a.height &&
                      !x.has(ye) &&
                      ((u.x = P.x), (u.y = P.y));
                  }
                  x.add(`${u.x},${u.y}`);
                }));
            }
            const m = H(o),
              g = c.items.findIndex((f) => f.x === m.x && f.y === m.y);
            if (g >= 0) {
              const f = c.items.splice(g, 1)[0];
              o.pendingGrowth += f.growth;
              const S =
                (e - r.lastConsumedAt <= l.comboWindowMs ? r.comboCount + 1 : 1) + f.comboBonus;
              ((r.comboCount = S),
                (r.maxCombo = Math.max(r.maxCombo, r.comboCount)),
                (r.lastConsumedAt = e));
              const w = Math.max(1, r.comboCount),
                b = d ? ut(d, e) : 1;
              ((r.score += f.score * w * b), (c.lastSpawnAt = e - l.spawnIntervalMs));
            }
          }
          for (; c.items.length < l.maxActive && e - c.lastSpawnAt >= l.spawnIntervalMs; ) {
            const v = fe(a, o, c, p);
            if (v.length === 0) break;
            let m = v;
            if (d && o.segments.length > 0) {
              const u = oe(d, e);
              if (u !== null) {
                const S = H(o),
                  w = v.filter((b) => Math.abs(b.x - S.x) + Math.abs(b.y - S.y) <= u);
                w.length > 0 && (m = w);
              }
            }
            const g = m[Math.floor(y() * m.length)],
              f = pe(l, y),
              x = me(c, f, g, e);
            (c.items.push(x), (c.lastSpawnAt = e));
          }
        }
    },
  };
}
function yt() {
  return {
    id: 'super-snake.systems.power-ups',
    stage: 'update',
    order: 2,
    execute: ({ world: n, elapsed: e }) => {
      const t = n.query({ all: [L, C, T, z] });
      if (t.size !== 0)
        for (const s of t) {
          const i = s.entity,
            a = n.getComponent(i, L),
            o = n.getComponent(i, C),
            r = n.getComponent(i, T),
            l = n.getComponent(i, z),
            c = n.getComponent(i, $),
            d = n.getComponent(i, D);
          if (!a || !o || !r || !l) continue;
          if ((ct(l, e), o.alive && o.segments.length > 0 && l.items.length > 0)) {
            const p = H(o),
              v = l.items.findIndex((m) => m.x === p.x && m.y === p.y);
            if (v >= 0) {
              const m = l.items.splice(v, 1)[0],
                g = r.definitions.find((f) => f.id === m.definitionId);
              if (g) {
                const f = e + g.durationMs,
                  x = l.active.findIndex((u) => u.type === m.type);
                if (x >= 0) {
                  const u = l.active[x];
                  ((u.expiresAt = Math.max(u.expiresAt, f)), (u.effect = pt(u.effect, g.effect)));
                } else
                  l.active.push({ id: m.id, type: m.type, expiresAt: f, effect: { ...g.effect } });
                g.effect.hazardDisableMs &&
                  d &&
                  (d.hazardsDisabledUntil = Math.max(
                    d.hazardsDisabledUntil,
                    e + g.effect.hazardDisableMs
                  ));
              }
            }
          }
          const h = r.random ?? Math.random;
          if (
            r.definitions.length > 0 &&
            l.items.length < r.maxActive &&
            e >= r.initialDelayMs &&
            e - l.lastSpawnAt >= r.spawnIntervalMs &&
            o.segments.length > 0
          ) {
            const p = lt(a, o, c, l, d);
            if (p.length > 0) {
              const v = p[Math.floor(h() * p.length)],
                m = at(r, h),
                g = rt(l, m, v, e);
              (l.items.push(g), (l.lastSpawnAt = e));
            } else l.lastSpawnAt = e;
          }
        }
    },
  };
}
const ae = {
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
  re = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
class vt {
  manager;
  window;
  navigator;
  gamepadDeadzone;
  enableKeyboard;
  enableTouch;
  enableGamepad;
  directionQueue = [];
  gamepadButtonStates = new Map();
  lastAxisDirection = null;
  pointerSnapshot = null;
  pointerThreshold = 24;
  attached = !1;
  listeners = [];
  unsubscribes = [];
  pauseListeners = new Set();
  constructor(e = {}) {
    ((this.window = e.window ?? window),
      (this.navigator = e.navigator ?? (typeof navigator < 'u' ? navigator : void 0)),
      (this.gamepadDeadzone = e.gamepadDeadzone ?? 0.35),
      (this.enableKeyboard = e.enableKeyboard ?? !0),
      (this.enableTouch = e.enableTouch ?? !0),
      (this.enableGamepad = e.enableGamepad ?? !0));
    const t = e.storage ? { storage: e.storage } : {};
    ((this.manager = new Pe(t)), this.ensureDefaultBindings(), this.subscribeActions());
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
      for (this.attached = !1; this.listeners.length > 0; ) this.listeners.pop()?.();
      for (; this.unsubscribes.length > 0; ) this.unsubscribes.pop()?.();
      (this.gamepadButtonStates.clear(),
        (this.lastAxisDirection = null),
        (this.pointerSnapshot = null),
        (this.directionQueue.length = 0),
        this.pauseListeners.clear());
    }
  }
  update() {
    if (!this.enableGamepad || !this.navigator?.getGamepads) return;
    const e = this.navigator.getGamepads?.();
    if (e) for (const t of e) t && (this.processGamepadButtons(t), this.processGamepadAxes(t));
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
    Object.keys(ae).forEach((e) => {
      this.manager.getBindings(e).length === 0 && this.manager.rebind(e, ae[e]);
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
  onKeyDown = (e) => {
    this.enableKeyboard &&
      (e.repeat ||
        (re.has(e.code) && e.preventDefault(), this.manager.handleKey(e.code, !0, this.now())));
  };
  onKeyUp = (e) => {
    this.enableKeyboard &&
      (re.has(e.code) && e.preventDefault(), this.manager.handleKey(e.code, !1, this.now()));
  };
  onBlur = () => {
    ['move-up', 'move-down', 'move-left', 'move-right'].forEach((t) => {
      this.manager.handleAction(t, !1, 0, this.now());
    });
  };
  onPointerDown = (e) => {
    this.enableTouch &&
      ((e.pointerType !== 'touch' && e.pointerType !== 'pen') ||
        ((this.pointerSnapshot = {
          id: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startTime: this.now(),
        }),
        e.preventDefault()));
  };
  onPointerUp = (e) => {
    if (!this.enableTouch || !this.pointerSnapshot || e.pointerId !== this.pointerSnapshot.id)
      return;
    const t = e.clientX - this.pointerSnapshot.startX,
      s = e.clientY - this.pointerSnapshot.startY,
      i = Math.abs(t),
      a = Math.abs(s);
    if (i < this.pointerThreshold && a < this.pointerThreshold) {
      this.pointerSnapshot = null;
      return;
    }
    (i > a
      ? this.queueDirection(t > 0 ? 'right' : 'left')
      : this.queueDirection(s > 0 ? 'down' : 'up'),
      (this.pointerSnapshot = null),
      e.preventDefault());
  };
  onPointerCancel = () => {
    this.enableTouch && (this.pointerSnapshot = null);
  };
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
      const a = e.buttons[s];
      if (!a) return;
      const o = `${e.index}:button:${s}`,
        r = this.gamepadButtonStates.get(o) ?? !1;
      (a.pressed && !r && this.queueDirection(i), this.gamepadButtonStates.set(o, a.pressed));
    });
  }
  processGamepadAxes(e) {
    const t = e.axes ?? [];
    if (t.length < 2) {
      this.lastAxisDirection = null;
      return;
    }
    const [s, i] = t,
      a = Math.abs(s),
      o = Math.abs(i);
    let r = null;
    (a > o && a > this.gamepadDeadzone
      ? (r = s > 0 ? 'right' : 'left')
      : o > this.gamepadDeadzone && (r = i > 0 ? 'down' : 'up'),
      r && r !== this.lastAxisDirection && (this.queueDirection(r), (this.lastAxisDirection = r)),
      r || (this.lastAxisDirection = null));
  }
  now() {
    return this.window.performance?.now() ?? Date.now();
  }
}
const xt = ['classic', 'timed', 'endless', 'challenge'],
  k = '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif';
class bt {
  overlay;
  state = 'main-menu';
  modes;
  availableModes;
  leaderboard = [];
  lastScore = null;
  replayPreview = null;
  levelUpContext = null;
  listeners = new Map();
  hudState = null;
  hudBar = null;
  hudLevelLabel = null;
  hudScoreLabel = null;
  hudComboLabel = null;
  hudHighScoreLabel = null;
  hudPowerUpsContainer = null;
  constructor(e = {}) {
    ((this.overlay = new Ue({ container: e.container })),
      (this.modes = e.modes ?? xt),
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
    ((this.state = e), this.render());
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
  setLevelUpContext(e) {
    ((this.levelUpContext = e), this.state === 'level-up' && this.render());
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
      case 'level-up':
        this.renderLevelUp();
        break;
    }
  }
  renderMainMenu() {
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Super Snake' });
    (this.stylePanel(e, 320),
      this.modes.forEach((i) => {
        const a = this.availableModes.has(i),
          o = a ? this.formatMode(i) : `${this.formatMode(i)} · Coming Soon`,
          r = this.createButton(o, () => {
            a && this.emit('start', { mode: i });
          });
        (a ||
          ((r.style.background = 'linear-gradient(135deg, #242d3a, #141922)'),
          (r.style.borderColor = '#55657a'),
          (r.style.opacity = '0.7')),
          e.appendChild(r));
      }));
    const t = this.createButton('Leaderboard', () => this.setState('leaderboard'));
    e.appendChild(t);
    const s = this.createButton('Settings', () => {
      (this.emit('openSettings', void 0), this.setState('settings'));
    });
    e.appendChild(s);
  }
  renderSettings() {
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Settings' });
    this.stylePanel(e, 360);
    const t = document.createElement('p');
    ((t.textContent = 'Remap controls via coming UI or use browser dev tools (future work).'),
      (t.style.margin = '0 0 12px 0'),
      (t.style.fontFamily = k),
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
        this.createButton('Mode & Level Select', () => {
          this.emit('openModeSelect', void 0);
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
      (t.style.fontFamily = k),
      (t.style.fontSize = '15px'),
      e.appendChild(t));
    const i = document.createElement('label');
    ((i.textContent = 'Enter initials:'),
      (i.style.display = 'block'),
      (i.style.marginBottom = '4px'),
      (i.style.fontFamily = k),
      (i.style.fontSize = '14px'),
      e.appendChild(i));
    const a = document.createElement('input');
    ((a.type = 'text'),
      (a.maxLength = 3),
      (a.value = 'AAA'),
      (a.style.textTransform = 'uppercase'),
      (a.style.marginBottom = '10px'),
      (a.style.fontFamily = k),
      (a.style.fontSize = '16px'),
      a.addEventListener('input', () => {
        a.value = a.value
          .replace(/[^A-Za-z]/g, '')
          .toUpperCase()
          .slice(0, 3);
      }),
      e.appendChild(a));
    const o = this.createButton('Save Score', () => {
      const d = a.value.trim().toUpperCase() || 'AAA';
      this.emit('saveInitials', { initials: d });
    });
    e.appendChild(o);
    const r = this.createButton('Mode & Level Select', () => {
      this.emit('openModeSelect', void 0);
    });
    e.appendChild(r);
    const l = this.createButton('View Leaderboard', () => this.setState('leaderboard'));
    e.appendChild(l);
    const c = this.createButton('Play Again', () => this.emit('restart', void 0));
    e.appendChild(c);
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
      ((i.textContent = 'No scores yet.'), (i.style.fontFamily = k), t.appendChild(i));
    } else
      this.leaderboard.forEach((i) => {
        const a = document.createElement('div');
        ((a.style.display = 'flex'),
          (a.style.justifyContent = 'space-between'),
          (a.style.alignItems = 'center'),
          (a.style.gap = '8px'),
          (a.style.fontFamily = k));
        const o = document.createElement('span');
        ((o.textContent = `${i.initials} · ${this.formatMode(i.mode)} · ${i.score}`),
          (o.style.fontFamily = k),
          (o.style.fontSize = '14px'),
          a.appendChild(o));
        const r = document.createElement('div');
        if (((r.style.display = 'flex'), (r.style.gap = '4px'), i.replay)) {
          const c = this.createButton('Replay', () => {
            ((this.replayPreview = i),
              this.setState('replay-view'),
              this.emit('viewReplay', { entry: i }));
          });
          r.appendChild(c);
        }
        const l = this.createButton('Delete', () => {
          this.emit('deleteEntry', { entry: i });
        });
        (r.appendChild(l), a.appendChild(r), t.appendChild(a));
      });
    e.appendChild(t);
    const s = this.createButton('Back', () => this.setState('main-menu'));
    e.appendChild(s);
  }
  renderReplayView() {
    const e = this.overlay.addPanel({ anchor: 'center', title: 'Replay Details' });
    this.stylePanel(e, 420);
    const t = this.replayPreview;
    if (t) {
      const i = document.createElement('p');
      ((i.textContent = `${t.initials} · ${this.formatMode(t.mode)} · ${t.score}`),
        e.appendChild(i));
      const a = document.createElement('pre');
      ((a.textContent = JSON.stringify(t.replay?.data, null, 2)),
        (a.style.maxHeight = '200px'),
        (a.style.overflow = 'auto'),
        e.appendChild(a));
    } else {
      const i = document.createElement('p');
      ((i.textContent = 'No replay selected.'), e.appendChild(i));
    }
    const s = this.createButton('Back to Leaderboard', () => this.setState('leaderboard'));
    e.appendChild(s);
  }
  renderLevelUp() {
    const e = this.levelUpContext,
      t = e ? `Level Up — ${e.nextLevel.name}` : 'Level Up',
      s = this.overlay.addPanel({ anchor: 'center', title: t });
    this.stylePanel(s, 420);
    const i = document.createElement('p');
    ((i.textContent = e ? `Cleared ${e.currentLevel.name}!` : 'Level complete!'),
      (i.style.fontFamily = k),
      (i.style.fontSize = '16px'),
      (i.style.margin = '0 0 8px 0'),
      s.appendChild(i));
    const a = document.createElement('p');
    if (
      ((a.textContent = e
        ? `Score ${e.score.toLocaleString()} · Combo x${e.combo}`
        : 'Keep the streak going!'),
      (a.style.fontFamily = k),
      (a.style.fontSize = '14px'),
      (a.style.opacity = '0.85'),
      (a.style.margin = '0 0 12px 0'),
      s.appendChild(a),
      e)
    ) {
      const r = document.createElement('p');
      ((r.textContent = `${e.nextLevel.name}: ${e.nextLevel.description}`),
        (r.style.fontFamily = k),
        (r.style.fontSize = '14px'),
        (r.style.opacity = '0.8'),
        (r.style.margin = '0 0 16px 0'),
        s.appendChild(r));
    }
    const o = e ? `Continue to ${e.nextLevel.name}` : 'Continue';
    (s.appendChild(
      this.createButton(o, () => {
        this.emit('confirmLevelUp', void 0);
      })
    ),
      s.appendChild(
        this.createButton('Mode & Level Select', () => {
          this.emit('openModeSelect', void 0);
        })
      ));
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
      (e.style.fontFamily = k));
    const s = this.createHudGroup(e, 'Level'),
      i = this.createHudGroup(e, 'Score'),
      a = this.createHudGroup(e, 'Combo'),
      o = this.createHudGroup(e, 'High Score'),
      r = this.createHudGroup(e, 'Power-Ups', !0);
    ((r.style.display = 'flex'),
      (r.style.flexWrap = 'wrap'),
      (r.style.alignItems = 'center'),
      (r.style.gap = '8px'),
      (r.style.minHeight = '32px'),
      (r.style.justifyContent = 'flex-start'),
      (this.hudBar = e),
      (this.hudLevelLabel = s),
      (this.hudScoreLabel = i),
      (this.hudComboLabel = a),
      (this.hudHighScoreLabel = o),
      (this.hudPowerUpsContainer = r));
  }
  createHudGroup(e, t, s = !1) {
    const i = document.createElement('div');
    ((i.style.display = 'flex'),
      (i.style.flexDirection = 'column'),
      (i.style.gap = '4px'),
      (i.style.minWidth = s ? '220px' : '120px'),
      (i.style.flex = s ? '1 1 260px' : '0 0 auto'));
    const a = document.createElement('div');
    ((a.textContent = t.toUpperCase()),
      (a.style.fontSize = '11px'),
      (a.style.letterSpacing = '0.18em'),
      (a.style.fontWeight = '600'),
      (a.style.opacity = '0.65'));
    const o = document.createElement('div');
    return (
      (o.style.fontSize = '20px'),
      (o.style.fontWeight = '600'),
      (o.style.lineHeight = '1.2'),
      (o.style.color = '#f5fbff'),
      i.appendChild(a),
      i.appendChild(o),
      e.appendChild(i),
      o
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
          (e.style.minWidth = '120px'),
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
            (t.style.whiteSpace = 'nowrap'),
            (t.style.minWidth = '140px'),
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
      s.addEventListener('click', (a) => {
        (a.preventDefault(), a.stopPropagation(), t());
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
      (e.style.fontFamily = k));
  }
}
class St {
  maxEntries;
  key;
  storage;
  constructor(e = {}) {
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
      .sort((i, a) => a.score - i.score || a.combo - i.combo || a.occurredAt - i.occurredAt)
      .slice(0, this.maxEntries);
    return (this.save(s), s);
  }
  remove(e) {
    const s = this.load().filter((i) => i.id !== e);
    return (this.save(s), s);
  }
}
function le(n) {
  return {
    id: n.id,
    name: n.name,
    theme: { ...n.theme },
    obstacles: n.obstacles.map((e) => ({ ...e })),
    hazards: n.hazards.map((e) => ({ ...e, path: e.path.map((t) => ({ ...t })) })),
  };
}
class ce extends Me {
  movementSystemId = 'super-snake.systems.snake-movement';
  foodSystemId = 'super-snake.systems.food';
  hazardSystemId = 'super-snake.systems.hazards';
  powerUpSystemId = 'super-snake.systems.power-ups';
  context;
  options;
  input;
  ui;
  leaderboard;
  levelPresets;
  highScore = 0;
  snakeEntity = null;
  devicePixelRatio = 1;
  phase = 'menu';
  currentMode = 'classic';
  currentLevelId;
  currentLevelIndex = 0;
  nextLevelScoreTarget = null;
  pendingLevelUp = null;
  replayEvents = [];
  elapsedMs = 0;
  lastScoreSnapshot = null;
  constructor(
    e,
    { context: t, input: s, ui: i, leaderboard: a, levels: o, defaultLevelId: r, ...l }
  ) {
    (super('super-snake.scene', e), (this.context = t), (this.levelPresets = o ?? he));
    const c = l.levelDefinitions?.map(le) ?? this.levelPresets.map((m) => le(m.definition)),
      d = c[0]?.id ?? this.levelPresets[0]?.definition.id ?? 'aurora-garden',
      h = l.levelId ?? r ?? d;
    ((this.currentLevelId = h), (this.currentLevelIndex = this.findPresetIndex(h)));
    const y = this.levelPresets[this.currentLevelIndex] ?? this.levelPresets[0];
    ((this.nextLevelScoreTarget = y?.progression.nextScoreThreshold ?? null),
      (this.options = { ...l, levelDefinitions: c, levelId: h }),
      (this.devicePixelRatio = globalThis.devicePixelRatio ?? 1),
      (this.input = new vt(s)),
      (this.leaderboard = new St(a)));
    const p = { container: t.canvas.parentElement ?? void 0, ...i };
    ((p.levels = void 0),
      (this.ui = new bt(p)),
      this.styleCanvas(t.canvas),
      this.ui.setState('main-menu'));
    const v = this.leaderboard.load();
    ((this.highScore = this.computeHighScore(v)),
      this.ui.setLeaderboard(v),
      this.registerUiEvents(),
      this.input.onPause(() => {
        this.phase === 'playing'
          ? (this.setPhase('paused'), this.ui.setState('paused'))
          : this.phase === 'paused' && this.resume();
      }));
  }
  findPresetIndex(e) {
    const t = this.levelPresets.findIndex((s) => s.definition.id === e);
    return t >= 0 ? t : 0;
  }
  getPresetByIndex(e) {
    return this.levelPresets[e] ?? this.levelPresets[0];
  }
  updateNextLevelScoreTarget(e) {
    this.nextLevelScoreTarget = e.progression.nextScoreThreshold;
  }
  onEnter() {
    (this.world.registerSystem(ft()),
      this.world.registerSystem(mt()),
      this.world.registerSystem(yt()),
      this.world.registerSystem(gt()),
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
  update(e) {
    if (!(this.phase === 'menu' || this.phase === 'game-over')) {
      if (this.phase === 'paused' || this.phase === 'level-up') {
        this.input.update();
        return;
      }
      if ((this.input.update(), this.snakeEntity !== null)) {
        const t = this.world.getComponent(this.snakeEntity, C);
        if (t) {
          let s = this.input.consumeDirection();
          for (; s; )
            (nt(t, s),
              this.replayEvents.push({ time: this.elapsedMs, direction: s }),
              (s = this.input.consumeDirection()));
        }
      }
      ((this.elapsedMs += e),
        this.world.step(e),
        this.syncHudWithState(),
        this.checkLevelProgression(),
        this.checkForGameOver());
    }
  }
  render() {
    if (this.snakeEntity === null) return;
    const e = this.world.getComponent(this.snakeEntity, L),
      t = this.world.getComponent(this.snakeEntity, C),
      s = this.world.getComponent(this.snakeEntity, $),
      i = this.world.getComponent(this.snakeEntity, z),
      a = this.world.getComponent(this.snakeEntity, D);
    if (!e || !t || !s) return;
    this.ensureCanvasSize(e.width, e.height, e.cellSize);
    const o = this.context,
      r = o.canvas,
      l = e.width * e.cellSize,
      c = e.height * e.cellSize;
    (o.save(), o.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0));
    const d = a?.theme;
    ((o.fillStyle = d?.backgroundColor ?? '#051622'),
      o.fillRect(0, 0, l, c),
      (o.strokeStyle = d?.gridLineColor ?? 'rgba(255, 255, 255, 0.05)'),
      (o.lineWidth = 1));
    for (let p = 0; p <= e.width; p += 1)
      (o.beginPath(), o.moveTo(p * e.cellSize, 0), o.lineTo(p * e.cellSize, c), o.stroke());
    for (let p = 0; p <= e.height; p += 1)
      (o.beginPath(), o.moveTo(0, p * e.cellSize), o.lineTo(l, p * e.cellSize), o.stroke());
    if (
      (a &&
        a.obstacles.length > 0 &&
        ((o.fillStyle = d?.obstacleColor ?? '#2c3e50'),
        a.obstacles.forEach((p) => {
          const v = p.x * e.cellSize,
            m = p.y * e.cellSize;
          o.fillRect(v, m, e.cellSize, e.cellSize);
        })),
      s.items.forEach((p) => {
        const v = p.tint,
          [m, g, f, x] = v;
        o.fillStyle = `rgba(${Math.round(m * 255)}, ${Math.round(g * 255)}, ${Math.round(f * 255)}, ${x})`;
        const u = 6,
          S = e.cellSize - u * 2,
          w = p.x * e.cellSize + u,
          b = p.y * e.cellSize + u;
        o.fillRect(w, b, S, S);
      }),
      i &&
        i.items.forEach((p) => {
          const [v, m, g, f] = p.tint,
            x = p.x * e.cellSize + e.cellSize / 2,
            u = p.y * e.cellSize + e.cellSize / 2,
            S = e.cellSize * 0.35;
          (o.beginPath(),
            (o.fillStyle = `rgba(${Math.round(v * 255)}, ${Math.round(m * 255)}, ${Math.round(g * 255)}, ${f})`),
            o.arc(x, u, S, 0, Math.PI * 2),
            o.fill(),
            (o.lineWidth = 2),
            (o.strokeStyle = 'rgba(255, 255, 255, 0.25)'),
            o.stroke());
          const w = Math.max(16, Math.floor(e.cellSize * 0.55));
          ((o.font = `${w}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`),
            (o.textAlign = 'center'),
            (o.textBaseline = 'middle'),
            (o.fillStyle = '#ffffff'),
            o.fillText(p.icon, x, u));
        }),
      a && a.hazards.length > 0)
    ) {
      const p = d?.hazardColor ?? '#f26c6c',
        v = d?.hazardIcon ?? '✴️',
        m = 0.85 + Math.sin(this.elapsedMs / 280) * 0.1,
        g = a.hazardsDisabledUntil > this.elapsedMs;
      a.hazards.forEach((f) => {
        const x = f.position.x * e.cellSize + e.cellSize / 2,
          u = f.position.y * e.cellSize + e.cellSize / 2,
          S = e.cellSize * 0.4 * m,
          w = f.active === !1;
        (o.beginPath(),
          (o.fillStyle = p),
          (o.globalAlpha = g || w ? 0.25 : 0.8),
          o.arc(x, u, S, 0, Math.PI * 2),
          o.fill(),
          g
            ? ((o.lineWidth = 2),
              (o.strokeStyle = 'rgba(255, 255, 255, 0.45)'),
              o.setLineDash([4, 4]),
              o.stroke(),
              o.setLineDash([]))
            : w &&
              ((o.lineWidth = 2),
              (o.strokeStyle = 'rgba(255, 255, 255, 0.35)'),
              o.setLineDash([2, 4]),
              o.stroke(),
              o.setLineDash([])),
          (o.globalAlpha = 1));
        const b = Math.max(16, Math.floor(e.cellSize * 0.6));
        ((o.font = `${b}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`),
          (o.textAlign = 'center'),
          (o.textBaseline = 'middle'),
          (o.fillStyle = g || w ? 'rgba(255, 255, 255, 0.6)' : '#ffffff'),
          o.fillText(v, x, u));
      });
    }
    const h = d?.snakeBodyColor ?? '#2ecc71',
      y = d?.snakeHeadColor ?? '#ffffff';
    (t.segments.forEach((p, v) => {
      const m = v === 0 ? 2 : 4,
        g = e.cellSize - m * 2,
        f = p.x * e.cellSize + m,
        x = p.y * e.cellSize + m;
      ((o.fillStyle = v === 0 ? y : h), o.fillRect(f, x, g, g));
    }),
      t.alive || ((o.fillStyle = 'rgba(255, 64, 64, 0.35)'), o.fillRect(0, 0, l, c)),
      d?.overlayColor && ((o.fillStyle = d.overlayColor), o.fillRect(0, 0, l, c)),
      o.restore(),
      (r.style.width = `${l}px`),
      (r.style.height = `${c}px`));
  }
  ensureCanvasSize(e, t, s) {
    const i = this.context.canvas,
      a = e * s,
      o = t * s,
      r = Math.floor(a * this.devicePixelRatio),
      l = Math.floor(o * this.devicePixelRatio);
    (i.width !== r || i.height !== l) && ((i.width = r), (i.height = l));
  }
  styleCanvas(e) {
    const t = e.style;
    ((t.display = 'block'),
      (t.margin = '0 auto'),
      (t.maxWidth = '100%'),
      (t.height = 'auto'),
      (t.borderRadius = '16px'),
      (t.boxShadow = '0 24px 48px rgba(5, 12, 20, 0.45)'),
      (t.backgroundColor = 'transparent'));
  }
  computeHighScore(e) {
    return e.reduce((t, s) => Math.max(t, s.score), 0);
  }
  buildHudState() {
    if (this.snakeEntity === null) return null;
    const e = this.world.getComponent(this.snakeEntity, I);
    if (!e) return null;
    const t = this.world.getComponent(this.snakeEntity, D),
      s = this.world.getComponent(this.snakeEntity, z),
      i = this.world.getComponent(this.snakeEntity, T),
      a = new Map();
    i?.definitions.forEach((r) => {
      a.set(r.type, { icon: r.icon, label: this.formatPowerUpType(r.type) });
    });
    const o =
      s?.active
        .filter((r) => r.expiresAt > this.elapsedMs)
        .map((r) => {
          const l = a.get(r.type);
          return {
            id: r.id,
            icon: l?.icon ?? '✨',
            label: l?.label ?? this.formatPowerUpType(r.type),
            remainingMs: Math.max(0, r.expiresAt - this.elapsedMs),
          };
        })
        .sort((r, l) => r.remainingMs - l.remainingMs) ?? [];
    return {
      levelName: t?.levelName ?? 'Arcade',
      score: e.score,
      combo: e.comboCount,
      highScore: Math.max(this.highScore, e.score),
      activePowerUps: o,
    };
  }
  updateHud() {
    this.ui.setHudState(this.buildHudState());
  }
  formatPowerUpType(e) {
    switch (e) {
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
        return e;
    }
  }
  getDebugState() {
    if (this.snakeEntity === null) return null;
    const e = this.world.getComponent(this.snakeEntity, L),
      t = this.world.getComponent(this.snakeEntity, C),
      s = this.world.getComponent(this.snakeEntity, $),
      i = this.world.getComponent(this.snakeEntity, z),
      a = this.world.getComponent(this.snakeEntity, D),
      o = this.world.getComponent(this.snakeEntity, I);
    return !e || !t || !s || !o
      ? null
      : {
          grid: { ...e },
          snake: {
            alive: t.alive,
            direction: t.direction,
            nextDirection: t.nextDirection,
            segments: t.segments.map((r) => ({ ...r })),
          },
          food: { items: s.items.map((r) => ({ id: r.id, type: r.type, x: r.x, y: r.y })) },
          powerUps: i
            ? {
                items: i.items.map((r) => ({
                  id: r.id,
                  type: r.type,
                  icon: r.icon,
                  x: r.x,
                  y: r.y,
                })),
                active: i.active.map((r) => ({ id: r.id, type: r.type, expiresAt: r.expiresAt })),
              }
            : void 0,
          level: a
            ? {
                id: a.levelId,
                obstacles: a.obstacles.map((r) => ({ x: r.x, y: r.y })),
                hazards: a.hazards.map((r) => ({
                  id: r.id,
                  type: r.definitionId,
                  x: r.position.x,
                  y: r.position.y,
                })),
                theme: { id: a.theme.id },
              }
            : void 0,
          state: { score: o.score, comboCount: o.comboCount, maxCombo: o.maxCombo },
        };
  }
  checkForGameOver() {
    if (this.phase !== 'playing' || this.snakeEntity === null) return;
    const e = this.world.getComponent(this.snakeEntity, C);
    if (e && !e.alive) {
      const t = this.world.getComponent(this.snakeEntity, I);
      if (!t) return;
      const s = { mode: this.currentMode, score: t.score, combo: t.maxCombo };
      ((this.lastScoreSnapshot = s),
        this.ui.setLastScore(s),
        this.setPhase('game-over'),
        this.ui.setState('game-over'));
    }
  }
  syncHudWithState() {
    this.snakeEntity !== null && this.updateHud();
  }
  checkLevelProgression() {
    if (
      this.phase !== 'playing' ||
      this.snakeEntity === null ||
      this.pendingLevelUp ||
      this.nextLevelScoreTarget === null
    )
      return;
    const e = this.world.getComponent(this.snakeEntity, I);
    if (e && e.score >= this.nextLevelScoreTarget) {
      const t = this.currentLevelIndex + 1;
      t < this.levelPresets.length ? this.triggerLevelUp(t, e) : (this.nextLevelScoreTarget = null);
    }
  }
  createRunForPreset(e, t = {}) {
    (this.snakeEntity !== null &&
      this.world.hasEntity(this.snakeEntity) &&
      this.world.destroyEntity(this.snakeEntity),
      (this.currentLevelId = e.definition.id),
      (this.currentLevelIndex = this.findPresetIndex(this.currentLevelId)));
    const s = { ...this.options, levelId: this.currentLevelId };
    this.snakeEntity = it(this.world, s);
    const i = this.world.getComponent(this.snakeEntity, R);
    i &&
      ((i.moveIntervalMs = Math.max(
        16,
        Math.round(i.moveIntervalMs * e.progression.moveIntervalMultiplier)
      )),
      (i.accumulatorMs = 0));
    const a = this.world.getComponent(this.snakeEntity, G);
    a &&
      (a.spawnIntervalMs = Math.max(
        250,
        Math.round(a.spawnIntervalMs * e.progression.foodSpawnIntervalMultiplier)
      ));
    const o = this.world.getComponent(this.snakeEntity, T);
    o &&
      ((o.spawnIntervalMs = Math.max(
        1e3,
        Math.round(o.spawnIntervalMs * e.progression.powerUpSpawnIntervalMultiplier)
      )),
      (o.initialDelayMs = Math.max(
        0,
        Math.round(o.initialDelayMs * e.progression.powerUpInitialDelayMultiplier)
      )));
    const r = this.world.getComponent(this.snakeEntity, I);
    (r &&
      (t.preservedState
        ? ((r.score = t.preservedState.score),
          (r.comboCount = t.preservedState.comboCount),
          (r.maxCombo = Math.max(t.preservedState.maxCombo, r.maxCombo)))
        : ((r.score = 0), (r.comboCount = 0), (r.maxCombo = 0), (r.lastConsumedAt = -1 / 0)),
      (this.highScore = Math.max(this.highScore, r.score))),
      this.updateNextLevelScoreTarget(e),
      (this.pendingLevelUp = null),
      (this.replayEvents = []),
      (this.elapsedMs = 0),
      (this.lastScoreSnapshot = null),
      this.ui.setLastScore(null),
      this.ui.setReplayPreview(null),
      this.updateHud());
  }
  triggerLevelUp(e, t) {
    const s = this.getPresetByIndex(e),
      i = this.getPresetByIndex(this.currentLevelIndex);
    ((this.pendingLevelUp = {
      index: e,
      preset: s,
      preserved: { score: t.score, comboCount: t.comboCount, maxCombo: t.maxCombo },
    }),
      this.setPhase('level-up'),
      this.ui.setLevelUpContext({
        currentLevel: i.preview,
        nextLevel: s.preview,
        score: t.score,
        combo: t.comboCount,
      }),
      this.ui.setState('level-up'));
  }
  startGame(e) {
    this.currentMode = e;
    const t = this.currentLevelIndex,
      s = this.getPresetByIndex(t);
    ((this.currentLevelIndex = t),
      (this.pendingLevelUp = null),
      this.ui.setLevelUpContext(null),
      this.createRunForPreset(s),
      this.setPhase('playing'),
      this.ui.setState('playing'));
  }
  applyPendingLevelUp() {
    if (!this.pendingLevelUp) {
      this.phase === 'level-up' && (this.setPhase('playing'), this.ui.setState('playing'));
      return;
    }
    const { preset: e, preserved: t } = this.pendingLevelUp;
    ((this.pendingLevelUp = null),
      this.ui.setLevelUpContext(null),
      this.createRunForPreset(e, { preservedState: t }),
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
  saveScore(e) {
    if (!this.lastScoreSnapshot) return;
    const s = {
        id:
          typeof crypto < 'u' && typeof crypto.randomUUID == 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        initials: e,
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
      i = this.leaderboard.add(s);
    (this.ui.setLeaderboard(i),
      this.ui.setReplayPreview(s),
      this.ui.setState('leaderboard'),
      (this.highScore = this.computeHighScore(i)),
      this.updateHud());
  }
  deleteEntry(e) {
    const t = this.leaderboard.remove(e.id);
    (this.ui.setLeaderboard(t),
      this.ui.getState() === 'replay-view' && this.ui.setReplayPreview(null),
      (this.highScore = this.computeHighScore(t)),
      this.updateHud());
  }
  openModeSelect() {
    (this.snakeEntity !== null &&
      this.world.hasEntity(this.snakeEntity) &&
      this.world.destroyEntity(this.snakeEntity),
      (this.snakeEntity = null),
      (this.pendingLevelUp = null),
      this.ui.setLevelUpContext(null));
    const e = this.getPresetByIndex(this.currentLevelIndex);
    (this.updateNextLevelScoreTarget(e),
      (this.replayEvents = []),
      (this.elapsedMs = 0),
      (this.lastScoreSnapshot = null),
      this.setPhase('menu'),
      this.ui.setLastScore(null),
      this.ui.setReplayPreview(null),
      this.ui.setState('main-menu'));
  }
  registerUiEvents() {
    (this.ui.on('start', ({ mode: e }) => this.startGame(e)),
      this.ui.on('resume', () => this.resume()),
      this.ui.on('restart', () => this.restart()),
      this.ui.on('openModeSelect', () => this.openModeSelect()),
      this.ui.on('confirmLevelUp', () => this.applyPendingLevelUp()),
      this.ui.on('exitToMenu', () => this.exitToMenu()),
      this.ui.on('openSettings', () => {
        this.phase === 'playing' && this.setPhase('paused');
      }),
      this.ui.on('closeSettings', () => {
        this.phase === 'playing'
          ? this.ui.setState('playing')
          : this.phase === 'menu' && this.ui.setState('main-menu');
      }),
      this.ui.on('saveInitials', ({ initials: e }) => this.saveScore(e)),
      this.ui.on('deleteEntry', ({ entry: e }) => this.deleteEntry(e)),
      this.ui.on('viewReplay', ({ entry: e }) => this.ui.setReplayPreview(e)));
  }
  setPhase(e) {
    ((this.phase = e),
      e === 'playing' || e === 'paused' ? this.updateHud() : this.ui.setHudState(null));
  }
}
async function wt(n = {}) {
  const e = n.container ?? document.body,
    t = n.canvas ?? n.context?.canvas ?? document.createElement('canvas');
  if (n.context && n.context.canvas !== t)
    throw new Error('Provided context must be created from the supplied canvas');
  t.parentElement || e.appendChild(t);
  const s = n.context ?? t.getContext('2d');
  if (!s) throw new Error('Super Snake requires a 2D canvas context');
  const i = new Ee(() => new Ce());
  await i.push((h) => new ce(h, { context: s, ...(n.scene ?? {}) }));
  let a = !0,
    o = 0,
    r = performance.now();
  const l = (h) => {
    if (!a) return;
    const y = h - r;
    ((r = h), i.update(y), i.render(), (o = requestAnimationFrame(l)));
  };
  o = requestAnimationFrame(l);
  async function c() {
    a && ((a = !1), cancelAnimationFrame(o), await i.pop());
  }
  const d = i.current;
  if (d instanceof ce) {
    const h = n.scene?.autoStartMode;
    h && d.startGame(h);
  }
  return { canvas: t, manager: i, stop: c };
}
const ge = document.getElementById('super-snake-root');
if (!ge) throw new Error('Failed to find root element for Super Snake');
wt({ container: ge }).catch((n) => {
  console.error('Failed to boot Super Snake', n);
});
