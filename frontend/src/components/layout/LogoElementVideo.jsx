import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import logoElementVideo from '../../assets/AC-Logo-element-video_1_1_1.webm';

/** Near-white pixels → transparent so the logo sits on the aurora. */
function keyWhiteBackground(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const chroma = max - min;

    if (min >= 252 && chroma <= 8) {
      data[i + 3] = 0;
    } else if (min >= 228 && chroma <= 20) {
      const edge = (min - 228) / (252 - 228);
      data[i + 3] = Math.round(data[i + 3] * (1 - edge));
    }
  }
}

/**
 * Animated logo element rendered to canvas with white keyed out
 * (source WebM has no alpha channel).
 */
export function LogoElementVideo({
  className = 'h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52',
}) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!video || !canvas || !wrap) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let rafId = 0;
    let running = true;

    const syncCanvasSize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.round(width));
      const h = Math.max(1, Math.round(height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const drawFrame = () => {
      if (!running) return;

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        syncCanvasSize();
        const { width: cw, height: ch } = canvas;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const scale = Math.min(cw / vw, ch / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;

        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(video, dx, dy, dw, dh);
        const imageData = ctx.getImageData(0, 0, cw, ch);
        keyWhiteBackground(imageData.data);
        ctx.putImageData(imageData, 0, 0);
      }

      rafId = requestAnimationFrame(drawFrame);
    };

    const startPlayback = () => {
      video.play().catch(() => {});
      drawFrame();
    };

    video.addEventListener('loadeddata', startPlayback);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      startPlayback();
    }

    const resizeObserver = new ResizeObserver(syncCanvasSize);
    resizeObserver.observe(wrap);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      video.removeEventListener('loadeddata', startPlayback);
    };
  }, []);

  return (
    <div ref={wrapRef} className={cn('logo-element-video-wrap', className)}>
      <video
        ref={videoRef}
        src={logoElementVideo}
        autoPlay
        loop
        muted
        playsInline
        className="logo-element-video-source"
        aria-hidden="true"
      />
      <canvas ref={canvasRef} className="logo-element-video-canvas" aria-hidden="true" />
    </div>
  );
}
