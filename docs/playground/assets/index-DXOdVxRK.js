(function () {
  const t = document.createElement('link').relList;
  if (t && t.supports && t.supports('modulepreload')) return;
  for (const s of document.querySelectorAll('link[rel="modulepreload"]')) n(s);
  new MutationObserver((s) => {
    for (const r of s)
      if (r.type === 'childList')
        for (const a of r.addedNodes) a.tagName === 'LINK' && a.rel === 'modulepreload' && n(a);
  }).observe(document, { childList: !0, subtree: !0 });
  function i(s) {
    const r = {};
    return (
      s.integrity && (r.integrity = s.integrity),
      s.referrerPolicy && (r.referrerPolicy = s.referrerPolicy),
      s.crossOrigin === 'use-credentials'
        ? (r.credentials = 'include')
        : s.crossOrigin === 'anonymous'
          ? (r.credentials = 'omit')
          : (r.credentials = 'same-origin'),
      r
    );
  }
  function n(s) {
    if (s.ep) return;
    s.ep = !0;
    const r = i(s);
    fetch(s.href, r);
  }
})();
class j {
  container;
  currentDemo = null;
  onDemoSelect;
  constructor(t, i) {
    ((this.container = t), (this.onDemoSelect = i));
  }
  renderDemoList(t) {
    ((this.container.innerHTML = ''),
      t.forEach((i, n) => {
        const s = this.createDemoItem(n, i);
        this.container.appendChild(s);
      }),
      this.addKeyboardHint());
  }
  createDemoItem(t, i) {
    const n = document.createElement('div');
    ((n.className = 'demo-item'),
      (n.dataset.demo = t),
      t === this.currentDemo && n.classList.add('active'));
    const s = document.createElement('div');
    ((s.className = 'demo-item-name'), (s.textContent = i.name), n.appendChild(s));
    const r = document.createElement('div');
    return (
      (r.className = 'demo-item-description'),
      (r.textContent = i.description),
      n.appendChild(r),
      n.addEventListener('click', () => {
        this.selectDemo(t);
      }),
      n
    );
  }
  addKeyboardHint() {
    const t = document.createElement('div');
    ((t.className = 'keyboard-hint'),
      (t.innerHTML = `
      <strong>Keyboard Shortcuts</strong><br>
      <kbd>F12</kbd> or <kbd>\`</kbd> Toggle dev tools
    `),
      this.container.appendChild(t));
  }
  selectDemo(t) {
    ((this.currentDemo = t),
      this.container.querySelectorAll('.demo-item').forEach((n) => {
        n instanceof HTMLElement &&
          (n.dataset.demo === t ? n.classList.add('active') : n.classList.remove('active'));
      }),
      this.onDemoSelect(t));
  }
  getCurrentDemo() {
    return this.currentDemo;
  }
  setCurrentDemo(t) {
    ((this.currentDemo = t),
      this.container.querySelectorAll('.demo-item').forEach((n) => {
        n instanceof HTMLElement &&
          (n.dataset.demo === t ? n.classList.add('active') : n.classList.remove('active'));
      }));
  }
}
class W {
  canvas;
  loadingEl;
  demoSelector;
  demoRegistry = new Map();
  currentDemo = null;
  currentDemoName = null;
  devToolsEnabled = !0;
  constructor(t, i, n) {
    ((this.canvas = t),
      (this.loadingEl = n),
      (this.demoSelector = new j(i, (s) => this.loadDemo(s))));
  }
  registerDemo(t, i, n, s) {
    (this.demoRegistry.has(t) && console.warn(`Demo '${t}' is already registered. Overwriting.`),
      this.demoRegistry.set(t, { name: i, description: n, constructor: s }));
  }
  renderDemoSelector() {
    const t = new Map();
    (this.demoRegistry.forEach((i, n) => {
      t.set(n, { name: i.name, description: i.description });
    }),
      this.demoSelector.renderDemoList(t));
  }
  async loadDemo(t) {
    try {
      (this.showLoading(), this.unloadCurrentDemo());
      const i = this.demoRegistry.get(t);
      if (!i) throw new Error(`Demo not found: ${t}`);
      (console.info(`Loading demo: ${i.name}`),
        (this.currentDemo = new i.constructor(this.canvas)),
        await this.currentDemo.init(),
        (this.currentDemoName = t),
        this.demoSelector.setCurrentDemo(t),
        console.info(`Demo loaded successfully: ${i.name}`));
    } catch (i) {
      (console.error(`Failed to load demo: ${t}`, i),
        this.showError(`Failed to load demo: ${i instanceof Error ? i.message : 'Unknown error'}`));
    } finally {
      this.hideLoading();
    }
  }
  unloadCurrentDemo() {
    if (this.currentDemo)
      try {
        (console.info('Cleaning up current demo'), this.currentDemo.cleanup());
      } catch (t) {
        console.error('Error during demo cleanup:', t);
      } finally {
        ((this.currentDemo = null), (this.currentDemoName = null));
      }
  }
  toggleDevTools() {
    ((this.devToolsEnabled = !this.devToolsEnabled),
      console.info(`Dev tools ${this.devToolsEnabled ? 'enabled' : 'disabled'}`),
      document
        .querySelectorAll('[style*="position: fixed"][style*="z-index: 99999"]')
        .forEach((i) => {
          i instanceof HTMLElement && (i.style.display = this.devToolsEnabled ? 'block' : 'none');
        }));
  }
  showLoading() {
    this.loadingEl.classList.remove('hidden');
  }
  hideLoading() {
    this.loadingEl.classList.add('hidden');
  }
  showError(t) {
    (console.error(t), alert(`Error: ${t}`));
  }
  getCurrentDemoName() {
    return this.currentDemoName;
  }
  getRegisteredDemos() {
    return Array.from(this.demoRegistry.keys());
  }
}
class D {
  canvas;
  world = null;
  renderer = null;
  gameLoop = null;
  constructor(t) {
    this.canvas = t;
  }
  cleanup() {
    (this.gameLoop &&
      typeof this.gameLoop == 'object' &&
      'stop' in this.gameLoop &&
      typeof this.gameLoop.stop == 'function' &&
      this.gameLoop.stop(),
      this.world &&
        typeof this.world == 'object' &&
        'dispose' in this.world &&
        typeof this.world.dispose == 'function' &&
        this.world.dispose(),
      this.renderer &&
        typeof this.renderer == 'object' &&
        'dispose' in this.renderer &&
        typeof this.renderer.dispose == 'function' &&
        this.renderer.dispose());
    const t = this.canvas.getContext('2d');
    (t && t.clearRect(0, 0, this.canvas.width, this.canvas.height),
      (this.gameLoop = null),
      (this.world = null),
      (this.renderer = null));
  }
  update(t) {
    this.world &&
      typeof this.world == 'object' &&
      'step' in this.world &&
      typeof this.world.step == 'function' &&
      this.world.step(t);
  }
  render() {
    this.renderer &&
      typeof this.renderer == 'object' &&
      'render' in this.renderer &&
      typeof this.renderer.render == 'function' &&
      this.renderer.render(this.world);
  }
}
var G = Object.defineProperty,
  U = (e, t) => {
    for (var i in t) G(e, i, { get: t[i], enumerable: !0 });
  };
function V(e, t, i) {
  return !(
    (i.all && !i.all.every((n) => e.getComponent(t, n) !== void 0)) ||
    (i.any && !i.any.some((n) => e.getComponent(t, n) !== void 0)) ||
    (i.none && i.none.some((n) => e.getComponent(t, n) !== void 0))
  );
}
function _(e, t, i) {
  const n = t.filter((s) => V(e, s, i));
  return {
    size: n.length,
    [Symbol.iterator]() {
      let s = 0;
      return {
        next: () => {
          if (s >= n.length) return { done: !0, value: void 0 };
          const r = n[s++],
            a = { entity: r },
            o = new Set(i.all ?? []);
          return (
            i.any?.forEach((l) => o.add(l)),
            o.forEach((l) => {
              const d = e.getComponent(r, l);
              d !== void 0 && (a[l.name] = d);
            }),
            { done: !1, value: a }
          );
        },
      };
    },
  };
}
var K = ['init', 'preUpdate', 'update', 'postUpdate', 'render', 'cleanup'],
  z = class {
    nextEntity = 1;
    entities = new Set();
    stores = new Map();
    systems = [];
    totalTime = 0;
    createEntity() {
      const e = this.nextEntity++;
      return (this.entities.add(e), e);
    }
    destroyEntity(e) {
      if (this.entities.delete(e)) for (const t of this.stores.values()) t.data.delete(e);
    }
    hasEntity(e) {
      return this.entities.has(e);
    }
    ensureStore(e) {
      const t = this.stores.get(e.name);
      if (t) return t;
      const i = { definition: e, data: new Map() };
      return (this.stores.set(e.name, i), i);
    }
    addComponent(e, t, i) {
      if (!this.entities.has(e)) throw new Error(`Entity ${e} does not exist`);
      this.ensureStore(t).data.set(e, i);
    }
    upsertComponent(e, t, i) {
      const n = this.ensureStore(t);
      (this.entities.has(e) || this.entities.add(e), n.data.set(e, i));
    }
    getComponent(e, t) {
      const i = this.stores.get(t.name);
      if (i) return i.data.get(e);
    }
    ensureComponent(e, t) {
      const i = this.getComponent(e, t);
      if (i !== void 0) return i;
      if (!t.defaults) throw new Error(`Component ${t.name} not found for entity ${e}`);
      const n = t.defaults();
      return (this.addComponent(e, t, n), n);
    }
    removeComponent(e, t) {
      this.stores.get(t.name)?.data.delete(e);
    }
    query(e) {
      return _(this, Array.from(this.entities), e);
    }
    registerSystem(e) {
      const t = K.indexOf(e.stage);
      if (t === -1) throw new Error(`Unknown system stage: ${e.stage}`);
      const i = e.order ?? 0;
      (this.systems.push({ system: e, stageIndex: t, order: i }),
        this.systems.sort((n, s) => n.stageIndex - s.stageIndex || n.order - s.order));
    }
    unregisterSystem(e) {
      const t = this.systems.findIndex((i) => i.system.id === e);
      t >= 0 && this.systems.splice(t, 1);
    }
    step(e) {
      this.totalTime += e;
      const t = { world: this, delta: e, elapsed: this.totalTime, totalTime: this.totalTime },
        i = ['init', 'preUpdate', 'update', 'postUpdate', 'cleanup'];
      for (const { system: n } of this.systems) i.includes(n.stage) && n.execute(t);
    }
    render(e) {
      const t = {
        world: this,
        delta: 0,
        elapsed: this.totalTime,
        totalTime: this.totalTime,
        alpha: e,
      };
      for (const { system: i } of this.systems) i.stage === 'render' && i.execute(t);
    }
    serialize() {
      const e = Array.from(this.entities.values()),
        t = Array.from(this.stores.values()).map((i) => ({
          name: i.definition.name,
          entities: Array.from(i.data.keys()),
          data: Array.from(i.data.values()),
        }));
      return { entities: e, components: t };
    }
    snapshot(e) {
      if (!this.entities.has(e)) throw new Error(`Entity ${e} does not exist`);
      const t = {};
      for (const i of this.stores.values()) i.data.has(e) && (t[i.definition.name] = i.data.get(e));
      return { entity: e, components: t };
    }
    clear() {
      (this.entities.clear(), this.stores.clear(), (this.systems.length = 0), (this.totalTime = 0));
    }
  },
  Y = class {
    listeners = new Map();
    on(e, t) {
      const i = this.listeners.get(e) ?? new Set();
      return (i.add(t), this.listeners.set(e, i), () => this.off(e, t));
    }
    once(e, t) {
      const i = (n) => {
        (this.off(e, i), t(n));
      };
      return this.on(e, i);
    }
    off(e, t) {
      const i = this.listeners.get(e);
      i && (i.delete(t), i.size === 0 && this.listeners.delete(e));
    }
    emit(e, t) {
      const i = this.listeners.get(e);
      if (i) for (const n of Array.from(i)) n(t);
    }
    clear() {
      this.listeners.clear();
    }
  },
  q = 1e3 / 60,
  X = 250,
  J = 1,
  Q = 60,
  Z = class {
    accumulator = 0;
    fixedDelta;
    maxAccumulator;
    timeScale;
    paused = !1;
    totalSimulationTime = 0;
    frameCount = 0;
    frameTimeHistory = [];
    simulationStepsThisFrame = 0;
    constructor(e = {}) {
      ((this.fixedDelta = e.fixedDelta ?? q),
        (this.maxAccumulator = e.maxAccumulator ?? X),
        (this.timeScale = e.timeScale ?? J));
    }
    update(e) {
      if (((this.simulationStepsThisFrame = 0), this.paused)) return 0;
      const t = e * this.timeScale;
      ((this.accumulator += t),
        this.accumulator > this.maxAccumulator &&
          (console.warn(
            `TimeManager: Accumulator clamped from ${this.accumulator}ms to ${this.maxAccumulator}ms`
          ),
          (this.accumulator = this.maxAccumulator)));
      const i = Math.floor(this.accumulator / this.fixedDelta);
      return (
        (this.accumulator -= i * this.fixedDelta),
        (this.totalSimulationTime += i * this.fixedDelta),
        (this.simulationStepsThisFrame = i),
        i > 5 &&
          console.warn(
            `TimeManager: Executed ${i} simulation steps in one frame. Consider optimizing game logic.`
          ),
        i
      );
    }
    getFixedDelta() {
      return this.fixedDelta;
    }
    getScaledDelta() {
      return this.fixedDelta * this.timeScale;
    }
    getInterpolationAlpha() {
      const e = this.accumulator / this.fixedDelta;
      return Math.max(0, Math.min(1, e));
    }
    setTimeScale(e) {
      if (e < 0) throw new Error('Time scale must be non-negative');
      this.timeScale = e;
    }
    getTimeScale() {
      return this.timeScale;
    }
    pause() {
      this.paused || (this.paused = !0);
    }
    resume() {
      this.paused && (this.paused = !1);
    }
    isPaused() {
      return this.paused;
    }
    getStats() {
      let e = 0,
        t = 0;
      return (
        this.frameTimeHistory.length > 0 &&
          ((t = this.frameTimeHistory.reduce((n, s) => n + s, 0) / this.frameTimeHistory.length),
          (e = t > 0 ? 1e3 / t : 0)),
        {
          fps: e,
          averageFrameTime: t,
          simulationSteps: this.simulationStepsThisFrame,
          timeScale: this.timeScale,
          totalSimulationTime: this.totalSimulationTime,
          isPaused: this.paused,
        }
      );
    }
    getTotalSimulationTime() {
      return this.totalSimulationTime;
    }
    recordFrameTime(e) {
      (this.frameCount++,
        this.frameTimeHistory.push(e),
        this.frameTimeHistory.length > Q && this.frameTimeHistory.shift());
    }
    reset() {
      ((this.accumulator = 0),
        (this.totalSimulationTime = 0),
        (this.frameCount = 0),
        (this.frameTimeHistory = []),
        (this.simulationStepsThisFrame = 0),
        (this.paused = !1));
    }
  },
  tt = 60,
  A = class {
    timeManager;
    running = !1;
    useVSync;
    targetFPS;
    lastFrameTime = 0;
    frameId = null;
    onSimulationStep;
    onRender;
    visibilityChangeHandler;
    constructor(e = {}) {
      ((this.timeManager = e.timeManager ?? new Z()),
        (this.useVSync = e.useVSync ?? !0),
        (this.targetFPS = e.targetFPS ?? tt),
        (this.onSimulationStep = e.onSimulationStep),
        (this.onRender = e.onRender));
    }
    start() {
      this.running ||
        ((this.running = !0),
        (this.lastFrameTime = performance.now()),
        this.setupVisibilityHandling(),
        this.scheduleNextFrame());
    }
    stop() {
      this.running &&
        ((this.running = !1),
        this.frameId !== null &&
          (this.useVSync ? cancelAnimationFrame(this.frameId) : clearTimeout(this.frameId),
          (this.frameId = null)),
        this.cleanupVisibilityHandling());
    }
    isRunning() {
      return this.running;
    }
    tick(e) {
      if (!this.running) return;
      const t = e - this.lastFrameTime;
      this.lastFrameTime = e;
      const i = this.timeManager.update(t),
        n = this.timeManager.getScaledDelta();
      for (let r = 0; r < i; r++) this.onSimulationStep && this.onSimulationStep(n);
      const s = this.timeManager.getInterpolationAlpha();
      (this.onRender && this.onRender(s),
        this.timeManager.recordFrameTime(t),
        this.scheduleNextFrame());
    }
    setVSync(e) {
      this.useVSync = e;
    }
    setTargetFPS(e) {
      this.targetFPS = e;
    }
    getTimeManager() {
      return this.timeManager;
    }
    scheduleNextFrame() {
      if (this.running)
        if (this.useVSync) this.frameId = requestAnimationFrame((e) => this.tick(e));
        else {
          const e = 1e3 / this.targetFPS;
          this.frameId = setTimeout(() => {
            this.tick(performance.now());
          }, e);
        }
    }
    setupVisibilityHandling() {
      ((this.visibilityChangeHandler = () => {
        document.hidden
          ? this.timeManager.pause()
          : (this.timeManager.resume(), (this.lastFrameTime = performance.now()));
      }),
        document.addEventListener('visibilitychange', this.visibilityChangeHandler));
    }
    cleanupVisibilityHandling() {
      this.visibilityChangeHandler &&
        (document.removeEventListener('visibilitychange', this.visibilityChangeHandler),
        (this.visibilityChangeHandler = void 0));
    }
  },
  et = class {
    cache = {};
    load() {
      return { ...this.cache };
    }
    save(e) {
      this.cache = { ...e };
    }
  },
  it = class {
    constructor(e = 'web-game-engine-bindings') {
      this.key = e;
    }
    load() {
      if (typeof localStorage > 'u') return {};
      try {
        const e = localStorage.getItem(this.key);
        return e ? JSON.parse(e) : {};
      } catch {
        return {};
      }
    }
    save(e) {
      typeof localStorage > 'u' || localStorage.setItem(this.key, JSON.stringify(e));
    }
  },
  nt = class {
    bindings = new Map();
    states = new Map();
    storage;
    events = new Y();
    constructor(e = {}) {
      this.storage = e.storage ?? (typeof localStorage < 'u' ? new it() : new et());
      const t = this.storage.load();
      Object.entries(t).forEach(([i, n]) => {
        this.bindings.set(
          i,
          n.map((s) => ({ ...s }))
        );
      });
    }
    getBindings(e) {
      return this.bindings.get(e)?.map((t) => ({ ...t })) ?? [];
    }
    bind(e, t) {
      const i = this.bindings.get(e) ?? [];
      (i.push({ ...t }), this.bindings.set(e, i), this.persist());
    }
    rebind(e, t) {
      (this.bindings.set(
        e,
        t.map((i) => ({ ...i }))
      ),
        this.persist());
    }
    removeBinding(e, t) {
      const i = this.bindings.get(e);
      i &&
        (this.bindings.set(
          e,
          i.filter((n) => !t(n))
        ),
        this.persist());
    }
    handleKey(e, t, i = performance.now()) {
      this.processInput('keyboard', e, t, i);
    }
    handleGamepadButton(e, t, i = performance.now()) {
      this.processInput('gamepad', e, t, i);
    }
    handleAction(e, t, i = 1, n = performance.now()) {
      const s = this.getOrCreateState(e);
      ((s.pressed = t), (s.value = i), (s.updatedAt = n), this.emitState(e, s, t));
    }
    processInput(e, t, i, n) {
      for (const [s, r] of this.bindings)
        if (r.some((a) => a.device === e && a.code === t)) {
          const a = this.getOrCreateState(s);
          ((a.pressed = i), (a.value = i ? 1 : 0), (a.updatedAt = n), this.emitState(s, a, i));
        }
    }
    getOrCreateState(e) {
      const t = this.states.get(e);
      if (t) return t;
      const i = { pressed: !1, value: 0, updatedAt: performance.now?.() ?? Date.now() };
      return (this.states.set(e, i), i);
    }
    emitState(e, t, i) {
      const n = i ? 'actionDown' : 'actionUp';
      this.events.emit(n, { action: e, state: { ...t } });
    }
    persist() {
      const e = {};
      for (const [t, i] of this.bindings.entries()) e[t] = i.map((n) => ({ ...n }));
      this.storage.save(e);
    }
  },
  st = [1, 1, 1, 1];
function ot(e) {
  return e.texture !== void 0 && 'x' in e;
}
var L = class {
  context;
  stats = { drawCalls: 0, sprites: 0, batches: 0 };
  drawing = !1;
  currentBatch = null;
  maxBatchSize;
  camera = null;
  viewport = null;
  postProcessHook = null;
  backend = 'none';
  frameStartMs = 0;
  constructor(e = {}) {
    (e.contextProvider
      ? (this.context = e.contextProvider())
      : e.canvas
        ? (this.context = e.canvas.getContext('webgl2') ?? e.canvas.getContext('2d'))
        : (this.context = null),
      this.context
        ? (this.backend = this.isWebGLContext(this.context) ? 'webgl2' : 'canvas2d')
        : (this.backend = 'none'),
      (this.maxBatchSize = Math.max(1, e.maxBatchSize ?? 1e3)));
  }
  begin() {
    ((this.stats = { drawCalls: 0, sprites: 0, batches: 0 }),
      (this.drawing = !0),
      (this.currentBatch = null));
    const e = globalThis.performance;
    if (
      ((this.frameStartMs = e?.now ? e.now() : Date.now()),
      this.context && this.isWebGLContext(this.context))
    )
      (this.context.clearColor(0, 0, 0, 1), this.context.clear(this.context.COLOR_BUFFER_BIT));
    else if (this.context) {
      const t = this.context;
      (t.setTransform(1, 0, 0, 1, 0, 0),
        t.clearRect(0, 0, t.canvas.width, t.canvas.height),
        this.viewport && this.viewport.applyToContext(t));
    }
  }
  setCamera(e) {
    this.camera = e;
  }
  setViewport(e) {
    this.viewport = e;
  }
  setPostProcess(e) {
    this.postProcessHook = e;
  }
  getBackend() {
    return this.backend;
  }
  getStats() {
    return { ...this.stats };
  }
  drawSprite(e, t) {
    if (!this.drawing) throw new Error('Renderer.begin() must be called before drawing');
    const i = this.prepareCommand(e, t);
    (this.enqueue(i), (this.stats.sprites += 1));
  }
  end() {
    if (
      (this.flushCurrentBatch(),
      (this.drawing = !1),
      this.context && !this.isWebGLContext(this.context) && this.postProcessHook)
    ) {
      const s = this.context;
      (s.save(), s.setTransform(1, 0, 0, 1, 0, 0), this.postProcessHook(s), s.restore());
    }
    const e = globalThis.performance,
      t = e?.now ? e.now() : Date.now(),
      i = Math.max(0, t - this.frameStartMs);
    return { ...this.stats, frameTimeMs: i };
  }
  prepareCommand(e, t) {
    const i = ot(e) ? e : void 0,
      n = i ? { x: i.x, y: i.y, width: i.width, height: i.height } : void 0,
      s = i ? i.texture : e,
      r = t.width ?? n?.width ?? s.width,
      a = t.height ?? n?.height ?? s.height,
      o = t.origin ?? i?.origin ?? [0.5, 0.5],
      l = t.tint ?? st,
      d = t.parallax ?? [1, 1];
    return {
      texture: s,
      x: t.x,
      y: t.y,
      width: r,
      height: a,
      rotation: t.rotation ?? 0,
      tint: l,
      origin: o,
      parallax: d,
      blend: t.blend,
      region: n,
    };
  }
  enqueue(e) {
    const t = e.texture;
    ((!this.currentBatch || this.currentBatch.texture.id !== t.id) &&
      (this.flushCurrentBatch(), (this.currentBatch = { texture: t, commands: [] })),
      this.currentBatch.commands.push(e),
      this.currentBatch.commands.length >= this.maxBatchSize && this.flushCurrentBatch());
  }
  flushCurrentBatch() {
    if (!(!this.currentBatch || this.currentBatch.commands.length === 0)) {
      if (this.context && !this.isWebGLContext(this.context))
        for (const e of this.currentBatch.commands) this.drawSpriteCanvas(e);
      ((this.stats.drawCalls += 1), (this.stats.batches += 1), (this.currentBatch = null));
    }
  }
  drawSpriteCanvas(e) {
    const t = this.context,
      { texture: i } = e;
    if (!t || !i.source) return;
    const { origin: n, tint: s } = e,
      r = this.camera,
      a = r?.shakeOffset ?? { x: 0, y: 0 },
      o = r?.zoom ?? 1,
      l = (r?.x ?? 0) + a.x,
      d = (r?.y ?? 0) + a.y,
      m = (e.x - l * e.parallax[0]) * o,
      h = (e.y - d * e.parallax[1]) * o,
      c = this.mapBlendToCanvas(e.blend ?? 'normal');
    (t.save(),
      t.translate(m, h),
      e.rotation && t.rotate(e.rotation),
      (t.globalAlpha = s[3]),
      (t.globalCompositeOperation = c));
    try {
      e.region
        ? t.drawImage(
            i.source,
            e.region.x,
            e.region.y,
            e.region.width,
            e.region.height,
            -e.width * n[0] * o,
            -e.height * n[1] * o,
            e.width * o,
            e.height * o
          )
        : t.drawImage(
            i.source,
            -e.width * n[0] * o,
            -e.height * n[1] * o,
            e.width * o,
            e.height * o
          );
    } catch (f) {
      console.error('Renderer: drawImage failed', f);
    }
    const [y, p, g] = s;
    if (y !== 1 || p !== 1 || g !== 1) {
      const f = -e.width * n[0] * o,
        x = -e.height * n[1] * o,
        C = e.width * o,
        P = e.height * o;
      (t.save(),
        (t.globalCompositeOperation = 'multiply'),
        (t.fillStyle = `rgb(${Math.round(y * 255)}, ${Math.round(p * 255)}, ${Math.round(g * 255)})`),
        t.fillRect(f, x, C, P),
        (t.globalCompositeOperation = 'destination-in'),
        e.region
          ? t.drawImage(
              i.source,
              e.region.x,
              e.region.y,
              e.region.width,
              e.region.height,
              f,
              x,
              C,
              P
            )
          : t.drawImage(i.source, f, x, C, P),
        t.restore());
    }
    t.restore();
  }
  isWebGLContext(e) {
    return typeof WebGL2RenderingContext < 'u' && e instanceof WebGL2RenderingContext;
  }
  mapBlendToCanvas(e) {
    switch (e) {
      case 'additive':
        return 'lighter';
      case 'multiply':
        return 'multiply';
      case 'screen':
        return 'screen';
      default:
        return 'source-over';
    }
  }
};
function rt(e) {
  return {
    texture: e.texture,
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    origin: e.origin ? [...e.origin] : void 0,
  };
}
var at = class {
    constructor(e, t) {
      ((this.texture = e),
        Object.entries(t).forEach(([i, n]) => {
          this.regions.set(i, {
            texture: e,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            origin: n.origin ? [...n.origin] : void 0,
          });
        }));
    }
    regions = new Map();
    getRegion(e) {
      const t = this.regions.get(e);
      if (!t) throw new Error(`Unknown atlas frame: ${e}`);
      return rt(t);
    }
    hasRegion(e) {
      return this.regions.has(e);
    }
    listRegions() {
      return Array.from(this.regions.keys());
    }
  },
  lt = {};
U(lt, { detectBackendForCanvas: () => ht, isWebGL2Available: () => ct });
function ct() {
  if (typeof document > 'u' || typeof window > 'u' || !window.WebGL2RenderingContext) return !1;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return !1;
  }
}
function ht(e) {
  try {
    const i = e.getContext('webgl2'),
      n = window.WebGL2RenderingContext;
    if (i && n && i instanceof n) return 'webgl2';
  } catch {}
  return e.getContext('2d') ? 'canvas2d' : 'none';
}
var H = (e, t) =>
    Math.abs(e.position.x - t.position.x) <= e.halfSize.x + t.halfSize.x &&
    Math.abs(e.position.y - t.position.y) <= e.halfSize.y + t.halfSize.y,
  dt = (e, t) => {
    const i = e.position.x - t.position.x,
      n = e.position.y - t.position.y,
      s = e.radius + t.radius;
    return i * i + n * n <= s * s;
  },
  N = (e, t) => {
    const i = Math.max(
        t.position.x - t.halfSize.x,
        Math.min(e.position.x, t.position.x + t.halfSize.x)
      ),
      n = Math.max(
        t.position.y - t.halfSize.y,
        Math.min(e.position.y, t.position.y + t.halfSize.y)
      ),
      s = e.position.x - i,
      r = e.position.y - n;
    return s * s + r * r <= e.radius * e.radius;
  },
  mt = (e, t) => {
    if (!H(e, t)) return null;
    const i = t.position.x - e.position.x,
      n = t.halfSize.x + e.halfSize.x - Math.abs(i),
      s = t.position.y - e.position.y,
      r = t.halfSize.y + e.halfSize.y - Math.abs(s);
    return n < r
      ? { normal: { x: Math.sign(i) || 1, y: 0 }, depth: n }
      : { normal: { x: 0, y: Math.sign(s) || 1 }, depth: r };
  },
  ut = class {
    clips = new Map();
    registerClip(e) {
      for (const t of e.frames) {
        if (!e.atlas.hasRegion(t.frameName))
          throw new Error(`Frame '${t.frameName}' not found in texture atlas for clip '${e.name}'`);
        if (t.duration !== void 0 && t.duration <= 0)
          throw new Error(
            `Frame duration must be greater than zero for frame '${t.frameName}' in clip '${e.name}'`
          );
      }
      if (e.defaultFrameDuration <= 0)
        throw new Error(`Frame duration must be greater than zero for clip '${e.name}'`);
      if (e.speed <= 0)
        throw new Error(`Animation speed must be greater than zero for clip '${e.name}'`);
      this.clips.set(e.name, e);
    }
    getClip(e) {
      return this.clips.get(e);
    }
    hasClip(e) {
      return this.clips.has(e);
    }
    listClips() {
      return Array.from(this.clips.keys());
    }
    unregisterClip(e) {
      this.clips.delete(e);
    }
  },
  u = {
    name: 'SpriteAnimation',
    defaults: () => ({
      clipName: '',
      frameIndex: 0,
      accumulatedTime: 0,
      state: 'stopped',
      speed: 1,
      loopMode: 'loop',
      direction: 1,
      flipX: !1,
      flipY: !1,
      rotation: 0,
    }),
  },
  ft = class {
    constructor(e, t) {
      ((this.world = e), (this.animationManager = t));
    }
    play(e, t, i = !0) {
      const n = this.world.getComponent(e, u);
      if (!n) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      if (!this.animationManager.getClip(t)) {
        console.warn(`Animation clip '${t}' not found`);
        return;
      }
      ((n.clipName = t), (n.state = 'playing'), i && ((n.frameIndex = 0), (n.accumulatedTime = 0)));
    }
    pause(e) {
      const t = this.world.getComponent(e, u);
      if (!t) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      t.state === 'playing' && (t.state = 'paused');
    }
    resume(e) {
      const t = this.world.getComponent(e, u);
      if (!t) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      t.state === 'paused' && (t.state = 'playing');
    }
    stop(e) {
      const t = this.world.getComponent(e, u);
      if (!t) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      ((t.state = 'stopped'), (t.frameIndex = 0), (t.accumulatedTime = 0));
    }
    setSpeed(e, t) {
      if (t <= 0) throw new Error('Animation speed must be greater than zero');
      const i = this.world.getComponent(e, u);
      if (!i) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      i.speed = t;
    }
    setLoopMode(e, t) {
      const i = this.world.getComponent(e, u);
      if (!i) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      i.loopMode = t;
    }
    setFlip(e, t, i) {
      const n = this.world.getComponent(e, u);
      if (!n) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      ((n.flipX = t), (n.flipY = i));
    }
    setRotation(e, t) {
      const i = this.world.getComponent(e, u);
      if (!i) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      i.rotation = t;
    }
    transitionTo(e, t, i) {
      const n = this.world.getComponent(e, u);
      if (!n) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      if (!this.animationManager.getClip(t)) {
        console.warn(`Animation clip '${t}' not found`);
        return;
      }
      n.transition = { targetClip: t, duration: i, elapsed: 0 };
    }
    getState(e) {
      return this.world.getComponent(e, u);
    }
    getCurrentFrame(e) {
      const t = this.world.getComponent(e, u);
      if (!t) return;
      const i = this.animationManager.getClip(t.clipName);
      if (!i) {
        console.error(`Animation clip '${t.clipName}' not found`);
        return;
      }
      if (t.frameIndex < 0 || t.frameIndex >= i.frames.length) {
        console.error(
          `Frame index ${t.frameIndex} out of bounds for clip '${t.clipName}' (length: ${i.frames.length})`
        );
        return;
      }
      const n = i.frames[t.frameIndex];
      try {
        return i.atlas.getRegion(n.frameName);
      } catch (s) {
        console.error(`Error getting frame '${n.frameName}':`, s);
        return;
      }
    }
    step(e, t) {
      const i = this.world.getComponent(e, u);
      if (!i) {
        console.warn(`Entity ${e} does not have SpriteAnimation component`);
        return;
      }
      const n = this.animationManager.getClip(i.clipName);
      if (!n) {
        console.warn(`Animation clip '${i.clipName}' not found`);
        return;
      }
      i.frameIndex = Math.max(0, Math.min(n.frames.length - 1, i.frameIndex + t));
    }
  };
function pt(e, t) {
  return {
    x: t.x ?? 0,
    y: t.y ?? 0,
    width: t.width,
    height: t.height,
    rotation: t.rotation ?? e.rotation,
    flipX: e.flipX,
    flipY: e.flipY,
    tint: t.tint,
    origin: t.origin,
    parallax: t.parallax,
    blend: t.blend,
  };
}
function gt(e) {
  return {
    id: 'sprite-animation',
    stage: 'update',
    order: 10,
    execute: (t) => {
      const { world: i, delta: n } = t,
        s = i.query({ all: [u] });
      for (const r of s) {
        const a = r.entity,
          o = i.getComponent(a, u);
        if (!o) continue;
        if (o.transition) {
          if (((o.transition.elapsed += n), o.transition.elapsed >= o.transition.duration)) {
            const m = o.transition.targetClip;
            if (
              ((o.transition = void 0),
              (o.clipName = m),
              (o.frameIndex = 0),
              (o.accumulatedTime = 0),
              (o.state = 'playing'),
              o.onTransitionComplete)
            )
              try {
                o.onTransitionComplete(a, m);
              } catch (h) {
                console.error('Error in onTransitionComplete callback:', h);
              }
          }
          continue;
        }
        if (o.state !== 'playing') continue;
        const l = e.getClip(o.clipName);
        if (!l || l.frames.length === 0) continue;
        const d = n * o.speed;
        for (o.accumulatedTime += d; o.accumulatedTime >= R(l, o.frameIndex); ) {
          const m = R(l, o.frameIndex);
          o.accumulatedTime -= m;
          const h = o.frameIndex + o.direction;
          if (o.loopMode === 'none') {
            if (h >= l.frames.length || h < 0) {
              if (
                ((o.frameIndex = Math.max(0, Math.min(l.frames.length - 1, h))),
                (o.state = 'stopped'),
                (o.accumulatedTime = 0),
                o.onComplete)
              )
                try {
                  o.onComplete(a, o.clipName);
                } catch (c) {
                  console.error('Error in onComplete callback:', c);
                }
              break;
            } else if (((o.frameIndex = h), o.onFrame))
              try {
                o.onFrame(a, o.clipName, o.frameIndex);
              } catch (c) {
                console.error('Error in onFrame callback:', c);
              }
          } else if (o.loopMode === 'loop') {
            if (h >= l.frames.length) {
              if (((o.frameIndex = 0), o.onLoop))
                try {
                  o.onLoop(a, o.clipName);
                } catch (c) {
                  console.error('Error in onLoop callback:', c);
                }
            } else if (h < 0) {
              if (((o.frameIndex = l.frames.length - 1), o.onLoop))
                try {
                  o.onLoop(a, o.clipName);
                } catch (c) {
                  console.error('Error in onLoop callback:', c);
                }
            } else o.frameIndex = h;
            if (o.onFrame)
              try {
                o.onFrame(a, o.clipName, o.frameIndex);
              } catch (c) {
                console.error('Error in onFrame callback:', c);
              }
          } else if (o.loopMode === 'ping-pong') {
            if (h >= l.frames.length) {
              if (((o.direction = -1), (o.frameIndex = l.frames.length - 2), o.onLoop))
                try {
                  o.onLoop(a, o.clipName);
                } catch (c) {
                  console.error('Error in onLoop callback:', c);
                }
            } else if (h < 0) {
              if (((o.direction = 1), (o.frameIndex = 1), o.onLoop))
                try {
                  o.onLoop(a, o.clipName);
                } catch (c) {
                  console.error('Error in onLoop callback:', c);
                }
            } else o.frameIndex = h;
            if (o.onFrame)
              try {
                o.onFrame(a, o.clipName, o.frameIndex);
              } catch (c) {
                console.error('Error in onFrame callback:', c);
              }
          }
        }
      }
    },
  };
}
function R(e, t) {
  return e.frames[t]?.duration ?? e.defaultFrameDuration;
}
var I = class {
    container;
    el;
    lastFps = 0;
    constructor(e = {}) {
      ((this.container = e.container ?? document.body), (this.el = document.createElement('div')));
      const t = e.position ?? 'top-left',
        i = this.el.style;
      switch (
        ((i.position = 'fixed'),
        (i.zIndex = '99999'),
        (i.pointerEvents = 'none'),
        (i.fontFamily = 'monospace'),
        (i.fontSize = '12px'),
        (i.color = '#0f0'),
        (i.background = 'rgba(0,0,0,0.6)'),
        (i.padding = '6px 8px'),
        (i.whiteSpace = 'pre'),
        t)
      ) {
        case 'top-right':
          ((i.top = '8px'), (i.right = '8px'));
          break;
        case 'bottom-left':
          ((i.bottom = '8px'), (i.left = '8px'));
          break;
        case 'bottom-right':
          ((i.bottom = '8px'), (i.right = '8px'));
          break;
        default:
          ((i.top = '8px'), (i.left = '8px'));
      }
    }
    attach() {
      this.el.isConnected || this.container.appendChild(this.el);
    }
    detach() {
      this.el.parentElement && this.el.parentElement.removeChild(this.el);
    }
    update(e) {
      const t = Math.round((e.frameTimeMs ?? 0) * 10) / 10,
        i = e.frameTimeMs && e.frameTimeMs > 0 ? Math.round(1e3 / e.frameTimeMs) : this.lastFps;
      i > 0 && (this.lastFps = i);
      const n = [
        `FPS: ${this.lastFps || '--'}  ms: ${t}`,
        `DrawCalls: ${e.drawCalls}  Batches: ${e.batches}  Sprites: ${e.sprites}`,
      ];
      this.el.textContent = n.join(`
`);
    }
    get element() {
      return this.el;
    }
  },
  yt = class {
    constructor(e, t, i = {}) {
      ((this.world = e),
        (this.controller = t),
        (this.container = i.container ?? document.body),
        (this.el = document.createElement('div')));
      const n = i.position ?? 'top-right',
        s = this.el.style;
      switch (
        ((s.position = 'fixed'),
        (s.zIndex = '99999'),
        (s.fontFamily = 'monospace'),
        (s.fontSize = '12px'),
        (s.color = '#0f0'),
        (s.background = 'rgba(0,0,0,0.8)'),
        (s.padding = '8px'),
        (s.minWidth = '200px'),
        (s.borderRadius = '4px'),
        n)
      ) {
        case 'top-left':
          ((s.top = '8px'), (s.left = '8px'));
          break;
        case 'bottom-left':
          ((s.bottom = '8px'), (s.left = '8px'));
          break;
        case 'bottom-right':
          ((s.bottom = '8px'), (s.right = '8px'));
          break;
        default:
          ((s.top = '8px'), (s.right = '8px'));
      }
      ((this.infoEl = document.createElement('div')),
        (this.infoEl.style.marginBottom = '8px'),
        (this.infoEl.style.whiteSpace = 'pre'),
        this.el.appendChild(this.infoEl),
        (this.controlsEl = document.createElement('div')),
        (this.controlsEl.style.pointerEvents = 'auto'),
        this.el.appendChild(this.controlsEl),
        this.createControls());
    }
    container;
    el;
    controlsEl;
    infoEl;
    selectedEntity = null;
    createControls() {
      const e = `
      background: #333;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 4px 8px;
      margin: 2px;
      cursor: pointer;
      font-family: monospace;
      font-size: 11px;
    `,
        t = document.createElement('button');
      ((t.textContent = '▶ Play'),
        (t.style.cssText = e),
        (t.onclick = () => this.onPlay()),
        this.controlsEl.appendChild(t));
      const i = document.createElement('button');
      ((i.textContent = '⏸ Pause'),
        (i.style.cssText = e),
        (i.onclick = () => this.onPause()),
        this.controlsEl.appendChild(i));
      const n = document.createElement('button');
      ((n.textContent = '⏹ Stop'),
        (n.style.cssText = e),
        (n.onclick = () => this.onStop()),
        this.controlsEl.appendChild(n),
        this.controlsEl.appendChild(document.createElement('br')));
      const s = document.createElement('button');
      ((s.textContent = '◀ Step'),
        (s.style.cssText = e),
        (s.onclick = () => this.onStepBackward()),
        this.controlsEl.appendChild(s));
      const r = document.createElement('button');
      ((r.textContent = 'Step ▶'),
        (r.style.cssText = e),
        (r.onclick = () => this.onStepForward()),
        this.controlsEl.appendChild(r));
    }
    selectEntity(e) {
      ((this.selectedEntity = e), this.update());
    }
    clearSelection() {
      ((this.selectedEntity = null), this.update());
    }
    attach() {
      this.el.isConnected || this.container.appendChild(this.el);
    }
    detach() {
      this.el.parentElement && this.el.parentElement.removeChild(this.el);
    }
    update() {
      if (this.selectedEntity === null) {
        this.infoEl.textContent = 'No entity selected';
        return;
      }
      const e = this.world.getComponent(this.selectedEntity, u);
      if (!e) {
        this.infoEl.textContent = `Entity ${this.selectedEntity}
No animation component`;
        return;
      }
      const t = [
        `Entity: ${this.selectedEntity}`,
        `Clip: ${e.clipName || '(none)'}`,
        `Frame: ${e.frameIndex}`,
        `State: ${e.state}`,
        `Time: ${e.accumulatedTime.toFixed(3)}s`,
        `Speed: ${e.speed.toFixed(2)}x`,
        `Loop: ${e.loopMode}`,
        `Dir: ${e.direction === 1 ? 'forward' : 'reverse'}`,
        `Flip: ${e.flipX ? 'H' : '-'}${e.flipY ? 'V' : '-'}`,
        `Rot: ${((e.rotation * 180) / Math.PI).toFixed(1)}°`,
      ];
      (e.transition &&
        (t.push(`Transition: ${e.transition.targetClip}`),
        t.push(`  ${e.transition.elapsed.toFixed(2)}s / ${e.transition.duration.toFixed(2)}s`)),
        (this.infoEl.textContent = t.join(`
`)));
    }
    onPlay() {
      if (this.selectedEntity === null) return;
      const e = this.world.getComponent(this.selectedEntity, u);
      !e ||
        !e.clipName ||
        (this.controller.play(this.selectedEntity, e.clipName, !1), this.update());
    }
    onPause() {
      this.selectedEntity !== null && (this.controller.pause(this.selectedEntity), this.update());
    }
    onStop() {
      this.selectedEntity !== null && (this.controller.stop(this.selectedEntity), this.update());
    }
    onStepForward() {
      this.selectedEntity !== null && (this.controller.step(this.selectedEntity, 1), this.update());
    }
    onStepBackward() {
      this.selectedEntity !== null &&
        (this.controller.step(this.selectedEntity, -1), this.update());
    }
    get element() {
      return this.el;
    }
  };
function k(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
var F = class {
    x = 0;
    y = 0;
    texture;
    emissionRate = 0;
    maxParticles = 1e3;
    particles = [];
    accumulator = 0;
    behaviors = [];
    rng = Math.random;
    speed = { min: 10, max: 50 };
    angle = { min: 0, max: Math.PI * 2 };
    ttl = { min: 1, max: 2 };
    scale = { min: 1, max: 1 };
    alpha = { min: 1, max: 1 };
    constructor(e = {}) {
      ((this.x = e.x ?? 0),
        (this.y = e.y ?? 0),
        (this.texture = e.texture),
        (this.emissionRate = Math.max(0, e.emissionRate ?? 0)),
        (this.maxParticles = Math.max(1, e.maxParticles ?? 1e3)),
        e.speed && (this.speed = e.speed),
        e.angle && (this.angle = e.angle),
        e.ttl && (this.ttl = e.ttl),
        e.scale && (this.scale = e.scale),
        e.alpha && (this.alpha = e.alpha),
        (this.behaviors = e.behaviors ? [...e.behaviors] : []),
        e.rng && (this.rng = e.rng));
    }
    get count() {
      return this.particles.length;
    }
    emit(e) {
      const t = Math.floor(Math.max(0, e));
      for (let i = 0; i < t && this.particles.length < this.maxParticles; i++)
        this.particles.push(this.spawn());
    }
    update(e) {
      const t = Math.max(0, e) / 1e3;
      this.accumulator += this.emissionRate * t;
      let i = Math.floor(this.accumulator);
      for (this.accumulator -= i; i > 0 && this.particles.length < this.maxParticles; )
        (this.particles.push(this.spawn()), (i -= 1));
      for (let n = this.particles.length - 1; n >= 0; n--) {
        const s = this.particles[n];
        if (((s.age += t), s.age >= s.ttl)) {
          this.particles.splice(n, 1);
          continue;
        }
        for (const r of this.behaviors) r(s, t);
        ((s.vx += s.ax * t),
          (s.vy += s.ay * t),
          (s.x += s.vx * t),
          (s.y += s.vy * t),
          (s.rotation += s.angularVelocity * t));
      }
    }
    render(e) {
      if (!this.texture) return;
      const t = this.texture,
        i = t.width,
        n = t.height;
      for (const s of this.particles) {
        const r = i * s.scale,
          a = n * s.scale;
        e.drawSprite(t, {
          x: s.x,
          y: s.y,
          width: r,
          height: a,
          rotation: s.rotation,
          origin: [0.5, 0.5],
          parallax: [1, 1],
          tint: [1, 1, 1, k(s.alpha)],
        });
      }
    }
    spawn() {
      const e = this.rng(),
        t = (o, l, d) => o + (l - o) * d,
        i = t(this.angle.min, this.angle.max, e),
        n = t(this.speed.min, this.speed.max, this.rng()),
        s = t(this.ttl.min, this.ttl.max, this.rng()),
        r = t(this.scale.min, this.scale.max, this.rng()),
        a = t(this.alpha.min, this.alpha.max, this.rng());
      return {
        x: this.x,
        y: this.y,
        vx: Math.cos(i) * n,
        vy: Math.sin(i) * n,
        ax: 0,
        ay: 0,
        rotation: 0,
        angularVelocity: 0,
        scale: r,
        alpha: a,
        age: 0,
        ttl: s,
        texture: this.texture,
      };
    }
    withParticles(e) {
      e(this.particles);
    }
    setBehaviors(e) {
      this.behaviors = [...e];
    }
  },
  b = {
    gravity: (e) => (t) => {
      t.ay = e;
    },
    alphaOverLife: (e, t) => (i) => {
      const n = k(i.age / i.ttl);
      i.alpha = e + (t - e) * n;
    },
    scaleOverLife: (e, t) => (i) => {
      const n = k(i.age / i.ttl);
      i.scale = e + (t - e) * n;
    },
  };
function $(e, t = 64) {
  const i = document.createElement('canvas');
  ((i.width = t), (i.height = t));
  const n = i.getContext('2d');
  if (!n) throw new Error('Failed to get 2D context for color texture');
  return ((n.fillStyle = e), n.fillRect(0, 0, t, t), i);
}
function B(e, t = 32) {
  const i = document.createElement('canvas');
  ((i.width = t), (i.height = t));
  const n = i.getContext('2d');
  if (!n) throw new Error('Failed to get 2D context for circle texture');
  const s = t / 2;
  return ((n.fillStyle = e), n.beginPath(), n.arc(s, s, s, 0, Math.PI * 2), n.fill(), i);
}
function T(e, t, i = 64) {
  const n = [],
    s = e.match(/^#([0-9a-f]{6})$/i);
  if (!s) throw new Error('baseColor must be in hex format (#rrggbb)');
  const r = parseInt(s[1], 16),
    a = (r >> 16) & 255,
    o = (r >> 8) & 255,
    l = r & 255,
    d = Math.max(a, o, l) / 255,
    m = Math.min(a, o, l) / 255,
    h = (d + m) / 2,
    c = d - m,
    y = c === 0 ? 0 : c / (1 - Math.abs(2 * h - 1));
  let p = 0;
  c !== 0 &&
    (d === a / 255
      ? (p = ((o / 255 - l / 255) / c + (o < l ? 6 : 0)) / 6)
      : d === o / 255
        ? (p = ((l / 255 - a / 255) / c + 2) / 6)
        : (p = ((a / 255 - o / 255) / c + 4) / 6));
  for (let g = 0; g < t; g++) {
    const f = (g / t) * 60,
      C = `hsl(${(p * 360 + f) % 360 | 0}, ${(y * 100) | 0}%, ${(h * 100) | 0}%)`;
    n.push($(C, i));
  }
  return n;
}
class xt extends D {
  animationManager;
  controller;
  entity;
  debugPanel;
  devOverlay;
  async init() {
    (console.info('AnimationDemo: Initializing sprite animation showcase'),
      (this.canvas.width = 800),
      (this.canvas.height = 600),
      (this.world = new z()),
      (this.animationManager = new ut()));
    const t = gt(this.animationManager);
    (this.world.registerSystem(t),
      (this.controller = new ft(this.world, this.animationManager)),
      this.setupTextureAtlas(),
      this.registerAnimationClips(),
      (this.entity = this.createAnimatedEntity()),
      this.setupEventCallbacks(),
      (this.renderer = new L({ contextProvider: () => this.canvas.getContext('2d') })),
      (this.gameLoop = new A({
        onSimulationStep: (i) => this.update(i),
        onRender: () => this.render(),
        targetFPS: 60,
      })),
      (this.devOverlay = new I({ position: 'top-left' })),
      this.devOverlay.attach(),
      (this.debugPanel = new yt(this.world, this.controller, { position: 'top-right' })),
      this.debugPanel.selectEntity(this.entity),
      this.debugPanel.attach(),
      this.controller.play(this.entity, 'idle'),
      this.gameLoop.start(),
      console.info('AnimationDemo: Initialized successfully'));
  }
  setupTextureAtlas() {
    const t = T('#4a9eff', 4, 64),
      i = T('#50c878', 6, 64),
      n = T('#ff6b6b', 4, 64),
      s = T('#ffd93d', 3, 64),
      r = 512,
      a = 256,
      o = document.createElement('canvas');
    ((o.width = r), (o.height = a));
    const l = o.getContext('2d');
    l &&
      (t.forEach((h, c) => {
        l.drawImage(h, c * 64, 0, 64, 64);
      }),
      i.forEach((h, c) => {
        l.drawImage(h, c * 64, 64, 64, 64);
      }),
      n.forEach((h, c) => {
        l.drawImage(h, c * 64, 128, 64, 64);
      }),
      s.forEach((h, c) => {
        l.drawImage(h, c * 64, 192, 64, 64);
      }));
    const d = { id: 'character-spritesheet', width: r, height: a, source: o },
      m = {
        'idle-1': { x: 0, y: 0, width: 64, height: 64 },
        'idle-2': { x: 64, y: 0, width: 64, height: 64 },
        'idle-3': { x: 128, y: 0, width: 64, height: 64 },
        'idle-4': { x: 192, y: 0, width: 64, height: 64 },
        'walk-1': { x: 0, y: 64, width: 64, height: 64 },
        'walk-2': { x: 64, y: 64, width: 64, height: 64 },
        'walk-3': { x: 128, y: 64, width: 64, height: 64 },
        'walk-4': { x: 192, y: 64, width: 64, height: 64 },
        'walk-5': { x: 256, y: 64, width: 64, height: 64 },
        'walk-6': { x: 320, y: 64, width: 64, height: 64 },
        'run-1': { x: 0, y: 128, width: 64, height: 64 },
        'run-2': { x: 64, y: 128, width: 64, height: 64 },
        'run-3': { x: 128, y: 128, width: 64, height: 64 },
        'run-4': { x: 192, y: 128, width: 64, height: 64 },
        'jump-1': { x: 0, y: 192, width: 64, height: 64 },
        'jump-2': { x: 64, y: 192, width: 64, height: 64 },
        'jump-3': { x: 128, y: 192, width: 64, height: 64 },
      };
    return new at(d, m);
  }
  registerAnimationClips() {
    const t = this.setupTextureAtlas(),
      i = {
        name: 'idle',
        atlas: t,
        frames: [
          { frameName: 'idle-1' },
          { frameName: 'idle-2' },
          { frameName: 'idle-3' },
          { frameName: 'idle-4' },
        ],
        defaultFrameDuration: 0.2,
        loopMode: 'loop',
        speed: 1,
      },
      n = {
        name: 'walk',
        atlas: t,
        frames: [
          { frameName: 'walk-1' },
          { frameName: 'walk-2' },
          { frameName: 'walk-3' },
          { frameName: 'walk-4' },
          { frameName: 'walk-5' },
          { frameName: 'walk-6' },
        ],
        defaultFrameDuration: 0.15,
        loopMode: 'loop',
        speed: 1,
      },
      s = {
        name: 'run',
        atlas: t,
        frames: [
          { frameName: 'run-1' },
          { frameName: 'run-2' },
          { frameName: 'run-3' },
          { frameName: 'run-4' },
        ],
        defaultFrameDuration: 0.1,
        loopMode: 'loop',
        speed: 1.5,
      },
      r = {
        name: 'jump',
        atlas: t,
        frames: [
          { frameName: 'jump-1', duration: 0.1 },
          { frameName: 'jump-2', duration: 0.3 },
          { frameName: 'jump-3', duration: 0.1 },
        ],
        defaultFrameDuration: 0.15,
        loopMode: 'none',
        speed: 1,
      };
    (this.animationManager.registerClip(i),
      this.animationManager.registerClip(n),
      this.animationManager.registerClip(s),
      this.animationManager.registerClip(r));
  }
  createAnimatedEntity() {
    const t = this.world,
      i = t.createEntity();
    return (t.addComponent(i, u, u.defaults()), i);
  }
  setupEventCallbacks() {
    const i = this.world.getComponent(this.entity, u);
    i &&
      (i.onComplete = (n, s) => {
        s === 'jump' && this.controller.transitionTo(n, 'idle', 0.2);
      });
  }
  render() {
    const t = this.renderer,
      i = this.world;
    t.begin();
    const n = this.controller.getCurrentFrame(this.entity),
      s = i.getComponent(this.entity, u);
    if (n && s) {
      const a = pt(s, {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        width: 128,
        height: 128,
      });
      t.drawSprite(n, a);
    }
    const r = t.end();
    this.devOverlay && this.devOverlay.update(r);
  }
  cleanup() {
    (console.info('AnimationDemo: Cleaning up resources'),
      this.debugPanel && this.debugPanel.detach(),
      this.devOverlay && this.devOverlay.detach(),
      super.cleanup());
  }
}
const v = { name: 'Position', defaults: () => ({ x: 0, y: 0 }) },
  E = { name: 'Velocity', defaults: () => ({ x: 0, y: 0 }) },
  S = { name: 'BoxCollider', defaults: () => ({ halfWidth: 30, halfHeight: 30 }) },
  M = { name: 'CircleCollider', defaults: () => ({ radius: 25 }) },
  w = {
    name: 'Visual',
    defaults: () => ({
      color: '#ffffff',
      colliding: !1,
      texture: { id: 'default', width: 64, height: 64, source: null },
    }),
  };
class vt extends D {
  devOverlay;
  entities = [];
  mousePos = { x: 0, y: 0 };
  async init() {
    (console.info('PhysicsDemo: Initializing physics and collision showcase'),
      (this.canvas.width = 800),
      (this.canvas.height = 600),
      (this.world = new z()));
    const t = this.world;
    (t.registerSystem({
      id: 'physics',
      stage: 'update',
      execute: (i) => {
        const n = i.delta / 1e3,
          s = t.query({ all: [v, E] });
        for (const r of s) {
          const a = r.entity,
            o = t.getComponent(a, v),
            l = t.getComponent(a, E);
          ((o.x += l.x * n),
            (o.y += l.y * n),
            (l.y += 500 * n),
            (o.x < 0 || o.x > this.canvas.width) &&
              ((l.x *= -0.8), (o.x = Math.max(0, Math.min(this.canvas.width, o.x)))),
            o.y > this.canvas.height && ((l.y *= -0.8), (o.y = this.canvas.height)),
            o.y < 0 && ((l.y *= -0.8), (o.y = 0)));
        }
      },
    }),
      t.registerSystem({
        id: 'collision',
        stage: 'update',
        execute: () => {
          const i = t.query({ all: [v] }),
            n = Array.from(i).map((s) => s.entity);
          for (const s of n) {
            const r = t.getComponent(s, w);
            r && (r.colliding = !1);
          }
          for (let s = 0; s < n.length; s++)
            for (let r = s + 1; r < n.length; r++) {
              const a = n[s],
                o = n[r],
                l = t.getComponent(a, v),
                d = t.getComponent(o, v),
                m = t.getComponent(a, S),
                h = t.getComponent(o, S),
                c = t.getComponent(a, M),
                y = t.getComponent(o, M);
              let p = !1;
              if (m && h) {
                const g = { position: l, halfSize: { x: m.halfWidth, y: m.halfHeight } },
                  f = { position: d, halfSize: { x: h.halfWidth, y: h.halfHeight } };
                if (((p = H(g, f)), p)) {
                  const x = mt(g, f);
                  x &&
                    ((l.x -= x.normal.x * x.depth * 0.5),
                    (l.y -= x.normal.y * x.depth * 0.5),
                    (d.x += x.normal.x * x.depth * 0.5),
                    (d.y += x.normal.y * x.depth * 0.5));
                }
              } else if (c && y) {
                const g = { position: l, radius: c.radius },
                  f = { position: d, radius: y.radius };
                p = dt(g, f);
              } else if (c && h) {
                const g = { position: l, radius: c.radius },
                  f = { position: d, halfSize: { x: h.halfWidth, y: h.halfHeight } };
                p = N(g, f);
              } else if (m && y) {
                const g = { position: l, halfSize: { x: m.halfWidth, y: m.halfHeight } },
                  f = { position: d, radius: y.radius };
                p = N(f, g);
              }
              if (p) {
                const g = t.getComponent(a, w),
                  f = t.getComponent(o, w);
                (g && (g.colliding = !0), f && (f.colliding = !0));
              }
            }
        },
      }),
      (this.renderer = new L({ contextProvider: () => this.canvas.getContext('2d') })),
      (this.gameLoop = new A({
        onSimulationStep: (i) => this.update(i),
        onRender: () => this.render(),
        targetFPS: 60,
      })),
      (this.devOverlay = new I({ position: 'top-left' })),
      this.devOverlay.attach(),
      this.createInitialEntities(),
      this.setupMouseInteraction(),
      this.gameLoop.start(),
      console.info('PhysicsDemo: Initialized successfully'));
  }
  createInitialEntities() {
    const t = this.world;
    for (let i = 0; i < 3; i++) {
      const n = t.createEntity(),
        s = 60,
        r = { id: `box-${i}`, width: s, height: s, source: $('#4a9eff', s) };
      (t.addComponent(n, v, { x: 200 + i * 150, y: 100 + i * 50 }),
        t.addComponent(n, E, { x: (Math.random() - 0.5) * 200, y: Math.random() * 100 }),
        t.addComponent(n, S, { halfWidth: 30, halfHeight: 30 }),
        t.addComponent(n, w, { color: '#4a9eff', colliding: !1, texture: r }),
        this.entities.push(n));
    }
    for (let i = 0; i < 3; i++) {
      const n = t.createEntity(),
        s = 50,
        r = { id: `circle-${i}`, width: s, height: s, source: B('#50c878', s) };
      (t.addComponent(n, v, { x: 250 + i * 150, y: 200 + i * 50 }),
        t.addComponent(n, E, { x: (Math.random() - 0.5) * 200, y: Math.random() * 100 }),
        t.addComponent(n, M, { radius: 25 }),
        t.addComponent(n, w, { color: '#50c878', colliding: !1, texture: r }),
        this.entities.push(n));
    }
  }
  setupMouseInteraction() {
    (this.canvas.addEventListener('mousemove', (t) => {
      const i = this.canvas.getBoundingClientRect();
      ((this.mousePos.x = t.clientX - i.left), (this.mousePos.y = t.clientY - i.top));
    }),
      this.canvas.addEventListener('click', () => {
        this.spawnObjectAtMouse();
      }));
  }
  spawnObjectAtMouse() {
    const t = this.world,
      i = t.createEntity();
    if (
      (t.addComponent(i, v, { x: this.mousePos.x, y: this.mousePos.y }),
      t.addComponent(i, E, { x: (Math.random() - 0.5) * 300, y: -Math.random() * 200 - 100 }),
      Math.random() < 0.5)
    ) {
      const s = { id: `spawned-box-${i}`, width: 60, height: 60, source: $('#ff6b6b', 60) };
      (t.addComponent(i, S, {
        halfWidth: 20 + Math.random() * 20,
        halfHeight: 20 + Math.random() * 20,
      }),
        t.addComponent(i, w, { color: '#ff6b6b', colliding: !1, texture: s }));
    } else {
      const s = { id: `spawned-circle-${i}`, width: 50, height: 50, source: B('#ffd93d', 50) };
      (t.addComponent(i, M, { radius: 15 + Math.random() * 20 }),
        t.addComponent(i, w, { color: '#ffd93d', colliding: !1, texture: s }));
    }
    this.entities.push(i);
  }
  render() {
    const t = this.renderer,
      i = this.world;
    t.begin();
    for (const s of this.entities) {
      const r = i.getComponent(s, v),
        a = i.getComponent(s, w),
        o = i.getComponent(s, S),
        l = i.getComponent(s, M);
      !r ||
        !a ||
        (o
          ? (t.drawSprite(a.texture, {
              x: r.x,
              y: r.y,
              width: o.halfWidth * 2,
              height: o.halfHeight * 2,
            }),
            a.colliding &&
              t.drawSprite(a.texture, {
                x: r.x,
                y: r.y,
                width: o.halfWidth * 2,
                height: o.halfHeight * 2,
                tint: [1, 1, 1, 0.5],
                blend: 'additive',
              }))
          : l &&
            (t.drawSprite(a.texture, { x: r.x, y: r.y, width: l.radius * 2, height: l.radius * 2 }),
            a.colliding &&
              t.drawSprite(a.texture, {
                x: r.x,
                y: r.y,
                width: l.radius * 2,
                height: l.radius * 2,
                tint: [1, 1, 1, 0.5],
                blend: 'additive',
              })));
    }
    const n = t.end();
    this.devOverlay && this.devOverlay.update(n);
  }
  cleanup() {
    (console.info('PhysicsDemo: Cleaning up resources'),
      this.canvas.removeEventListener('mousemove', () => {}),
      this.canvas.removeEventListener('click', () => {}),
      this.devOverlay && this.devOverlay.detach(),
      super.cleanup());
  }
}
class wt extends D {
  devOverlay;
  emitters = [];
  mousePos = { x: 0, y: 0 };
  particleTexture;
  async init() {
    (console.info('ParticlesDemo: Initializing particle system showcase'),
      (this.canvas.width = 800),
      (this.canvas.height = 600),
      (this.particleTexture = { id: 'particle', width: 16, height: 16, source: B('#ffffff', 16) }),
      (this.renderer = new L({ contextProvider: () => this.canvas.getContext('2d') })));
    const t = new F({
      x: 200,
      y: 500,
      texture: this.particleTexture,
      emissionRate: 50,
      maxParticles: 500,
      speed: { min: 100, max: 200 },
      angle: { min: -Math.PI * 0.7, max: -Math.PI * 0.3 },
      ttl: { min: 2, max: 3 },
      scale: { min: 0.5, max: 1.5 },
      alpha: { min: 0.8, max: 1 },
      behaviors: [b.gravity(300), b.alphaOverLife(1, 0)],
    });
    this.emitters.push(t);
    const i = new F({
      x: 600,
      y: 300,
      texture: this.particleTexture,
      emissionRate: 0,
      maxParticles: 200,
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: Math.PI * 2 },
      ttl: { min: 1, max: 2 },
      scale: { min: 1, max: 2 },
      alpha: { min: 1, max: 1 },
      behaviors: [b.alphaOverLife(1, 0), b.scaleOverLife(1, 0)],
    });
    (this.emitters.push(i),
      setInterval(() => {
        i.emit(50);
      }, 2e3),
      (this.gameLoop = new A({
        onSimulationStep: (n) => this.update(n),
        onRender: () => this.render(),
        targetFPS: 60,
      })),
      (this.devOverlay = new I({ position: 'top-left' })),
      this.devOverlay.attach(),
      this.setupMouseInteraction(),
      this.gameLoop.start(),
      console.info('ParticlesDemo: Initialized successfully'));
  }
  setupMouseInteraction() {
    (this.canvas.addEventListener('mousemove', (t) => {
      const i = this.canvas.getBoundingClientRect();
      ((this.mousePos.x = t.clientX - i.left), (this.mousePos.y = t.clientY - i.top));
    }),
      this.canvas.addEventListener('click', () => {
        this.spawnBurstAtMouse();
      }));
  }
  spawnBurstAtMouse() {
    const t = new F({
      x: this.mousePos.x,
      y: this.mousePos.y,
      texture: this.particleTexture,
      emissionRate: 0,
      maxParticles: 100,
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: Math.PI * 2 },
      ttl: { min: 0.5, max: 1.5 },
      scale: { min: 0.8, max: 1.5 },
      alpha: { min: 0.8, max: 1 },
      behaviors: [b.gravity(200), b.alphaOverLife(1, 0)],
    });
    (t.emit(30),
      this.emitters.push(t),
      setTimeout(() => {
        const i = this.emitters.indexOf(t);
        i !== -1 && this.emitters.splice(i, 1);
      }, 2e3));
  }
  update(t) {
    for (const i of this.emitters) i.update(t);
  }
  render() {
    const t = this.renderer;
    t.begin();
    for (const n of this.emitters) n.render(t);
    const i = t.end();
    this.devOverlay && this.devOverlay.update(i);
  }
  cleanup() {
    (console.info('ParticlesDemo: Cleaning up resources'),
      this.canvas.removeEventListener('mousemove', () => {}),
      this.canvas.removeEventListener('click', () => {}),
      (this.emitters = []),
      this.devOverlay && this.devOverlay.detach(),
      super.cleanup());
  }
}
class bt extends D {
  devOverlay;
  inputManager;
  pressedKeys = new Set();
  mousePos = { x: 0, y: 0 };
  mouseButtons = new Set();
  lastInputEvent = '';
  async init() {
    (console.info('InputDemo: Initializing input handling showcase'),
      (this.canvas.width = 800),
      (this.canvas.height = 600),
      (this.renderer = new L({ contextProvider: () => this.canvas.getContext('2d') })),
      (this.inputManager = new nt()),
      this.inputManager.bind('jump', { action: 'jump', device: 'keyboard', code: 'Space' }),
      this.inputManager.bind('moveLeft', {
        action: 'moveLeft',
        device: 'keyboard',
        code: 'ArrowLeft',
      }),
      this.inputManager.bind('moveRight', {
        action: 'moveRight',
        device: 'keyboard',
        code: 'ArrowRight',
      }),
      this.inputManager.bind('moveUp', { action: 'moveUp', device: 'keyboard', code: 'ArrowUp' }),
      this.inputManager.bind('moveDown', {
        action: 'moveDown',
        device: 'keyboard',
        code: 'ArrowDown',
      }),
      this.inputManager.events.on('actionDown', ({ action: t, state: i }) => {
        this.lastInputEvent = `Action DOWN: ${t} (value: ${i.value})`;
      }),
      this.inputManager.events.on('actionUp', ({ action: t, state: i }) => {
        this.lastInputEvent = `Action UP: ${t} (value: ${i.value})`;
      }),
      (this.gameLoop = new A({
        onSimulationStep: (t) => this.update(t),
        onRender: () => this.render(),
        targetFPS: 60,
      })),
      (this.devOverlay = new I({ position: 'top-left' })),
      this.devOverlay.attach(),
      this.setupInputListeners(),
      this.gameLoop.start(),
      console.info('InputDemo: Initialized successfully'));
  }
  setupInputListeners() {
    (window.addEventListener('keydown', (t) => {
      (this.pressedKeys.add(t.code), this.inputManager.handleKey(t.code, !0));
    }),
      window.addEventListener('keyup', (t) => {
        (this.pressedKeys.delete(t.code), this.inputManager.handleKey(t.code, !1));
      }),
      this.canvas.addEventListener('mousemove', (t) => {
        const i = this.canvas.getBoundingClientRect();
        ((this.mousePos.x = t.clientX - i.left), (this.mousePos.y = t.clientY - i.top));
      }),
      this.canvas.addEventListener('mousedown', (t) => {
        (this.mouseButtons.add(t.button), (this.lastInputEvent = `Mouse DOWN: Button ${t.button}`));
      }),
      this.canvas.addEventListener('mouseup', (t) => {
        (this.mouseButtons.delete(t.button),
          (this.lastInputEvent = `Mouse UP: Button ${t.button}`));
      }));
  }
  update(t) {
    const i = navigator.getGamepads?.();
    if (i)
      for (const n of i)
        n &&
          n.buttons.forEach((s, r) => {
            s.pressed && this.inputManager.handleGamepadButton(`Button${r}`, !0);
          });
  }
  render() {
    const t = this.renderer,
      i = this.canvas.getContext('2d');
    if (!i) return;
    (t.begin(),
      (i.fillStyle = '#1a1a1a'),
      i.fillRect(0, 0, this.canvas.width, this.canvas.height),
      (i.fillStyle = '#ffffff'),
      (i.font = 'bold 28px system-ui'),
      (i.textAlign = 'center'),
      i.fillText('Input Demo', this.canvas.width / 2, 40),
      (i.font = 'bold 20px system-ui'),
      (i.textAlign = 'left'),
      (i.fillStyle = '#4a9eff'),
      i.fillText('Keyboard', 50, 100),
      (i.font = '16px system-ui'),
      (i.fillStyle = '#b0b0b0'),
      i.fillText('Press any key to see it here:', 50, 130),
      (i.fillStyle = '#ffffff'));
    const n = Array.from(this.pressedKeys);
    let s = 160;
    (n.length > 0
      ? n.forEach((h, c) => {
          const y = 50 + (c % 5) * 140,
            p = 160 + Math.floor(c / 5) * 40;
          ((i.fillStyle = '#4a9eff'),
            i.fillRect(y, p, 120, 30),
            (i.fillStyle = '#ffffff'),
            (i.font = 'bold 14px system-ui'),
            (i.textAlign = 'center'),
            i.fillText(h, y + 60, p + 20),
            (s = Math.max(s, p + 30)));
        })
      : ((i.fillStyle = '#666666'),
        (i.font = '14px system-ui'),
        (i.textAlign = 'left'),
        i.fillText('No keys pressed', 50, 180),
        (s = 180)),
      (i.textAlign = 'left'));
    const r = s + 50;
    ((i.font = 'bold 20px system-ui'),
      (i.fillStyle = '#50c878'),
      i.fillText('Mouse', 50, r),
      (i.font = '16px system-ui'),
      (i.fillStyle = '#b0b0b0'),
      i.fillText(
        `Position: (${Math.round(this.mousePos.x)}, ${Math.round(this.mousePos.y)})`,
        50,
        r + 30
      ));
    const a = Array.from(this.mouseButtons);
    (a.length > 0
      ? ((i.fillStyle = '#ffffff'), i.fillText(`Buttons: ${a.join(', ')}`, 50, r + 60))
      : ((i.fillStyle = '#666666'), i.fillText('No buttons pressed', 50, r + 60)),
      (i.fillStyle = '#50c878'),
      i.beginPath(),
      i.arc(this.mousePos.x, this.mousePos.y, 10, 0, Math.PI * 2),
      i.fill());
    const o = r + 110;
    ((i.font = 'bold 20px system-ui'), (i.fillStyle = '#ffd93d'), i.fillText('Gamepad', 50, o));
    const l = navigator.getGamepads?.(),
      d = l ? Array.from(l).find((h) => h !== null) : null;
    if (d) {
      ((i.font = '16px system-ui'),
        (i.fillStyle = '#b0b0b0'),
        i.fillText(`Connected: ${d.id}`, 50, o + 30));
      const h = d.buttons.map((c, y) => (c.pressed ? `B${y}` : null)).filter((c) => c !== null);
      (h.length > 0 &&
        ((i.fillStyle = '#ffffff'), i.fillText(`Buttons: ${h.join(', ')}`, 50, o + 60)),
        d.axes.length > 0 &&
          ((i.fillStyle = '#b0b0b0'),
          i.fillText(`Axes: ${d.axes.map((c) => c.toFixed(2)).join(', ')}`, 50, o + 90)));
    } else
      ((i.font = '14px system-ui'),
        (i.fillStyle = '#666666'),
        i.fillText('No gamepad connected', 50, o + 30),
        i.fillText('Connect a gamepad and press any button', 50, o + 55));
    this.lastInputEvent &&
      ((i.font = 'bold 16px system-ui'),
      (i.fillStyle = '#ff6b6b'),
      (i.textAlign = 'center'),
      i.fillText(`Last Event: ${this.lastInputEvent}`, this.canvas.width / 2, 580));
    const m = t.end();
    this.devOverlay && this.devOverlay.update(m);
  }
  cleanup() {
    (console.info('InputDemo: Cleaning up resources'),
      window.removeEventListener('keydown', () => {}),
      window.removeEventListener('keyup', () => {}),
      this.canvas.removeEventListener('mousemove', () => {}),
      this.canvas.removeEventListener('mousedown', () => {}),
      this.canvas.removeEventListener('mouseup', () => {}),
      this.pressedKeys.clear(),
      this.mouseButtons.clear(),
      this.devOverlay && this.devOverlay.detach(),
      super.cleanup());
  }
}
function O() {
  const e = document.getElementById('game-canvas'),
    t = document.getElementById('demo-list'),
    i = document.getElementById('loading');
  if (!e) throw new Error('Canvas element #game-canvas not found');
  if (!t) throw new Error('Demo list container #demo-list not found');
  if (!i) throw new Error('Loading element #loading not found');
  const n = new W(e, t, i);
  (n.registerDemo(
    'animation',
    'Sprite Animation',
    'Frame-based sprite animations with loop modes, speed control, and transforms',
    xt
  ),
    n.registerDemo(
      'physics',
      'Physics & Collision',
      'Collision detection with different shapes, velocity, and interactive spawning',
      vt
    ),
    n.registerDemo(
      'particles',
      'Particle Effects',
      'Particle emitters with burst and continuous modes, interactive triggering',
      wt
    ),
    n.registerDemo(
      'input',
      'Input Handling',
      'Keyboard, mouse, and gamepad input with real-time visual feedback',
      bt
    ),
    n.renderDemoSelector(),
    n.loadDemo('animation').catch((s) => {
      console.error('Failed to load default demo:', s);
    }),
    Ct(n),
    console.info('Engine Playground initialized'),
    console.info('Available demos:', n.getRegisteredDemos()));
}
function Ct(e) {
  document.addEventListener('keydown', (t) => {
    (t.key === 'F12' || t.key === '`') && (t.preventDefault(), e.toggleDevTools());
  });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', O) : O();
