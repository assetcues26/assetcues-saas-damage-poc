import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PackageOpen, SearchX } from 'lucide-react';
import { AuroraPageLayout } from '../components/layout/AuroraPageLayout';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Badge } from '../components/ui/Badge';
import { BackButton } from '../components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Spinner } from '../components/ui/Spinner';
import { HistoryGrid } from '../components/history/HistoryGrid';
import { HistorySearch } from '../components/history/HistorySearch';
import { useHistory } from '../hooks/useHistory';

const TABS = ['Browse', 'Search', 'Recent'];

export function HistoryPage() {
  const navigate = useNavigate();
  const { history, deleteEntry, searchEntries, historyCount, historyError, hydrated } = useHistory();
  const [activeTab, setActiveTab] = useState('Browse');
  const [focusedEntryId, setFocusedEntryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt)),
    [history],
  );

  const filtered = useMemo(() => {
    if (activeTab !== 'Search') return sortedHistory;
    return searchEntries(debouncedQuery);
  }, [activeTab, sortedHistory, searchEntries, debouncedQuery]);

  const recentEntries = sortedHistory.slice(0, 5);

  return (
    <AuroraPageLayout>
      <PageWrapper className="py-6 sm:py-8">
        <header className="mb-6 flex items-center gap-2 border-b border-gray-200/80 pb-4 sm:gap-3">
          {focusedEntryId ? (
            <BackButton
              label="All assets"
              aria-label="Back to all assets"
              onClick={() => setFocusedEntryId(null)}
            />
          ) : (
            <BackButton label="Home" onClick={() => navigate('/')} />
          )}
          <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold text-gray-900 sm:text-lg">
            {focusedEntryId ? 'Asset details' : 'Asset History'}
          </h1>
          <Badge variant="count" className="shrink-0">
            {hydrated ? `${historyCount} items` : 'Loading…'}
          </Badge>
        </header>

        <section className="pb-8">
          {!focusedEntryId ? (
            <div className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-gray-200/80 px-1 pb-px scrollbar-thin">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative shrink-0 touch-manipulation whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab ? 'text-gray-900' : 'text-gray-500 active:text-gray-700'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.span
                      layoutId="history-page-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"
                    />
                  )}
                </button>
              ))}
            </div>
          ) : null}

          {!focusedEntryId && activeTab === 'Search' && (
            <div className="mb-6">
              <HistorySearch value={searchQuery} onChange={setSearchQuery} />
            </div>
          )}

          {hydrated && historyError && historyCount === 0 ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Could not load saved reports — {historyError}. Check your API connection and demo key
              settings, then refresh the page.
            </div>
          ) : null}

          {!hydrated ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/60 px-4 py-14 text-center backdrop-blur-sm sm:py-16">
              <Spinner size={40} />
              <p className="text-sm text-gray-600">Loading saved reports…</p>
            </div>
          ) : historyCount === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200/80 bg-white/60 px-4 py-14 text-center backdrop-blur-sm sm:py-16">
              <PackageOpen size={48} className="text-gray-600" />
              <p className="text-gray-600">
                {historyError ? 'Saved reports could not be loaded' : 'No assets scanned yet'}
              </p>
              <Button className="w-full max-w-xs sm:w-auto" onClick={() => navigate('/capture')}>
                Start Your First Scan
              </Button>
            </div>
          ) : activeTab === 'Browse' ? (
            <HistoryGrid
              entries={sortedHistory}
              onDelete={deleteEntry}
              expandedId={focusedEntryId}
              onExpandedIdChange={setFocusedEntryId}
            />
          ) : activeTab === 'Search' ? (
            filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-2 py-12 text-gray-500">
                <SearchX size={40} />
                <p className="text-center text-sm">No results found for your search</p>
              </div>
            ) : (
              <HistoryGrid
                entries={filtered}
                onDelete={deleteEntry}
                expandedId={focusedEntryId}
                onExpandedIdChange={setFocusedEntryId}
              />
            )
          ) : (
            <HistoryGrid
              entries={recentEntries}
              onDelete={deleteEntry}
              expandedId={focusedEntryId}
              onExpandedIdChange={setFocusedEntryId}
            />
          )}
        </section>
      </PageWrapper>
    </AuroraPageLayout>
  );
}
