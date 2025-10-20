import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionHeading from '../components/common/SectionHeading.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import ProductCard from '../components/cards/ProductCard.jsx';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import styles from './Products.module.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('categoria') || '';

  const {
    data: categories,
    loading: loadingCategories,
    error: errorCategories,
  } = useFetch(() => api.getCategories(), []);

  const {
    data: products,
    loading: loadingProducts,
    error: errorProducts,
  } = useFetch(
    () => api.getProducts(categorySlug ? { category: categorySlug } : {}),
    [categorySlug]
  );

  const totalProducts = useMemo(
    () =>
      (categories || []).reduce((total, category) => total + (category.product_count || 0), 0),
    [categories]
  );

  const filterOptions = useMemo(
    () =>
      [{ label: 'Todos', value: '', count: totalProducts }].concat(
        (categories || []).map((category) => ({
          label: category.name,
          value: category.slug,
          count: category.product_count,
        }))
      ),
    [categories, totalProducts]
  );

  const handleFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete('categoria');
    } else {
      next.set('categoria', value);
    }
    setSearchParams(next);
  };

  return (
    <div className="section">
      <div className="container">
        <div className={styles.intro}>
          <span className="badge">Bolos sob medida</span>
          <h1>Transforme seu briefing em um bolo autoral inesquecível.</h1>
          <p className="text-muted">
            Explore combinações de sabores, formatos e acabamentos para solicitar um orçamento
            personalizado. Cada criação é produzida sob encomenda, com agenda e entrega alinhadas ao
            seu evento.
          </p>
        </div>

        {loadingCategories ? (
          <Loader message="Carregando categorias..." />
        ) : errorCategories ? (
          <ErrorState message="Não foi possível carregar as categorias." />
        ) : (
          <div className={styles.filters}>
            {filterOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => handleFilter(option.value)}
              className={`${styles.filterButton} ${
                categorySlug === option.value ? styles.filterButtonActive : ''
              }`}
              >
                {option.label}
                {option.count !== undefined ? ` · ${option.count}` : ''}
              </button>
            ))}
          </div>
        )}

        <SectionHeading
          eyebrow="Consultoria criativa"
          title="Escolha uma base e personalize com sabores, recheios e estética."
          description="Após selecionar a criação, informe preferências e prazos para receber um orçamento detalhado e disponibilidade da equipe."
        />

        {loadingProducts ? (
          <Loader message="Preparando o menu completo..." />
        ) : errorProducts ? (
          <ErrorState message="Não foi possível carregar os produtos." />
        ) : products && products.length > 0 ? (
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>Em breve</h3>
            <p>
              Estamos desenvolvendo novas criações para essa categoria. Entre em contato para um
              projeto exclusivo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
