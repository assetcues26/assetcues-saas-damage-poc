import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const MESSAGES = [
  'Stitching image views…',
  'Detecting asset tags…',
  'Reading barcodes…',
  'Analyzing condition…',
  'Generating intelligence report…',
];

export function StatusCycler({ intervalMs = 2500 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return (
    <div className="h-8 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="text-center text-base font-medium text-gray-700"
        >
          {MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
