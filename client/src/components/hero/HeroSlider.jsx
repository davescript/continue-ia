import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './HeroSlider.module.css';

const HeroSlider = ({ slides = [] }) => {
  const [active, setActive] = useState(0);
  const total = slides.length;

  const goTo = (index) => {
    if (!total) return;
    setActive((index + total) % total);
  };

  useEffect(() => {
    if (total <= 1) return undefined;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, 2000);

    return () => clearInterval(timer);
  }, [total]);

  const activeSlide = useMemo(() => slides[active] || null, [slides, active]);

  if (!activeSlide) return null;

  return (
    <section className={styles.slider} aria-label="Coleções em destaque">
      {slides.map((slide, index) => (
        <article
          key={slide.title}
          className={`${styles.slide} ${index === active ? styles.slideActive : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
          aria-hidden={index !== active}
        >
          <div className={styles.overlay} />
        </article>
      ))}

      <div className={styles.actions}>
        {(activeSlide.actions || []).map((action) => (
          <Link key={action.to} to={action.to} className={`${styles.cta} button`}>
            {action.label}
          </Link>
        ))}
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonPrev}`}
            onClick={() => goTo(active - 1)}
            aria-label="Slide anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonNext}`}
            onClick={() => goTo(active + 1)}
            aria-label="Próximo slide"
          >
            <ChevronRight size={24} />
          </button>

          <div className={styles.dots} role="tablist" aria-label="Selecionar slide">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                role="tab"
                aria-selected={index === active}
                className={`${styles.dot} ${index === active ? styles.dotActive : ''}`}
                onClick={() => goTo(index)}
              >
                <span className={styles.srOnly}>{slide.title}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

    </section>
  );
};

export default HeroSlider;
