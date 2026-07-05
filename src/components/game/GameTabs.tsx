export interface GameTab {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

interface GameTabsProps {
  tabs: GameTab[];
  activeHref: string;
}

export function GameTabs({ tabs, activeHref }: GameTabsProps) {
  return (
    <nav class="game-tabs">
      {tabs.map((tab) => (
        <a
          key={tab.id}
          href={tab.href}
          class={`game-tab${activeHref.startsWith(tab.href) ? ' active' : ''}`}
        >
          {tab.icon && <span class="game-tab-icon">{tab.icon}</span>}
          <span class="game-tab-label">{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
