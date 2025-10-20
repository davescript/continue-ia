import { useEffect, useState } from 'react';
import styles from '../dynamic.module.css';
import { api } from '../../../services/api.js';

const ProductGridBlock = ({ props = {} }) => {
  const { category, limit = 4, heading, showPrices = true } = props;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api
      .getAccessories(category ? { category, limit } : { limit })
      .then((data) => {
        if (active) {
          setItems(Array.isArray(data) ? data.slice(0, limit) : []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Não foi possível carregar os produtos.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [category, limit]);

  if (loading) {
    return <p className={styles.textBlock}>Carregando produtos...</p>;
  }

  if (error) {
    return <p className={styles.textBlock}>{error}</p>;
  }

  if (!items.length) {
    return <p className={styles.textBlock}>Nenhum produto encontrado.</p>;
  }

  return (
    <div className={styles.productGrid}>
      {heading ? <h3 className={styles.heading}>{heading}</h3> : null}
      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.id} className={styles.productCard}>
            <div className={styles.productImage}>
              <img src={item.image_url} alt={item.name} />
            </div>
            <div className={styles.productBody}>
              <strong>{item.name}</strong>
              {showPrices ? (
                <span className={styles.productPrice}>
                  {Number(item.price || 0).toLocaleString('pt-PT', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGridBlock;
