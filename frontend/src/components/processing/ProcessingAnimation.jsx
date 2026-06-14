import { motion } from 'framer-motion';
import { LogoElementVideo } from '../layout/LogoElementVideo';

export function ProcessingAnimation() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute h-40 w-40 rounded-full bg-blue-400/20 blur-3xl sm:h-48 sm:w-48"
        animate={{ scale: [1, 1.1, 1], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      <div className="relative z-10">
        <LogoElementVideo className="h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72" />
      </div>
    </div>
  );
}

export function ShimmerProgressBar() {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div className="h-full w-full animate-shimmer bg-gradient-to-r from-blue-600 via-indigo-400 to-blue-600 bg-[length:200%_100%]" />
    </div>
  );
}
