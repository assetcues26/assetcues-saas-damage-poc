import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Upload } from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { AppFooter } from '../components/layout/AppFooter';
import { HeroSection } from '../components/layout/HeroSection';
import { LogoElementVideo } from '../components/layout/LogoElementVideo';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { maxImages, configLoading } = useApp();

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-zinc-50">
      <AppHeader />
      <HeroSection>
        <PageWrapper>
          <section className="py-8 sm:py-16">
            <div className="relative mx-auto w-full max-w-5xl">
              <div className="flex flex-col items-center px-2 text-center sm:px-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6 bg-transparent"
                >
                  <LogoElementVideo className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
                >
                  AI-Powered Asset Intelligence
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg"
                >
                  Capture or upload asset images for instant AI analysis, condition scoring, and
                  label detection.
                </motion.p>
              </div>

              <div className="mx-auto mt-8 grid w-full max-w-2xl gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6">
                <Card
                  hover
                  onClick={() => navigate('/capture')}
                  className="touch-manipulation p-5 transition-all duration-200 active:scale-[0.99] sm:p-6 sm:hover:-translate-y-1 sm:hover:shadow-blue-500/20"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Camera size={28} />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-gray-900">Capture Photos</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Use your device camera to photograph assets from multiple angles.
                  </p>
                  <div className="mt-4">
                    <Badge variant="default">
                      Max {configLoading ? '…' : maxImages} images
                    </Badge>
                  </div>
                </Card>

                <Card
                  hover
                  onClick={() => navigate('/upload')}
                  className="touch-manipulation p-5 transition-all duration-200 active:scale-[0.99] sm:p-6 sm:hover:-translate-y-1 sm:hover:shadow-blue-500/20"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Upload size={28} />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-gray-900">Upload Images</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop or browse files from your device storage.
                  </p>
                  <div className="mt-4">
                    <Badge variant="default">
                      Max {configLoading ? '…' : maxImages} images
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>
          </section>
        </PageWrapper>
      </HeroSection>
      <AppFooter />
    </div>
  );
}
