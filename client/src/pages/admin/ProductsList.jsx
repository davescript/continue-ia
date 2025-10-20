import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Loader from '../../components/common/Loader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import styles from './ProductsList.module.css';

const slugToTitle = {
  all: 'Todos os Produtos',
  'bolos-artisticos': 'Bolos',
  'decoracao-de-festas': 'Decoração',
  'doces-finos': 'Cupcakes',
};

const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const ProductsList = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const currentSlug = slug || 'all';

  const {
    data: products,
    setData: setProducts,
    loading,
    error,
  } = useFetch(() => api.admin.products.list(), []);

  const { data: categories } = useFetch(() => api.admin.categories.list(), []);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (currentSlug === 'all') return products;
    return products.filter((product) => product.category_slug === currentSlug);
  }, [products, currentSlug]);

  const title = slugToTitle[currentSlug] || 'Produtos';

  const handleEdit = (product) => {
    navigate('/admin/produtos/novo', {
      state: { productId: product.id },
    });
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Confirmar a exclusão de "${product.name}"?`)) return;
    try {
      await api.admin.products.remove(product.id);
      setProducts((prev) => (Array.isArray(prev) ? prev.filter((item) => item.id !== product.id) : prev));
    } catch (err) {
      alert(err.message || 'Não foi possível remover o produto.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div>
          <h1>{title}</h1>
          <p>
            Visualize rapidamente os produtos cadastrados por categoria, monitore estoque e
            mantenha o catálogo sempre atualizado.
          </p>
        </div>
        <div className={styles.actions}>
          {slug ? (
            <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
              ← Voltar
            </button>
          ) : null}
          <Link
            to={slug ? '../novo' : 'novo'}
            relative="path"
            className={styles.addButton}
          >
            + Adicionar Produto
          </Link>
        </div>
      </div>

      {loading ? (
        <Loader message="Carregando produtos..." />
      ) : error ? (
        <ErrorState message="Não foi possível carregar os produtos." />
      ) : (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Gerenciar {title}</h2>
              <p className="text-muted">
                {currentSlug === 'all'
                  ? 'Todos os itens do catálogo em uma única visão.'
                  : `Categoria selecionada: ${
                      categories?.find((cat) => cat.slug === currentSlug)?.name || title
                    }.`}
              </p>
            </div>
            <span className={styles.countBadge}>
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      Nenhum produto encontrado para esta categoria.
                    </td>
                  </tr>
                ) : null}
                {filteredProducts.map((product) => {
                  const stockValue =
                    product.stock_units === null || product.stock_units === undefined
                      ? 0
                      : Number(product.stock_units);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className={styles.productTitle}>
                          <span>{product.name}</span>
                          {product.featured ? (
                            <span className={styles.featured}>Destaque</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={styles.categoryBadge}>
                          {slugToTitle[product.category_slug] || product.category_name}
                        </span>
                      </td>
                      <td className={styles.price}>{currencyFormatter.format(product.price || 0)}</td>
                      <td>
                        <span
                          className={`${styles.stockBadge} ${
                            stockValue <= 3
                              ? styles.stockCritical
                              : stockValue <= 10
                              ? styles.stockLow
                              : styles.stockOk
                          }`}
                        >
                          {stockValue} unidades
                        </span>
                      </td>
                      <td className={styles.description}>{product.description || '—'}</td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            type="button"
                            className={styles.iconButton}
                            onClick={() => handleEdit(product)}
                            title="Editar produto"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.delete}`}
                            onClick={() => handleDelete(product)}
                            title="Excluir produto"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
