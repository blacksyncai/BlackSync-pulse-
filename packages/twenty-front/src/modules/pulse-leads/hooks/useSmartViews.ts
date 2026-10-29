import { DEFAULT_SMART_VIEWS } from '@/pulse-leads/constants/DefaultSmartViews';
import { type PulseSmartView } from '@/pulse-leads/types/PulseSmartView';
import { usePulseSetting } from '@/pulse-settings/hooks/usePulseSetting';
import { v4 } from 'uuid';

export const useSmartViews = () => {
  const { value: savedViews, save } = usePulseSetting<PulseSmartView[]>(
    'smartViews',
    [],
  );
  const smartViews = [...DEFAULT_SMART_VIEWS, ...savedViews];

  const createSmartView = async (view: Omit<PulseSmartView, 'id'>) => {
    const created = { ...view, id: v4(), isBuiltIn: false };

    await save([...savedViews, created]);

    return created;
  };

  const updateSmartView = (view: PulseSmartView) =>
    save(
      savedViews.map((existing) => (existing.id === view.id ? view : existing)),
    );

  const deleteSmartView = (viewId: string) =>
    save(savedViews.filter((existing) => existing.id !== viewId));

  return {
    smartViews,
    savedViews,
    createSmartView,
    updateSmartView,
    deleteSmartView,
  };
};
