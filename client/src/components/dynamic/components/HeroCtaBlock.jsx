import { Link } from 'react-router-dom';
import styles from '../dynamic.module.css';

const HeroCtaBlock = ({ props = {} }) => {
  const { title, subtitle, actions = [] } = props;
  return (
    <div className={styles.heroContent}>
      {title ? <h1 className={styles.heading}>{title}</h1> : null}
      {subtitle ? <p className={styles.textBlock}>{subtitle}</p> : null}
      {actions.length ? (
        <div className={styles.ctaRow}>
          {actions.map((action) => (
            <Link
              key={`${action.label}-${action.to}`}
              to={action.to || '#'}
              className={`${styles.cta} ${action.variant === 'ghost' ? 'button button--ghost' : 'button'}`}
            >
              {action.label || 'Explorar'}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default HeroCtaBlock;
