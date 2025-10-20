import { Sparkles } from 'lucide-react';
import styles from './ThemeCard.module.css';

const ThemeCard = ({ theme }) => {
  if (!theme) return null;

  const palette = Array.isArray(theme.color_palette) ? theme.color_palette : [];
  const galleryPreview = Array.isArray(theme.relatedGallery)
    ? theme.relatedGallery.slice(0, 2)
    : [];

  return (
    <article className={styles.card}>
      <div className={styles.image}>
        <img src={theme.image_url} alt={theme.name} loading="lazy" />
        <span className={styles.trend}>
          <Sparkles size={16} />
          Tendência {theme.trend_score}
        </span>
      </div>

      <div className={styles.content}>
        <div>
          <h3 className={styles.title}>{theme.name}</h3>
          <p className={styles.description}>{theme.description}</p>
        </div>

        <div className={styles.palette}>
          {palette.map((color) => (
            <span key={color} className={styles.color} style={{ backgroundColor: color }} />
          ))}
        </div>

        {galleryPreview.length > 0 ? (
          <div className={styles.galleryPreview}>
            {galleryPreview.map((item) => (
              <span key={item.id}>
                {item.event_type} · {item.title}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default ThemeCard;
