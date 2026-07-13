import { useEffect } from 'preact/hooks';
import { useDetail } from '../context/DetailContext';
import { useWiki } from '../context/WikiContext';
import { HuntDetailView } from './details/HuntDetailView';
import { MonsterDetailView } from './details/MonsterDetailView';
import { ItemDetailView } from './details/ItemDetailView';
import { QuestDetailView } from './details/QuestDetailView';

export function DetailDrawer() {
  const { detail, canGoBack, goBack, closeDetail, openDetail } = useDetail();
  const { data, indexes } = useWiki();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (canGoBack) goBack();
      else closeDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canGoBack, goBack, closeDetail]);

  if (!detail) return null;

  let body: preact.ComponentChild;
  if (detail.type === 'hunt') {
    body = (
      <HuntDetailView h={detail.data} data={data} indexes={indexes} openDetail={openDetail} />
    );
  } else if (detail.type === 'monster') {
    body = (
      <MonsterDetailView m={detail.data} data={data} indexes={indexes} openDetail={openDetail} />
    );
  } else if (detail.type === 'item') {
    body = (
      <ItemDetailView it={detail.data} data={data} indexes={indexes} openDetail={openDetail} />
    );
  } else {
    body = (
      <QuestDetailView q={detail.data} data={data} indexes={indexes} openDetail={openDetail} />
    );
  }

  return (
    <>
      <div class="drawer-backdrop" onClick={closeDetail} />
      <div
        class={`drawer${detail.type === 'hunt' ? ' drawer-hunt' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div class="drawer-toolbar">
          {canGoBack && (
            <button type="button" class="drawer-back" onClick={goBack} aria-label="Voltar">
              ← Voltar
            </button>
          )}
          <button type="button" class="drawer-close" onClick={closeDetail} aria-label="Fechar">
            ×
          </button>
        </div>
        {body}
      </div>
    </>
  );
}
