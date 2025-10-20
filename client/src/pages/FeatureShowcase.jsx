import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import AccessoryCard from '../components/cards/AccessoryCard.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useCart } from '../context/useCart.js';
import { getAccessoryImage } from '../utils/media.js';
import styles from './FeatureShowcase.module.css';

const FEATURE_CATEGORY = 'temas-para-festas';

const FeatureShowcase = () => {
  const { addItem } = useCart();
  const {
    data: themedAccessories,
    loading,
    error,
  } = useFetch(() => api.getAccessories({ category: FEATURE_CATEGORY }), []);

  const highlight = themedAccessories?.[0] || null;
  const related = useMemo(() => {
    if (!Array.isArray(themedAccessories)) return [];
    return themedAccessories.slice(1, 5);
  }, [themedAccessories]);

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <Loader message="Carregando coleção destaque..." />
        </div>
      </section>
    );
  }

  if (error || !highlight) {
    return (
      <section className="section">
        <div className="container">
          <ErrorState message="Não foi possível carregar a coleção destaque." />
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className={styles.hero}>
          <div className={styles.heroImage}>
            <img src={getAccessoryImage(highlight)} alt={highlight.name} />
            <span className={styles.badge}>Coleção destaque</span>
          </div>
          <div className={styles.heroContent}>
            <h1>{highlight.name}</h1>
            <p className="text-muted">{highlight.description}</p>
            <div className={styles.priceRow}>
              <span className={styles.price}>
                {highlight.price.toLocaleString('pt-PT', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </span>
              <button type="button" className="button" onClick={() => addItem(highlight, 1)}>
                Adicionar ao carrinho
              </button>
            </div>
            <p className="text-muted">
              Inclua os elementos desta coleção na sua festa ou personalize adicionando outros itens do catálogo.
            </p>
            <div className={styles.heroActions}>
              <Link className="button button--ghost" to="/acessorios">
                Ver catálogo completo
              </Link>
              <Link className="button" to={`/acessorios?categoria=${FEATURE_CATEGORY}`}>
                Ver mais temas
              </Link>
            </div>
          </div>
        </div>

        {related.length ? (
          <div className={styles.relatedSection}>
            <header className={styles.relatedHeader}>
              <h2>Outros itens da coleção</h2>
              <p className="text-muted">
                Combine com estes acessórios para criar um cenário completo e harmónico.
              </p>
            </header>
            <div className={styles.relatedGrid}>
              {related.map((item) => (
                <AccessoryCard key={item.id} accessory={item} onAdd={(acc) => addItem(acc, 1)} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default FeatureShowcase;
