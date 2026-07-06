import { useEffect, useRef, useState } from 'preact/hooks';
import { render } from 'preact';
import type { ComponentChildren } from 'preact';

export interface InfoHoverContent {
  title: string;
  paragraphs: string[];
  foot?: string;
}

interface TipPos {
  x: number;
  y: number;
  below: boolean;
}

interface InfoHoverTipProps {
  content: InfoHoverContent;
  variant?: 'default' | 'respawn';
  class?: string;
  stopClick?: boolean;
  children: ComponentChildren;
}

let portalEl: HTMLDivElement | null = null;

function getPortal(): HTMLDivElement {
  if (!portalEl) {
    portalEl = document.createElement('div');
    portalEl.id = 'info-hover-portal';
    document.body.appendChild(portalEl);
  }
  return portalEl;
}

function InfoTooltipCard({
  content,
  pos,
  variant,
}: {
  content: InfoHoverContent;
  pos: TipPos;
  variant: 'default' | 'respawn';
}) {
  return (
    <div
      class={`info-hover-tip info-hover-${variant}${pos.below ? ' below' : ''}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      role="tooltip"
    >
      <div class="info-hover-tip-inner">
        <div class="info-hover-title">{content.title}</div>
        {content.paragraphs.map((p, i) => (
          <p key={i} class={i > 0 ? 'info-hover-muted' : undefined}>
            {p}
          </p>
        ))}
        {content.foot && <div class="info-hover-foot">{content.foot}</div>}
      </div>
    </div>
  );
}

export function InfoHoverTip({
  content,
  variant = 'default',
  class: className,
  stopClick,
  children,
}: InfoHoverTipProps) {
  const [pos, setPos] = useState<TipPos | null>(null);
  const activeRef = useRef(false);

  const show = (e: MouseEvent | FocusEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const below = r.top < 140;
    activeRef.current = true;
    setPos({
      x: Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130),
      y: below ? r.bottom + 8 : r.top - 8,
      below,
    });
  };

  const hide = () => {
    activeRef.current = false;
    setPos(null);
  };

  useEffect(() => {
    const portal = getPortal();
    if (pos && activeRef.current) {
      render(<InfoTooltipCard content={content} pos={pos} variant={variant} />, portal);
    } else {
      render(null, portal);
    }
  }, [content, pos, variant]);

  useEffect(() => () => render(null, getPortal()), []);

  return (
    <span
      class={`info-hover-wrap${className ? ` ${className}` : ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={stopClick ? (e) => e.stopPropagation() : undefined}
      tabIndex={0}
    >
      {children}
    </span>
  );
}
