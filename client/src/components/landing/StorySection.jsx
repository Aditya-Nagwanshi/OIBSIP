import { motion } from 'framer-motion';
import { ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: '01',
    kicker: 'The dough',
    title: 'Flour, water, main character energy.',
    copy: 'A 48-hour cold ferment. Slow rise, zero shortcuts. The crust has trust issues and honestly, same.',
  },
  {
    number: '02',
    kicker: 'The sauce',
    title: 'Tomato girl summer, all year round.',
    copy: 'San Marzano tomatoes, torn mozzarella and a scandalous amount of basil. Built by hand, one layer at a time.',
  },
  {
    number: '03',
    kicker: 'The fire',
    title: 'Ninety seconds of beautiful chaos.',
    copy: 'A 450°C stone, a blistered rim and completely molten cheese. The kitchen starts smelling like your best decision this week.',
  },
  {
    number: '04',
    kicker: 'The pull',
    title: 'The proof is in the stretch.',
    copy: 'A clean lift, a long cheese pull and a table that goes quiet. Bring napkins. Bring your camera. Bring both.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.06, duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function StorySection() {
  return (
    <section className="lux-section lux-method" id="story" aria-label="How a Slice Theory is made">
      <div className="container">
        <div className="lux-head lux-head--split">
          <div>
            <p className="lux-eyebrow"><span className="lux-eyebrow__line" /> The making of a slice</p>
            <h2 className="lux-h2">No skips. <em>Just the plot.</em></h2>
          </div>
          <p className="lux-head__aside">
            Four steps, zero buffering, one very dramatic cheese pull. This is how a theory gets
            from cold dough to main character.
          </p>
        </div>

        <div className="lux-method__grid">
          <motion.figure
            className="lux-method__media"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <img
              src="/media/cinematic/margherita-stretch.webp"
              alt="A margherita pizza being lifted with a long cheese pull"
              loading="lazy"
            />
            <span className="lux-method__sticker">certified saucy</span>
            <figcaption className="lux-method__caption">
              <span><Flame size={13} /> 48h dough · 450°C · 90 sec</span>
              <strong>No shortcuts, just sauce.</strong>
            </figcaption>
          </motion.figure>

          <div className="lux-method__steps">
            {steps.map((step, index) => (
              <motion.article
                className="lux-method__step"
                key={step.number}
                variants={fadeUp}
                custom={index}
                initial="hidden"
                whileInView="visible"
                whileHover={{ y: -5, rotateX: 2, rotateY: index % 2 === 0 ? -2.5 : 2.5, rotate: index % 2 === 0 ? -1 : 1 }}
                style={{ transformPerspective: 900 }}
                viewport={{ once: true, margin: '-60px' }}
              >
                <span className="lux-method__number">{step.number}</span>
                <div>
                  <span className="lux-method__chip">{step.kicker}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="lux-method__foot">
          <p>Scroll-free zone. The only thing stretching here is the cheese.</p>
          <Link to="/build" className="lux-textlink">
            Start your own theory <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
