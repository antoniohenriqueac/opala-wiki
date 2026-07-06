import { InfoHoverTip, type InfoHoverContent } from './InfoHoverTip';

export const CALC_FIELD_HINTS: Record<string, InfoHoverContent> = {
  preset: {
    title: 'Preset',
    paragraphs: [
      'Atalhos com level e DPS típicos por vocação. Escolha um ponto de partida e ajuste os campos depois.',
    ],
  },
  level: {
    title: 'Level',
    paragraphs: [
      'Level do seu personagem nesta hunt.',
      'Acima do recomendado, o respawn para de melhorar muito e o DPS efetivo é limitado no modelo (overlevel).',
    ],
  },
  dps: {
    title: 'DPS',
    paragraphs: [
      'Dano por segundo que você aplica nos monstros — use o valor real ou estimado do seu char.',
      'Em party, o DPS total da PT é calculado a partir do seu DPS e do % de dano.',
    ],
  },
  lure: {
    title: 'Lure (pack)',
    paragraphs: [
      'Nível de lure desta hunt (minLure–maxLure vêm dos dados do jogo).',
      'Lure T atrai T a T+1 criaturas — ex.: Lure 3 → 3 a 4 bichos. MAX = maxLure + 1.',
      'Raw xp/h usa a média entre mínimo e máximo de criaturas do tier selecionado.',
    ],
  },
  partySize: {
    title: 'Party size',
    paragraphs: [
      'Número de jogadores na party (1–8). Ao mudar, o "Seu dano %" é ajustado automaticamente.',
      'Solo = 100% · Duo = 50% · Party x4 = 25%. Você pode editar o dano % depois se a split for diferente.',
    ],
  },
  dmgShare: {
    title: 'Seu dano %',
    paragraphs: [
      'Percentual do dano total da party que é seu — define sua fração de XP e o DPS efetivo da PT.',
      'Preenchido automaticamente ao mudar party size. Edite manualmente se você não divide dano igualmente.',
    ],
  },
  stamina: {
    title: 'Tempo de caça',
    paragraphs: [
      'Quantas horas você pretende caçar (máx. 12h). Só multiplica o total — raw xp/h não muda.',
      'Ex.: 1h com 200k raw xp/h → ~200k raw xp total. Com XP Boost, +50% na 1ª hora do período.',
      'Cards e comparações usam sempre raw xp/h; o rodapé mostra o total no tempo escolhido.',
    ],
  },
  respawn: {
    title: 'Tempo de respawn (s)',
    paragraphs: [
      'Valor do tooltip Velocidade de respawn no client Stonegy — fator #1 de raw xp/h e gp/h.',
      'Topo central da tela → passe o mouse no ícone → copie Tempo de respawn (ex.: 12s).',
      'O tempo muda com level, speed e dificuldade da hunt; use o valor da sua sessão atual.',
    ],
  },
  gainRate: {
    title: 'XP gain rate %',
    paragraphs: [
      'Taxa de XP do personagem (premium + loyalty). Ex.: 120% no client → digite 120.',
      'Afeta XP/h e XP total exibidos no rodapé e na calculadora. GP bruto NPC não muda.',
      'XP exibido = raw xp × gain rate / 100. Com XP Boost: +50% na 1ª hora (ex. 170% = 120+50).',
    ],
  },
};

interface CalcFieldLabelProps {
  label: string;
  hintKey: keyof typeof CALC_FIELD_HINTS;
}

export function CalcFieldLabel({ label, hintKey }: CalcFieldLabelProps) {
  const hint = CALC_FIELD_HINTS[hintKey];
  return (
    <label class="calc-field-label">
      <span>{label}</span>
      <InfoHoverTip content={hint} variant="default">
        <span class="calc-hint-trigger" aria-label={`Ajuda: ${hint.title}`}>
          i
        </span>
      </InfoHoverTip>
    </label>
  );
}
