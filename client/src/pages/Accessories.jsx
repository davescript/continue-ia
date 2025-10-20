import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionHeading from '../components/common/SectionHeading.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import AccessoryCard from '../components/cards/AccessoryCard.jsx';
import CartSummary from '../components/cart/CartSummary.jsx';
import api from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useCart } from '../context/useCart.js';
import styles from './Accessories.module.css';

const categoryBlueprint = [
  { label: 'Novidades', slug: 'novidades' },
  { label: 'Temas para Festas', slug: 'temas-para-festas' },
  { label: 'Balões', slug: 'baloes' },
  { label: 'Mesa de Festa', slug: 'mesa-de-festa' },
  { label: 'Acessórios para Bolos', slug: 'acessorios-para-bolos' },
  { label: 'Decoração', slug: 'decoracao' },
  { label: 'Acessórios', slug: 'acessorios' },
  { label: 'Cores', slug: 'cores' },
  { label: 'Pinturas', slug: 'pinturas' },
  { label: 'Ocasiões', slug: 'ocasioes' },
  { label: 'Festas Sazonais', slug: 'festas-sazonais' },
  { label: 'Prendas e Brindes', slug: 'prendas-brindes' },
];

const Accessories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || 'all');
  const { addItem, clearCart } = useCart();
  const status = searchParams.get('status');

  useEffect(() => {
    if (status === 'sucesso') {
      clearCart();
    }
  }, [status, clearCart]);

  const {
    data: categories,
    loading: loadingCategories,
    error: errorCategories,
  } = useFetch(() => api.getAccessoryCategories(), []);

  const inactiveCategory =
    selectedCategory !== 'all' && !categoriesBySlug.has(selectedCategory);

  const {
    data: accessories,
    loading: loadingAccessories,
    error: errorAccessories,
  } = useFetch(
    () =>
      api.getAccessories(
        selectedCategory === 'all' || inactiveCategory
          ? {}
          : { category: selectedCategory }
      ),
    [selectedCategory, inactiveCategory]
  );

  const totalAccessoryCount = useMemo(
    () => (categories || []).reduce((acc, category) => acc + (category.item_count || 0), 0),
    [categories]
  );

  const categoriesBySlug = useMemo(() => {
    const map = new Map();
    (categories || []).forEach((category) => {
      map.set(category.slug, category);
    });
    return map;
  }, [categories]);

  const filterOptions = useMemo(() => {
    const base = [
      {
        slug: 'all',
        label: 'Todos os produtos',
        count: totalAccessoryCount,
        active: true,
      },
    ];

    const structured = categoryBlueprint.map((item) => {
      const match = categoriesBySlug.get(item.slug);
      return {
        slug: item.slug,
        label: item.label,
        count: match?.item_count ?? 0,
        active: Boolean(match),
      };
    });

    return base.concat(structured);
  }, [categoriesBySlug, totalAccessoryCount]);

  const selectedOption = useMemo(
    () => filterOptions.find((option) => option.slug === selectedCategory),
    [filterOptions, selectedCategory]
  );

  return (
    <section className={`${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <SectionHeading
            eyebrow="Loja Leia Sabores"
            title="Acessórios e décor para completar a sua festa."
            description="Selecione peças assinatura, kits personalizados e utilitários premium para harmonizar com o projeto do seu evento em Portugal. Pagamento seguro online com Stripe."
            align="left"
          />
        </div>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <span>Categorias</span>
              {loadingCategories ? (
                <small className="text-muted">Atualizando…</small>
              ) : (
                <small className="text-muted">{totalAccessoryCount} produtos</small>
              )}
            </div>
            {errorCategories ? (
              <ErrorState message="Categorias indisponíveis." />
            ) : (
              <nav className={styles.filterNav} aria-label="Categorias de acessórios">
                {filterOptions.map((option) => (
                  <button
                    key={option.slug}
                    type="button"
                    className={`${styles.filterButton} ${
                      selectedCategory === option.slug ? styles.filterButtonActive : ''
                    } ${option.slug !== 'all' && !option.active ? styles.filterButtonDisabled : ''}`}
                    onClick={() => {
                      setSelectedCategory(option.slug);
                      const nextParams = new URLSearchParams(searchParams);
                      if (option.slug === 'all') nextParams.delete('categoria');
                      else nextParams.set('categoria', option.slug);
                      nextParams.delete('status');
                      setSearchParams(nextParams);
                    }}
                  >
                    <span>{option.label}</span>
                    <span className={styles.filterCount}>{option.count}</span>
                  </button>
                ))}
              </nav>
            )}
          </aside>

          <div className={styles.catalog}>
            {status === 'sucesso' ? (
              <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', borderLeft: '4px solid #16a34a' }}>
                <strong>Pedido confirmado!</strong>
                <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
                  Recebemos sua encomenda. Em breve nossa equipe entrará em contato para combinar a entrega.
                </p>
              </div>
            ) : null}
            {status === 'cancelado' ? (
              <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', borderLeft: '4px solid #f97316' }}>
                <strong>Pagamento cancelado.</strong>
                <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
                  O fluxo foi interrompido. Seu carrinho continua disponível para finalizar depois.
                </p>
              </div>
            ) : null}

            {loadingAccessories ? (
              <Loader message="Selecionando os melhores acessórios..." />
            ) : errorAccessories ? (
              inactiveCategory ? (
                <div className={styles.placeholder}>
                  <h3>Categoria sem produtos</h3>
                  <p className="text-muted">
                    Assim que adicionar itens à categoria{' '}
                    <strong>{selectedOption?.label || 'selecionada'}</strong>, eles aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                <ErrorState message="Não foi possível carregar os acessórios." />
              )
            ) : accessories && accessories.length > 0 ? (
              <div className={styles.grid}>
                {accessories.map((accessory) => (
                  <AccessoryCard
                    key={accessory.id}
                    accessory={accessory}
                    onAdd={(item) => addItem(item, 1)}
                  />
                ))}
              </div>
            ) : (
              <ErrorState message="Nenhum acessório disponível nessa categoria." />
            )}
          </div>

          <CartSummary />
        </div>
      </div>
    </section>
  );
};

export default Accessories;
