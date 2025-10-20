import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import styles from './TestimonialCard.module.css';

const TestimonialCard = ({ testimonial }) => {
  if (!testimonial) return null;

  const formattedDate = testimonial.event_date
    ? format(new Date(testimonial.event_date), "MMMM yyyy", { locale: pt })
    : null;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div>
          <span className={styles.event}>{testimonial.event_type}</span>
          <p className={styles.quote}>“{testimonial.feedback}”</p>
        </div>
        <span className={styles.rating}>
          <Star size={16} />
          {testimonial.rating.toFixed(1)}
        </span>
      </div>

      <div className={styles.author}>
        <span className={styles.name}>{testimonial.client_name}</span>
        {formattedDate ? <span className={styles.highlight}>{formattedDate}</span> : null}
        {testimonial.highlight ? (
          <span className={styles.highlight}>{testimonial.highlight}</span>
        ) : null}
      </div>
    </article>
  );
};

export default TestimonialCard;
