import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';

const STORY_VIDEO = '/media/1103-story.mp4';
const STORY_POSTER = '/media/1103-story-poster.webp';

const chapters = [
  {
    number: '01',
    kicker: 'The dough',
    title: 'Flour, water,',
    accent: 'and patience.',
    copy: 'A 48-hour cold ferment. A slow rise, a quiet kitchen and a dough that refuses to be rushed. It has trust issues. We respect that.',
  },
  {
    number: '02',
    kicker: 'The build',
    title: 'Sauce first.',
    accent: 'Then the storm.',
    copy: 'San Marzano tomatoes, torn mozzarella and a scandalous amount of basil. Built by hand, one deliberate layer at a time. The pineapple stays outside.',
  },
  {
    number: '03',
    kicker: 'The fire',
    title: 'Ninety seconds',
    accent: 'at 450°C.',
    copy: 'The stone takes over. The rim blisters, the cheese turns molten and the kitchen starts smelling like your best decision of the week.',
  },
  {
    number: '04',
    kicker: 'The proof',
    title: 'The proof is',
    accent: 'in the stretch.',
    copy: 'A clean lift. A long cheese pull. The crust holds, the table goes quiet, and the theory is finally ready to be tested. Bring napkins.',
  },
];

const clamp01 = (value) => Math.min(1, Math.max(0, value));

function formatTime(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const remainder = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export default function ScrollStory() {
  const sectionRef = useRef(null);
  const mediaRef = useRef(null);
  const videoRef = useRef(null);
  const timeRef = useRef(null);
  const railFillRef = useRef(null);
  const chapterRef = useRef(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const inView = useInView(sectionRef, { margin: '220px 0px 220px 0px' });

  const chapter = useMemo(() => chapters[activeChapter], [activeChapter]);

  useEffect(() => {
    if (!inView) return undefined;

    const section = sectionRef.current;
    const media = mediaRef.current;
    const video = videoRef.current;
    if (!section || !media || !video) return undefined;

    let smooth = 0;
    let pointerX = 0;
    let pointerY = 0;
    let easedX = 0;
    let easedY = 0;
    let raf = 0;
    let lastSeek = -1;

    const readProgress = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      return total > 0 ? clamp01(-rect.top / total) : 0;
    };

    const tick = () => {
      const target = readProgress();
      smooth += (target - smooth) * 0.1;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;

      if (duration) {
        const nextTime = smooth * Math.max(0, duration - 0.06);
        if (Math.abs(nextTime - lastSeek) > 1 / 60) {
          lastSeek = nextTime;
          if (typeof video.fastSeek === 'function') video.fastSeek(nextTime);
          else video.currentTime = nextTime;
        }
        if (timeRef.current) timeRef.current.textContent = formatTime(nextTime);
      }

      const nextChapter = smooth >= 0.75 ? 3 : smooth >= 0.5 ? 2 : smooth >= 0.25 ? 1 : 0;
      if (nextChapter !== chapterRef.current) {
        chapterRef.current = nextChapter;
        setActiveChapter(nextChapter);
      }

      easedX += (pointerX - easedX) * 0.06;
      easedY += (pointerY - easedY) * 0.06;
      media.style.transform = `perspective(1400px) rotateX(${(-easedY * 1.4).toFixed(3)}deg) rotateY(${(easedX * 1.8).toFixed(3)}deg) translate3d(${(easedX * 16).toFixed(2)}px, ${(easedY * 12).toFixed(2)}px, 0) scale(1.07)`;

      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleY(${Math.max(0.015, smooth)})`;
      }

      raf = requestAnimationFrame(tick);
    };

    const onPointerMove = (event) => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };

    const onPointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };

    const onMetadata = () => {
      if (timeRef.current) timeRef.current.textContent = '00:00';
      video.pause();
    };

    video.addEventListener('loadedmetadata', onMetadata);
    section.addEventListener('pointermove', onPointerMove, { passive: true });
    section.addEventListener('pointerleave', onPointerLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('loadedmetadata', onMetadata);
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [inView]);

  return (
    <section className="craft" id="story" ref={sectionRef} aria-label="The making of a slice, a scroll film">
      <div className="craft__sticky">
        <div className="craft__viewport">
          <div className="craft__media" ref={mediaRef}>
            <video
              ref={videoRef}
              className="craft__video"
              src={STORY_VIDEO}
              poster={STORY_POSTER}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />
            <div className="craft__shade" aria-hidden="true" />
          </div>
        </div>

        <div className="craft__top container">
          <p className="craft__label">
            <span className="craft__live-dot" />
            The making of a slice
          </p>
          <p className="craft__counter">
            <span ref={timeRef}>00:00</span>
            <span className="craft__counter-total">/ 00:34</span>
          </p>
        </div>

        <div className="craft__copy container">
          <AnimatePresence mode="wait">
            <motion.article
              key={chapter.number}
              className="craft__chapter"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="craft__kicker">
                <span>{chapter.number}</span>
                {chapter.kicker}
              </p>
              <h2>
                {chapter.title}
                <em>{chapter.accent}</em>
              </h2>
              <p className="craft__body">{chapter.copy}</p>
            </motion.article>
          </AnimatePresence>
        </div>

        <div className="craft__rail" aria-hidden="true">
          <div className="craft__rail-track">
            <span className="craft__rail-fill" ref={railFillRef} />
          </div>
          <div className="craft__rail-labels">
            {chapters.map((entry, index) => (
              <span key={entry.number} className={index <= activeChapter ? 'is-on' : ''}>
                {entry.number}
              </span>
            ))}
          </div>
        </div>

        <p className="craft__hint container">Scroll to bake · move your cursor to look around</p>
      </div>
    </section>
  );
}
