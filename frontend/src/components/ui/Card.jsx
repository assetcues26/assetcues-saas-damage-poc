import { motion } from 'framer-motion';

export function Card({ children, className = '', hover = false, onClick }) {
  const Component = onClick ? motion.button : motion.div;
  const props = onClick
    ? {
        type: 'button',
        onClick,
        whileHover: hover ? { y: -4 } : undefined,
        className: `w-full text-left ${className}`,
      }
    : { className };

  return (
    <Component
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border border-gray-200 bg-white shadow-xl ${hover ? 'transition-all duration-200 hover:border-gray-300 hover:shadow-blue-500/10' : ''} ${props.className}`}
      {...(onClick ? { onClick } : {})}
    >
      {children}
    </Component>
  );
}
