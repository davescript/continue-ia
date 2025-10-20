import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Pencil, Trash2 } from 'lucide-react';
import api from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import styles from './Products.module.css';

const emptyForm = {
  id: null,
  name: '',
  category_id: '',
  price: '',
  sku: '',
  stock_units: '',
  featured: false,
  description: '',
  servings_min: '',
  servings_max: '',
  production_time: '',
  image_url: '',
  custom_options: '',
};

const parseCustomOptions = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState(emptyForm);
  const location = useLocation();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cats, prods] = await Promise.all([
        api.admin.categories.list(),
        api.admin.products.list(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');

    const payload = {
      name: form.name,
      category_id: form.category_id ? Number(form.category_id) : undefined,
      price: form.price,
      sku: form.sku || undefined,
      stock_units:
        form.stock_units === '' || form.stock_units === null || form.stock_units === undefined
          ? 0
          : Number(form.stock_units),
      description: form.description,
      servings_min: form.servings_min,
      servings_max: form.servings_max,
      production_time: form.production_time,
      image_url: form.image_url,
      featured: form.featured,
      custom_options: parseCustomOptions(form.custom_options),
    };

    try {
      if (form.id) {
        await api.admin.products.update(form.id, payload);
        setFeedback('Produto atualizado com sucesso!');
      } else {
        await api.admin.products.create(payload);
        setFeedback('Produto cadastrado com sucesso!');
      }
      await loadData();
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || 'Não foi possível salvar o produto.');
    } finally {
      setSaving(false);
    }
  };

  const populateForm = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      sku: product.sku || '',
      stock_units:
        product.stock_units === null || product.stock_units === undefined
          ? ''
          : product.stock_units,
      featured: product.featured,
      description: product.description || '',
      servings_min: product.servings_min || '',
      servings_max: product.servings_max || '',
      production_time: product.production_time || '',
      image_url: product.image_url || '',
      custom_options: product.custom_options
        ? JSON.stringify(product.custom_options, null, 2)
        : '',
    });
  };

  const handleEdit = (product) => {
    populateForm(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirma excluir este produto? Esta ação é irreversível.')) return;
    try {
      await api.admin.products.remove(id);
      setFeedback('Produto removido com sucesso!');
      if (form.id === id) {
        setForm(emptyForm);
      }
      loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível remover o produto.');
    }
  };

  useEffect(() => {
    const productId = location.state?.productId;
    if (!productId || !products.length) return;

    const product = products.find((item) => item.id === productId);
    if (product) {
      populateForm(product);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, products, navigate]);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <span className="badge">Gestão de portfólio</span>
        <h1 style={{ marginTop: '1rem' }}>Produtos & experiências</h1>
        <p className="text-muted" style={{ maxWidth: '620px', marginTop: '0.75rem' }}>
          Cadastre novos sabores, mantenha preços atualizados e destaque coleções que merecem
          visibilidade na vitrine principal.
        </p>
      </header>

      {error && !loading ? <ErrorState message={error} /> : null}
      {feedback ? (
        <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} color="var(--color-primary)" />
            {feedback}
          </span>
        </div>
      ) : null}

      {loading ? (
        <Loader message="Carregando catálogo..." />
      ) : (
        <div className={styles.layout}>
          <section className={styles.formCard}>
            <div>
              <h2>{form.id ? 'Editar produto' : 'Novo produto'}</h2>
              <p className="text-muted">
                Preencha as informações principais. Campos complementares ajudam a equipe comercial
                com detalhes técnicos.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  Nome
                </label>
                <input
                  id="name"
                  name="name"
                  className={styles.input}
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inline}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="category_id">
                    Categoria
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    className={styles.select}
                    value={form.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="price">
                    Preço de referência (R$)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    className={styles.input}
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="sku">
                    SKU
                  </label>
                  <input
                    id="sku"
                    name="sku"
                    className={styles.input}
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="Ex: PRD-001"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="stock_units">
                    Estoque (unidades)
                  </label>
                  <input
                    id="stock_units"
                    name="stock_units"
                    type="number"
                    min="0"
                    className={styles.input}
                    value={form.stock_units}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className={styles.inline}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="servings_min">
                    Convidados mín.
                  </label>
                  <input
                    id="servings_min"
                    name="servings_min"
                    type="number"
                    className={styles.input}
                    value={form.servings_min}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="servings_max">
                    Convidados máx.
                  </label>
                  <input
                    id="servings_max"
                    name="servings_max"
                    type="number"
                    className={styles.input}
                    value={form.servings_max}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="production_time">
                    Prazo de produção
                  </label>
                  <input
                    id="production_time"
                    name="production_time"
                    className={styles.input}
                    value={form.production_time}
                    onChange={handleChange}
                    placeholder="Ex: 7 dias úteis"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="image_url">
                  Imagem destaque (URL)
                </label>
                <input
                  id="image_url"
                  name="image_url"
                  className={styles.input}
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="description">
                  Descrição inspiracional
                </label>
                <textarea
                  id="description"
                  name="description"
                  className={styles.textarea}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Detalhe sabores, técnicas e diferenciais."
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="custom_options">
                  Personalização (JSON)
                </label>
                <textarea
                  id="custom_options"
                  name="custom_options"
                  className={styles.textarea}
                  value={form.custom_options}
                  onChange={handleChange}
                  placeholder='Ex: {"flavors":["Baunilha","Red Velvet"]}'
                />
              </div>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                />
                Destacar na home
              </label>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : form.id ? 'Atualizar produto' : 'Cadastrar produto'}
                </button>
                {form.id ? (
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonGhost}`}
                    onClick={() => setForm(emptyForm)}
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className={styles.tableCard}>
            <div>
              <h2>Catálogo publicado</h2>
              <p className="text-muted">
                Faça ajustes rápidos ou remova itens que não estão mais disponíveis.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>SKU</th>
                    <th>Prazo</th>
                    <th>Em destaque</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category_name}</td>
                      <td>
                        {Number(product.price).toLocaleString('pt-PT', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </td>
                      <td>
                        {product.stock_units ?? 0}{' '}
                        {product.stock_units === 1 ? 'unidade' : 'unidades'}
                      </td>
                      <td>{product.sku || '—'}</td>
                      <td>{product.production_time || 'Sob consulta'}</td>
                      <td>
                        {product.featured ? (
                          <span className={styles.tag}>Home</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonGhost}`}
                            onClick={() => handleEdit(product)}
                            title="Editar produto"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonDanger}`}
                            onClick={() => handleDelete(product.id)}
                            title="Excluir produto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ProductsAdmin;
