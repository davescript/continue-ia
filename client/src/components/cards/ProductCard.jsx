import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import styles from './ProductCard.module.css';

const currency = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const ProductCard = ({ product }) => {
  if (!product) return null;

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={product.image_url} alt={product.name} loading="lazy" />
        {product.featured ? <span className={styles.featured}>Favorito das celebrações</span> : null}
      </div>
      <div className={styles.content}>
        <span className={styles.category}>{product.category_name}</span>
        <h3 className={styles.title}>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>

        <div className={styles.stats}>
          {product.servings_min ? (
            <span>
              Serve {product.servings_min}
              {product.servings_max ? ` a ${product.servings_max}` : ''} convidados
            </span>
          ) : null}
          {product.production_time ? <span>Produção: {product.production_time}</span> : null}
        </div>

        <div className={styles.stats}>
          <span className={styles.price}>{currency.format(product.price)}</span>
          <span>Personalização inclusa</span>
        </div>

        <Link className={styles.cta} to={`/produtos/${product.slug}`}>
          Explorar detalhes
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
};

export default ProductCard;
