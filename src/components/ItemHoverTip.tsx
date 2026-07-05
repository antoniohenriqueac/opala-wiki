import { useEffect, useRef, useState } from 'preact/hooks';
import { render } from 'preact';
import type { ComponentChildren } from 'preact';
import type { Item, SpriteAsset } from '../lib/types';
import { itemHoverInfo } from '../lib/item-summary';
import { fmtChance, fmtGp, fmtGpPerHour } from '../lib/format';
import { SpriteIcon } from './SpriteIcon';

interface ItemHoverTipProps {
  item: Item;
  class?: string;
  onClick?: () => void;
  /** Drop chance % — shown in loot grids */
  chance?: number;
  /** Estimated NPC gp/h in hunt context */
  gpPerHour?: number;
  invAssets?: Record<string, SpriteAsset>;
  /** Rarity border class e.g. loot-rare */
  rarityClass?: string;
  children: ComponentChildren;
}

interface TipPos {
  x: number;
  y: number;
  below: boolean;
}

let portalEl: HTMLDivElement | null = null;

function getPortal(): HTMLDivElement {
  if (!portalEl) {
    portalEl = document.createElement('div');
    portalEl.id = 'item-hover-portal';
    document.body.appendChild(portalEl);
  }
  return portalEl;
}

function TooltipCard({
  item,
  pos,
  chance,
  gpPerHour,
  invAssets,
  rarityClass,
}: {
  item: Item;
  pos: TipPos;
  chance?: number;
  gpPerHour?: number;
  invAssets?: Record<string, SpriteAsset>;
  rarityClass?: string;
}) {
  const info = itemHoverInfo(item);
  const accent = rarityClass?.replace('loot-', '') ?? 'common';

  return (
    <div
      class={`item-hover-tip item-hover-accent-${accent}${pos.below ? ' below' : ''}`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      role="tooltip"
    >
      <div class="item-hover-tip-inner">
        <div class="item-hover-head">
          {invAssets && (
            <div class="item-hover-icon">
              <SpriteIcon kind="item" imageName={item.image} assets={invAssets} size={36} />
            </div>
          )}
          <div class="item-hover-head-text">
            <div class="item-hover-name">{item.name}</div>
            {info.level != null && (
              <span class="item-hover-level">Level {info.level}+</span>
            )}
          </div>
        </div>
        {(info.stats || info.vocations || info.slot) && (
          <div class="item-hover-stats">
            {info.stats && <span>{info.stats}</span>}
            {info.vocations && <span>{info.vocations}</span>}
            {info.slot && <span>{info.slot}</span>}
          </div>
        )}
        <div class="item-hover-foot">
          {info.npcPrice != null && (
            <span class="item-hover-gp">
              {fmtGp(info.npcPrice)}
              {gpPerHour != null && gpPerHour > 0 && (
                <span class="item-hover-gph"> ({fmtGpPerHour(gpPerHour)})</span>
              )}
            </span>
          )}
          {info.npcPrice == null && gpPerHour != null && gpPerHour > 0 && (
            <span class="item-hover-gp">{fmtGpPerHour(gpPerHour)}</span>
          )}
          {chance != null && chance > 0 && (
            <span class="item-hover-drop">{fmtChance(chance)} drop</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ItemHoverTip({
  item,
  class: className,
  onClick,
  chance,
  gpPerHour,
  invAssets,
  rarityClass,
  children,
}: ItemHoverTipProps) {
  const [pos, setPos] = useState<TipPos | null>(null);
  const activeRef = useRef(false);

  const show = (e: MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const below = r.top < 120;
    activeRef.current = true;
    setPos({
      x: Math.min(Math.max(r.left + r.width / 2, 110), window.innerWidth - 110),
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
      render(
        <TooltipCard
          item={item}
          pos={pos}
          chance={chance}
          gpPerHour={gpPerHour}
          invAssets={invAssets}
          rarityClass={rarityClass}
        />,
        portal,
      );
    } else {
      render(null, portal);
    }
  }, [item, pos, chance, gpPerHour, invAssets, rarityClass]);

  useEffect(() => () => render(null, getPortal()), []);

  return (
    <div
      class={`item-hover-wrap${className ? ` ${className}` : ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show as unknown as () => void}
      onBlur={hide}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
