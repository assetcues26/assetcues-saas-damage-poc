import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { useFinePointer } from '@/hooks/useFinePointer';

const MouseEnterContext = createContext(undefined);

export function CardContainer({
  children,
  className,
  containerClassName,
  enableTilt = true,
}) {
  const containerRef = useRef(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const finePointer = useFinePointer();
  const tiltActive = enableTilt && finePointer;

  const handleMouseMove = (e) => {
    if (!tiltActive || !containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 40;
    const y = (e.clientY - top - height / 2) / 40;
    const clamp = (v, max) => Math.max(-max, Math.min(max, v));
    containerRef.current.style.transform = `rotateY(${clamp(x, 6)}deg) rotateX(${clamp(-y, 6)}deg)`;
  };

  const handleMouseEnter = () => {
    setIsMouseEntered(true);
  };

  const handleMouseLeave = () => {
    setIsMouseEntered(false);
    if (containerRef.current) {
      containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
    }
  };

  useEffect(() => {
    if (!tiltActive && containerRef.current) {
      containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
    }
  }, [tiltActive]);

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={cn(
          'flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden',
          containerClassName,
        )}
        style={{ perspective: '1000px' }}
      >
        <div
          ref={containerRef}
          onMouseEnter={tiltActive ? handleMouseEnter : undefined}
          onMouseMove={tiltActive ? handleMouseMove : undefined}
          onMouseLeave={tiltActive ? handleMouseLeave : undefined}
          className={cn(
            'relative flex w-full min-w-0 max-w-full items-center justify-center transition-all duration-200 ease-linear will-change-transform',
            className,
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
}

export function CardBody({ children, className }) {
  return (
    <div
      className={cn(
        'h-auto w-full min-w-0 [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardItem({
  as: Tag = 'div',
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}) {
  const ref = useRef(null);
  const context = useContext(MouseEnterContext);
  const isMouseEntered = context?.[0] ?? false;

  useEffect(() => {
    if (!ref.current) return;
    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.current.style.transform =
        'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    }
  }, [
    isMouseEntered,
    translateX,
    translateY,
    translateZ,
    rotateX,
    rotateY,
    rotateZ,
  ]);

  return (
    <Tag
      ref={ref}
      className={cn('transition duration-200 ease-linear', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function useMouseEnter() {
  const context = useContext(MouseEnterContext);
  if (context === undefined) {
    throw new Error('useMouseEnter must be used within CardContainer');
  }
  return context;
}
