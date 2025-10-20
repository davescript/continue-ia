import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Loader from '../../components/common/Loader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import styles from './Dashboard.module.css';

const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const searchMatch = (value = '', term = '') =>
  value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(
    term.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  );

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const {
    data: summary,
    loading: loadingSummary,
    error: errorSummary,
  } = useFetch(() => api.admin.getSummary(), []);

  const {
    data: products,
    loading: loadingProducts,
    error: errorProducts,
  } = useFetch(() => api.admin.products.list(), []);

  const { data: categories } = useFetch(() => api.admin.categories.list(), []);

  const {
    data: orders,
    loading: loadingOrders,
    error: errorOrders,
  } = useFetch(() => api.admin.getOrders(), []);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        searchMatch(product.name || '', searchTerm) ||
        searchMatch(product.sku || '', searchTerm) ||
        searchMatch(product.slug || '', searchTerm);

      const matchesCategory =
        categoryFilter === 'all' || product.category_id === Number(categoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const cards = [
    {
      key: 'revenue',
      title: 'Receita Total',
      value:
        summary && typeof summary.totalRevenue === 'number'
          ? currencyFormatter.format(summary.totalRevenue)
          : currencyFormatter.format(0),
      tone: 'blue',
      icon: <TrendingUp size={24} />,
    },
    {
      key: 'orders',
      title: 'Total de Pedidos',
      value: summary?.totalOrders ?? 0,
      tone: 'green',
      icon: <ShoppingCart size={24} />,
    },
    {
      key: 'products',
      title: 'Total de Produtos',
      value: summary?.totalProducts ?? 0,
      tone: 'purple',
      icon: <Package size={24} />,
    },
    {
      key: 'lowStock',
      title: 'Produtos com Baixo Estoque',
      value: summary?.lowStockCount ?? 0,
      tone: 'pink',
      icon: <AlertTriangle size={24} />,
    },
  ];

  const getStockStatusClass = (value) => {
    if (value <= 3) return styles.stockCritical;
    if (value <= 10) return styles.stockLow;
    return styles.stockOk;
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>
          Monitore indicadores-chave e acompanhe os produtos do portfólio em tempo real para uma
          operação sempre alinhada.
        </p>
      </header>

      {loadingSummary ? (
        <Loader message="Carregando indicadores..." />
      ) : errorSummary ? (
        <ErrorState message="Não foi possível carregar o resumo." />
      ) : (
        <div className={styles.cards}>
          {cards.map((card) => (
            <article key={card.key} className={`${styles.card} ${styles[card.tone]}`}>
              <div className={styles.cardIcon}>{card.icon}</div>
              <span className={styles.cardTitle}>{card.title}</span>
              <span className={styles.cardValue}>{card.value}</span>
            </article>
          ))}
        </div>
      )}

      <section className={styles.manageCard}>
        <div className={styles.manageHeader}>
          <div>
            <h2>Gerenciar Produtos</h2>
            <p>
              Utilize os filtros para localizar rapidamente itens, conferir estoque e tomar decisões
              estratégicas.
            </p>
          </div>
          <Link className={styles.addButton} to="/admin/produtos">
            + Adicionar Produto
          </Link>
        </div>

        <div className={styles.searchRow}>
          <input
            type="search"
            placeholder="Buscar por nome, ID ou SKU..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <select
            className={styles.select}
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">Todas as Categorias</option>
            {(categories || []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <span className={styles.resultsInfo}>
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </span>
        </div>

        {loadingProducts ? (
          <Loader message="Carregando produtos..." />
        ) : errorProducts ? (
          <ErrorState message="Não foi possível carregar os produtos." />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>SKU</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockValue =
                    product.stock_units === undefined || product.stock_units === null
                      ? 0
                      : Number(product.stock_units);

                  return (
                    <tr key={product.id}>
                      <td>
                        <span className={styles.idBadge}>
                          {product.sku || product.slug?.slice(0, 6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className={styles.productName}>
                          <span>{product.name}</span>
                          {product.featured ? (
                            <span className={styles.featuredBadge}>Destaque</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={styles.categoryBadge}>{product.category_name}</span>
                      </td>
                      <td>{currencyFormatter.format(product.price || 0)}</td>
                      <td>
                        <span
                          className={`${styles.stockBadge} ${getStockStatusClass(stockValue)}`}
                        >
                          {stockValue} unidades
                        </span>
                      </td>
                      <td>{product.sku || '—'}</td>
                      <td className={styles.description}>
                        {product.description || 'Sem descrição cadastrada.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.ordersCard}>
        <div className={styles.ordersHeader}>
          <h2>Pedidos Recentes</h2>
          <Link to="/admin/pedidos" className={styles.viewAll}>
            Ver todos
          </Link>
        </div>

        {loadingOrders ? (
          <Loader message="Carregando pedidos recentes..." />
        ) : errorOrders ? (
          <ErrorState message="Não foi possível carregar os pedidos." />
        ) : orders && orders.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID do Pedido</th>
                  <th>Cliente</th>
                  <th>Total estimado</th>
                  <th>Evento</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 3).map((order) => {
                  const totalEstimado =
                    Array.isArray(order.items) && order.items.length > 0
                      ? order.items.reduce(
                          (acc, item) => acc + (item.price ? Number(item.price) : 0) * (item.quantity || 1),
                          0
                        )
                      : null;
                  return (
                    <tr key={order.id}>
                      <td>
                        <span className={styles.idBadge}>#{order.protocol}</span>
                      </td>
                      <td>{order.customer_name}</td>
                      <td>
                        {totalEstimado
                          ? currencyFormatter.format(totalEstimado)
                          : 'Personalizado'}
                      </td>
                      <td>{order.event_type || 'Sob consulta'}</td>
                      <td>
                        {order.event_date
                          ? new Date(order.event_date).toLocaleDateString('pt-PT')
                          : 'A combinar'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">Nenhum pedido registrado ainda.</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
