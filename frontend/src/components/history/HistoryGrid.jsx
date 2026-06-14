import { useEffect, useState } from 'react';
import { HistoryAssetCard } from './HistoryAssetCard';

export function HistoryGrid({
  entries,
  onDelete,
  expandedId: controlledExpandedId,
  onExpandedIdChange,
}) {
  const [internalExpandedId, setInternalExpandedId] = useState(null);
  const isControlled = controlledExpandedId !== undefined && onExpandedIdChange != null;
  const expandedId = isControlled ? controlledExpandedId : internalExpandedId;

  const setExpandedId = (id) => {
    if (isControlled) {
      onExpandedIdChange(id);
    } else {
      setInternalExpandedId(id);
    }
  };

  useEffect(() => {
    if (!expandedId || typeof window.scrollTo !== 'function') return;
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [expandedId]);

  const visibleEntries = expandedId
    ? entries.filter((entry) => entry.id === expandedId)
    : entries;

  const handleDelete = async (id) => {
    await onDelete(id);
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  return (
    <div
      className={`grid w-full min-w-0 max-w-full gap-4 overflow-x-hidden sm:gap-6 ${
        expandedId
          ? 'mx-auto max-w-4xl grid-cols-1'
          : 'grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3'
      }`}
    >
      {visibleEntries.map((entry, index) => (
        <HistoryAssetCard
          key={entry.id}
          entry={entry}
          index={index}
          onDelete={handleDelete}
          expanded={expandedId === entry.id}
          onToggleExpand={setExpandedId}
        />
      ))}
    </div>
  );
}
