export function PageWrapper({ children, className = '', fullHeight = false }) {
  return (
    <main
      className={`mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-safe px-3 sm:px-6 lg:px-8 ${fullHeight ? 'min-h-[100dvh]' : 'pb-12 pb-safe'} ${className}`}
    >
      {children}
    </main>
  );
}
