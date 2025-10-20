import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, Users, Sparkles } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import ProductCard from '../components/cards/ProductCard.jsx';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import styles from './ProductDetails.module.css';

const currency = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const ProductDetails = () => {
  const { slug } = useParams();

  const {
    data: product,
    loading,
    error,
  } = useFetch(() => api.getProductBySlug(slug), [slug]);

  const customizationGroups = useMemo(() => {
    if (!product?.custom_options) return [];

    return Object.entries(product.custom_options).map(([title, options]) => ({
      title,
      options: Array.isArray(options) ? options : Object.values(options),
    }));
  }, [product]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className="container">
          <Loader message="Carregando detalhes do produto..." />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.wrapper}>
        <div className="container">
          <ErrorState message="Produto não encontrado ou indisponível." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className="container">
        <div className={styles.layout}>
          <div className={styles.imageWrapper}>
            <img src={product.image_url} alt={product.name} />
          </div>

          <div>
            <div className={styles.meta}>
              <span className="tag">{product.category_name}</span>
              {product.featured ? <span className="tag">Favorito</span> : null}
            </div>
            <h1>{product.name}</h1>
            <p className="text-muted">{product.description}</p>

            <div className={styles.price}>
              {currency.format(product.price)}{' '}
              <span style={{ fontSize: '1rem', color: 'var(--color-muted)', marginLeft: '0.5rem' }}>
                valores sob consulta conforme personalização
              </span>
            </div>

            <div className={styles.infoGrid}>
              <span className="text-muted">
                <Users size={16} />{' '}
                {product.servings_min
                  ? `Serve ${product.servings_min}${
                      product.servings_max ? ` a ${product.servings_max}` : ''
                    } convidados`
                  : 'Porções sob medida'}
              </span>
              {product.production_time ? (
                <span className="text-muted">
                  <CalendarDays size={16} /> Produção em {product.production_time}
                </span>
              ) : null}
            </div>

            <div className={styles.details}>
              {customizationGroups.length > 0 ? (
                <div className={styles.options}>
                  <h3>Personalização Leia Sabores</h3>
                  <p className="text-muted">
                    Combine sabores, texturas e acabamentos para traduzir a narrativa do seu evento.
                  </p>

                  {customizationGroups.map((group) => (
                    <div key={group.title} className={styles.optionGroup}>
                      <h4>{group.title}</h4>
                      <div className={styles.optionList}>
                        {group.options.map((option) => (
                          <span key={option} className={styles.optionItem}>
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className={styles.ctaCard}>
                <span className="badge">
                  <Sparkles size={16} />
                  Atendimento consultivo
                </span>
                <p>
                  Deseja harmonizar esse produto com doces, ambientação ou criar uma versão exclusiva?
                  Nossa equipe está pronta para desenhar o projeto ideal.
                </p>
                <div className={styles.ctaActions}>
                  <Link className="button" to="/contato">
                    Solicitar proposta personalizada
                  </Link>
                  <Link className="button button--ghost" to="/produtos">
                    Voltar ao catálogo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {product.related && product.related.length > 0 ? (
          <div className={styles.relatedSection}>
            <SectionHeading
              eyebrow="Talvez você goste"
              title="Projetos que harmonizam com essa criação."
              description="Sugestões que conversam com a mesma proposta estética e sensorial."
            />
            <div className="grid grid--three">
              {product.related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductDetails;
