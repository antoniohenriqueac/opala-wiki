import { useEffect, useRef } from 'preact/hooks';
import { withBase } from '../lib/paths';
import type { SpriteAsset } from '../lib/types';

interface SpriteIconProps {
  kind: 'item' | 'monster';
  imageName: string;
  animated?: boolean;
  size?: number;
  assets: Record<string, SpriteAsset>;
}

function sheetUrl(kind: 'item' | 'monster', page: number): string {
  const prefix = kind === 'monster' ? 'monsters' : 'inventory';
  return withBase(`assets/${prefix}-0${page}.webp`);
}

export function SpriteIcon({ kind, imageName, animated, size, assets }: SpriteIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const asset = assets[imageName];
  const cellW = asset?.w ?? 32;
  const cellH = asset?.h ?? 32;
  const displayW = size ?? cellW;
  const displayH = size ?? cellH;
  const scale = displayW / cellW;

  useEffect(() => {
    if (!animated || !asset?.strip || !asset.frames || asset.frames <= 1 || !ref.current)
      return;

    const { strip, frames } = asset;
    const dur = (strip.dur * frames) / 1000;
    const kfName = `sp_${imageName.replace(/\W/g, '_')}_${strip.sx}_${strip.sy}`;

    if (!document.getElementById(kfName)) {
      const style = document.createElement('style');
      style.id = kfName;
      const endX = strip.sx + strip.stepX * frames;
      style.textContent = `@keyframes ${kfName}{from{background-position:-${strip.sx}px -${strip.sy}px}to{background-position:-${endX}px -${strip.sy}px}}`;
      document.head.appendChild(style);
    }

    const el = ref.current;
    el.style.animation = `${kfName} ${dur}s steps(${frames}) infinite`;
    el.style.backgroundPosition = `-${strip.sx}px -${strip.sy}px`;
  }, [animated, asset, imageName]);

  if (!asset) {
    return <div class="sprite sprite-placeholder" style={{ width: displayW, height: displayH }} />;
  }

  const innerStyle: Record<string, string> = {
    width: `${cellW}px`,
    height: `${cellH}px`,
    backgroundImage: `url("${sheetUrl(kind, asset.p)}")`,
    backgroundPosition: `-${asset.x}px -${asset.y}px`,
  };

  if (scale !== 1) {
    innerStyle.transform = `scale(${scale})`;
    innerStyle.transformOrigin = 'top left';
  }

  const sprite = <div ref={ref} class="sprite" style={innerStyle} title={imageName} />;

  if (scale !== 1) {
    return (
      <div
        class="sprite-scale-wrap"
        style={{ width: `${displayW}px`, height: `${displayH}px`, overflow: 'hidden' }}
      >
        {sprite}
      </div>
    );
  }

  return sprite;
}
