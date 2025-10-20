import { ShoppingBag } from 'lucide-react';
import styles from './AccessoryCard.module.css';
import { getAccessoryImage } from '../../utils/media.js';

const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const AccessoryCard = ({ accessory, onAdd }) => {
  const stock = accessory.stock_units ?? 0;
  const outOfStock = stock <= 0;

  const imageSrc = getAccessoryImage(accessory);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={imageSrc} alt={accessory.name} loading="lazy" />
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{accessory.name}</h3>
        <p className={styles.description}>{accessory.description}</p>
        <div className={styles.footer}>
          <div>
            <span className={styles.price}>{currencyFormatter.format(accessory.price || 0)}</span>
            <p className={`${styles.stock} ${outOfStock ? styles.outOfStock : ''}`}>
              {outOfStock ? 'Esgotado' : `${stock} unidades`}
            </p>
          </div>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => onAdd?.(accessory)}
            disabled={outOfStock || !onAdd}
          >
            <ShoppingBag size={18} />
            Adicionar
          </button>
        </div>
      </div>
    </article>
  );
};

export default AccessoryCard;
