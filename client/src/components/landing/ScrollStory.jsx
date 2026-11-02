import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { ChevronDown, Film } from 'lucide-react';

const FRAME_COUNT = 76;
const FRAME_PATH = (index) => `/frames/frame-${String(index + 1).padStart(3, '0')}.webp`;

const chapters = [
  {
    at: 0.02,
    end: 0.29,
    number: '00',
    kicker: 'The dough',
    title: ['Flour, water,', 'a little madness.'],
    accentWord: 'madness.',
    copy: 'Every theory starts with a simple truth: great dough cannot be rushed. We let it breathe, stretch it by hand and give it time to become something more.',
  },
  {
    at: 0.29,
    end: 0.53,
    number: '01',
    kicker: 'The base',
    title: ['San Marzano', 'meets mozzarella.'],
    accentWord: 'mozzarella.',
    copy: 'Slow-cooked tomatoes, torn mozzarella and a thread of olive oil. The holy trinity of a slice that needs nothing to hide behind.',
  },
  {
    at: 0.53,
    end: 0.78,
    number: '02',
    kicker: 'The fire',
    title: ['Then we let', 'the oven talk.'],
    accentWord: 'oven talk.',
    copy: 'High heat. A leopard-spotted crust. Toppings that blister at the edges while everything underneath stays soft, sweet and molten.',
  },
  {
    at: 0.78,
    end: 0.999,
    number: '03',
    kicker: 'The pull',
    title: ['The moment', 'it all stretches.'],
    accentWord: 'stretches.',
    copy: 'That first lift. The cheese resisting, then surrendering. This is the theory we have been testing all along — and it holds.',
  },
];

export default function ScrollStory({ onFinish }) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const frameRef = useRef(-1);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const inView = useInView(sectionRef, { margin: '600px 0px 600px 0px', once: true });

  const activeChapter = useMemo(() => {
    let index = 0;
    chapters.forEach((chapter, chapterIndex) => {
      if (progress >= chapter.at) index = chapterIndex;
    });
    return index;
  }, [progress]);

  useEffect(() => {
    if (!inView) return undefined;
    let cancelled = false;
    const images = new Array(FRAME_COUNT);
    let completed = 0;

    imagesRef.current = images;

    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const image = new Image();
      image.decoding = 'async';
      image.src = FRAME_PATH(index);
      image.onload = () => {
        if (cancelled) return;
        completed += 1;
        setLoaded(completed);
        if (completed === FRAME_COUNT) {
          setReady(true);
          drawFrame(progressRef.current);
        }
      };
      image.onerror = () => {
        if (cancelled) return;
        completed += 1;
        setLoaded(completed);
        if (completed === FRAME_COUNT) setReady(true);
      };
      images[index] = image;
    }

    return () => {
      cancelled = true;
    };
  }, [inView]);

  const drawFrame = (value) => {
    const canvas = canvasRef.current;
    const images = imagesRef.current;
    if (!canvas || !images?.length) return;
    const index = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(value * (FRAME_COUNT - 1))));
    if (frameRef.current === index) return;
    const image = images[index];
    if (!image?.complete) return;
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(
      image,
      (width - drawWidth) / 2,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
    frameRef.current = index;
  };

  useEffect(() => {
    if (!ready) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const value = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      progressRef.current = value;
      drawFrame(value);
      setProgress(value);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ready]);

  const chapter = chapters[activeChapter];
  const displayFrame = String(Math.round(progress * (FRAME_COUNT - 1)) + 1).padStart(3, '0');

  return (
    <section className="story-scroll" id="story" ref={sectionRef} aria-label="The Slice Theory story">
      <div className="story-sticky">
        <div className="story-glow" aria-hidden="true" />
        <div className="container story-topline">
          <span className="story-live">The making of a slice</span>
          <span className="story-frame-counter">
            Frame {displayFrame} / {FRAME_COUNT}
          </span>
        </div>

        <div className="story-canvas-wrap">
          <canvas ref={canvasRef} width="1280" height="720" className="story-canvas" aria-label="Pizza being assembled" />
        </div>

        <div className="story-copy">
          <div className="container story-copy__inner">
            <AnimatePresence mode="wait">
              <motion.article
                key={chapter.number}
                className={`story-chapter ${activeChapter % 2 === 1 ? 'story-chapter--right' : ''}`}
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="story-chapter__num">{chapter.number}</span>
                <p className="eyebrow eyebrow--yellow" style={{ marginBottom: 12 }}>
                  {chapter.kicker}
                </p>
                <h3>
                  {chapter.title.map((line) => (
                    <span key={line} style={{ display: 'block' }}>
                      {line === chapter.accentWord ? <em>{line}</em> : line}
                    </span>
                  ))}
                </h3>
                <p>{chapter.copy}</p>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>

        {!ready ? (
          <div className="story-preload">
            <Film size={14} />
            Warming up the reel
            <div className="story-preload__bar">
              <span style={{ width: `${Math.round((loaded / FRAME_COUNT) * 100)}%` }} />
            </div>
          </div>
        ) : null}

        <div className="story-progress" aria-hidden="true">
          <div className="story-progress__bar" style={{ transform: `scaleX(${Math.max(0.001, progress)})` }} />
        </div>

        <button className="story-skip" onClick={onFinish}>
          Skip the story
          <ChevronDown size={14} />
        </button>
      </div>
    </section>
  );
}
