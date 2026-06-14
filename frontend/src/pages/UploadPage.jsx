import { useNavigate } from 'react-router-dom';

import { AnimatePresence } from 'framer-motion';

import { FileImage, Images } from 'lucide-react';

import { CompactHeader, ProgressPill } from '../components/layout/AppHeader';

import { BackButton } from '../components/ui/BackButton';

import { ProceedButton } from '../components/ui/ProceedButton';

import { DropZone } from '../components/upload/DropZone';

import { BatchTray } from '../components/batch/BatchTray';

import { LiveBatchPanel } from '../components/batch/LiveBatchPanel';

import { PageWrapper } from '../components/layout/PageWrapper';

import { HeroSection } from '../components/layout/HeroSection';

import { useMergedBatch } from '../hooks/useMergedBatch';

import { usePhoneBatchPanel } from '../hooks/usePhoneBatchPanel';

import { useApp } from '../context/AppContext';

import { AddFromPhonePanel } from '../components/session/AddFromPhonePanel';

import { UPLOAD_MAX_TOTAL_MB } from '../utils/imageCompression';



export function UploadPage() {

  const navigate = useNavigate();

  const { maxImages, setPreviewImage, showToast } = useApp();

  const {
    batchImages,
    batchCount,
    removeImage,
    tryAddImages,
    canAddMore,
    hasSessionImages,
    sessionImageCount,
  } = useMergedBatch();

  const { open: batchPanelOpen, openPanel, closePanel } = usePhoneBatchPanel(sessionImageCount);



  const handleFiles = async (files) => {

    if (!files.length) return;



    if (files.length === 1) {

      const file = files[0];

      const previewUrl = URL.createObjectURL(file);

      const payload = { file, previewUrl, source: 'upload' };

      setPreviewImage(payload);

      navigate('/preview?source=upload', { state: payload });

      return;

    }



    const added = await tryAddImages(files);

    if (added.length > 0) {
      navigate('/batch');
    }

  };



  return (

    <div className="flex min-h-[100dvh] flex-col bg-zinc-50">

      <CompactHeader

        title="Upload Images"

        left={<BackButton label="Back" onClick={() => navigate('/')} />}

        right={<ProgressPill current={batchCount} max={maxImages} />}

      />



      <HeroSection fill className="flex-1">

        <PageWrapper className="py-6 pb-32 sm:py-8 sm:pb-36">

          <header className="mb-6 max-w-2xl">

            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Add asset images</h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">

              Upload from your computer or scan the QR code to add photos from your phone.

            </p>

          </header>



          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">

            <section className="flex min-h-[320px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm sm:min-h-[360px]">

              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">

                <FileImage size={18} className="text-gray-600" aria-hidden />

                <h3 className="text-sm font-semibold text-gray-900">Upload from computer</h3>

              </div>

              <DropZone

                embedded

                inputId="desktop-file-upload-input"

                title="Click to upload or drag and drop"

                subtitle={`Asset photos — max ${maxImages} images, ${UPLOAD_MAX_TOTAL_MB} MB total`}

                browseLabel="Browse Files"

                onFilesSelected={handleFiles}

                onRejectedFiles={(count) =>

                  showToast(

                    `${count} file${count === 1 ? '' : 's'} skipped — use JPEG, PNG, or WebP only`,

                    'warning',

                  )

                }

                disabled={!canAddMore && batchCount >= maxImages}

              />

            </section>



            <AddFromPhonePanel variant="full" />

          </div>



          {batchCount > 0 && !hasSessionImages && (

            <section className="mt-8 rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm">

              <div className="mb-4 flex items-center justify-between gap-2">

                <h3 className="text-sm font-semibold text-gray-900">Current batch</h3>

                <span className="text-xs font-medium text-gray-500">

                  {batchCount} / {maxImages} images

                </span>

              </div>

              <BatchTray

                images={batchImages}

                maxImages={maxImages}

                onRemove={removeImage}

                showCounter={false}

              />

            </section>

          )}

        </PageWrapper>

      </HeroSection>



      <LiveBatchPanel

        open={batchPanelOpen}

        onClose={closePanel}

        images={batchImages}

        maxImages={maxImages}

        onRemove={removeImage}

        onProceed={() => navigate('/batch')}

        sessionImageCount={sessionImageCount}

      />



      {hasSessionImages && batchCount > 0 && !batchPanelOpen && (

        <button

          type="button"

          onClick={openPanel}

          className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:bottom-28"

        >

          <Images size={18} aria-hidden />

          View photos ({batchCount})

        </button>

      )}



      <AnimatePresence>

        {batchCount >= 1 && (

          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 p-3 pb-safe backdrop-blur-md sm:p-4">

            <ProceedButton

              label="Proceed to Analysis"

              onClick={() => navigate('/batch')}

              count={batchCount}

            />

          </div>

        )}

      </AnimatePresence>

    </div>

  );

}

