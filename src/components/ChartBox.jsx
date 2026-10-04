import { useRef, useState, useEffect } from 'react';

export function ChartBox({ height, children, style }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setWidth(Math.floor(el.getBoundingClientRect().width));

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = entry.contentBoxSize
        ? (entry.contentBoxSize[0]?.inlineSize ?? el.getBoundingClientRect().width)
        : el.getBoundingClientRect().width;
      setWidth(Math.floor(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minWidth: 0,
        height,
        overflow: 'hidden',
        ...style,
      }}
    >
      {width > 0 && children(width, height)}
    </div>
  );
}
