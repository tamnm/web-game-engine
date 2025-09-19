export type Anchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface BaseOptions {
  anchor?: Anchor;
  x?: number;
  y?: number;
}

export interface TextOptions extends BaseOptions {
  text: string;
}

export interface ImageOptions extends BaseOptions {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ButtonOptions extends BaseOptions {
  label: string;
  onClick?: () => void;
}

export interface PanelOptions extends BaseOptions {
  title?: string;
}

export class UIOverlay {
  private readonly container: HTMLElement;
  private readonly root: HTMLDivElement;

  constructor(options?: { container?: HTMLElement }) {
    this.container = options?.container ?? document.body;
    this.root = document.createElement('div');
    const s = this.root.style;
    s.position = 'fixed';
    s.top = '0';
    s.left = '0';
    s.width = '100%';
    s.height = '100%';
    s.pointerEvents = 'none'; // children opt-in
    s.zIndex = '9998';
  }

  attach(): void {
    if (!this.root.isConnected) this.container.appendChild(this.root);
  }

  detach(): void {
    if (this.root.parentElement) this.root.parentElement.removeChild(this.root);
  }

  clear(): void {
    this.root.innerHTML = '';
  }

  addText(opts: TextOptions): HTMLDivElement {
    const el = document.createElement('div');
    el.textContent = opts.text;
    el.style.color = '#e8f0ff';
    el.style.font = '14px/1.4 system-ui, sans-serif';
    this.position(el, opts);
    this.root.appendChild(el);
    return el;
  }

  addImage(opts: ImageOptions): HTMLImageElement {
    const img = document.createElement('img');
    img.src = opts.src;
    if (opts.alt) img.alt = opts.alt;
    if (opts.width) img.width = opts.width;
    if (opts.height) img.height = opts.height;
    this.position(img, opts);
    this.root.appendChild(img);
    return img;
  }

  addButton(opts: ButtonOptions): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = opts.label;
    btn.style.pointerEvents = 'auto';
    btn.style.padding = '6px 10px';
    btn.style.borderRadius = '8px';
    btn.style.border = '1px solid #223040';
    btn.style.background = '#11151a';
    btn.style.color = '#e8f0ff';
    if (opts.onClick) btn.addEventListener('click', () => opts.onClick?.());
    this.position(btn, opts);
    this.root.appendChild(btn);
    return btn;
  }

  addPanel(opts: PanelOptions = {}): HTMLDivElement {
    const panel = document.createElement('div');
    const s = panel.style;
    s.pointerEvents = 'auto';
    s.background = 'rgba(10, 12, 16, 0.9)';
    s.border = '1px solid #223040';
    s.borderRadius = '10px';
    s.padding = '10px 12px';
    s.minWidth = '160px';
    if (opts.title) {
      const h = document.createElement('div');
      h.textContent = opts.title;
      h.style.fontWeight = '600';
      h.style.marginBottom = '6px';
      panel.appendChild(h);
    }
    this.position(panel, opts);
    this.root.appendChild(panel);
    return panel;
  }

  private position(el: HTMLElement, opts: BaseOptions): void {
    const s = el.style;
    s.position = 'absolute';
    const anchor = opts.anchor ?? 'top-left';
    const x = opts.x ?? 0;
    const y = opts.y ?? 0;
    switch (anchor) {
      case 'top-left':
        s.top = `${y}px`;
        s.left = `${x}px`;
        break;
      case 'top-right':
        s.top = `${y}px`;
        s.right = `${x}px`;
        break;
      case 'bottom-left':
        s.bottom = `${y}px`;
        s.left = `${x}px`;
        break;
      case 'bottom-right':
        s.bottom = `${y}px`;
        s.right = `${x}px`;
        break;
      case 'center':
        s.top = '50%';
        s.left = '50%';
        s.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        break;
    }
  }
}
