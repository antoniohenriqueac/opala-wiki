import { useEffect } from 'preact/hooks';
import { useWiki } from '../context/WikiContext';
import { useDetail } from '../context/DetailContext';

/** Abre detalhe via ?monster=1 &item=2 &quest=3 &hunt=4 */
export function useDeepLinks() {
  const { data, indexes } = useWiki();
  const { openDetail } = useDetail();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const monster = params.get('monster');
    const item = params.get('item');
    const quest = params.get('quest');
    const hunt = params.get('hunt');

    if (monster) {
      const m = indexes.monById[+monster];
      if (m) openDetail({ type: 'monster', data: m }, { reset: true });
    } else if (item) {
      const it = indexes.itemById[+item];
      if (it) openDetail({ type: 'item', data: it }, { reset: true });
    } else if (quest) {
      const q = indexes.questById[+quest];
      if (q) openDetail({ type: 'quest', data: q }, { reset: true });
    } else if (hunt) {
      const h = indexes.huntById[+hunt];
      if (h) openDetail({ type: 'hunt', data: h }, { reset: true });
    }
  }, [data, indexes, openDetail]);
}
