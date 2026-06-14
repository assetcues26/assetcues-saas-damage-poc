import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CompactHeader } from '../../components/layout/AppHeader';
import { BackButton } from '../../components/ui/BackButton';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { HeroSection } from '../../components/layout/HeroSection';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatInr } from '../../v6/erpCatalog';
import { useErpCatalog } from '../../v6/useErpCatalog';
import { useV6 } from '../../hooks/useV6';

export function V6CatalogPage() {
  const navigate = useNavigate();
  const { sessionResults } = useV6();
  const { catalog, loading } = useErpCatalog();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-50">
      <CompactHeader
        title="V6 Catalog"
        left={<BackButton label="Home" onClick={() => navigate('/')} />}
      />

      <HeroSection>
        <PageWrapper className="py-6 pb-12">
          <header className="mb-8 max-w-3xl">
            <Badge className="mb-3">
              ERP + Vision 
            </Badge>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Select a catalog asset
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Pick one of nine realistic India ERP assets. Edit fields, add photos, and analyze with
              the isolated V6 endpoint. Session history clears when you close this tab.
            </p>
          </header>

          {sessionResults.length > 0 && (
            <section className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <h2 className="text-sm font-semibold text-blue-900">This session</h2>
              <ul className="mt-2 space-y-1">
                {sessionResults.slice(0, 5).map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/v6/result/${entry.id}`)}
                      className="text-sm text-blue-700 underline-offset-2 hover:underline"
                    >
                      {entry.asset_name || 'Analysis'} —{' '}
                      {new Date(entry.processedAt).toLocaleTimeString()}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {loading && (
            <p className="mb-4 text-sm text-gray-500">Loading FAR catalog…</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((asset, idx) => (
              <motion.div
                key={asset.catalog_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  hover
                  onClick={() => navigate(`/v6/asset/${asset.catalog_id}`)}
                  className="h-full p-5 text-left"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {asset.subcategory}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">{asset.asset_name}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {asset.make} {asset.model}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{asset.location}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                      Tag {asset.asset_tag_number}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                      Cost {formatInr(asset.original_cost_inr)}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">
                      NBV {formatInr(asset.book_nbv_inr)}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </PageWrapper>
      </HeroSection>
    </div>
  );
}
