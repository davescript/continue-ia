import { useEffect, useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import api from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import styles from './Products.module.css';

const emptyTheme = {
  id: null,
  name: '',
  description: '',
  color_palette: '',
  image_url: '',
  trend_score: '',
};

const emptyGallery = {
  theme_id: '',
  title: '',
  description: '',
  image_url: '',
  event_type: '',
  palette: '',
  featured: false,
};

const parsePalette = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(',').map((color) => color.trim()).filter(Boolean);
};

const themesToString = (value) => {
  if (!value) return '';
  if (Array.isArray(value)) return value.join(', ');
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(', ') : '';
  } catch {
    return value;
  }
};

const ThemesAdmin = () => {
  const [themes, setThemes] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [themeForm, setThemeForm] = useState(emptyTheme);
  const [galleryForm, setGalleryForm] = useState(emptyGallery);
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingGallery, setSavingGallery] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [themesResponse, galleryResponse] = await Promise.all([
        api.admin.themes.list(),
        api.admin.gallery.list(),
      ]);
      setThemes(themesResponse);
      setGallery(galleryResponse);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar dados de temas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleThemeChange = (event) => {
    const { name, value } = event.target;
    setThemeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGalleryChange = (event) => {
    const { name, value, type, checked } = event.target;
    setGalleryForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const submitTheme = async (event) => {
    event.preventDefault();
    setSavingTheme(true);
    setError('');
    try {
      const payload = {
        name: themeForm.name,
        description: themeForm.description,
        image_url: themeForm.image_url,
        trend_score: themeForm.trend_score,
        color_palette: parsePalette(themeForm.color_palette),
      };
      if (themeForm.id) {
        await api.admin.themes.update(themeForm.id, payload);
      } else {
        await api.admin.themes.create(payload);
      }
      setThemeForm(emptyTheme);
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível salvar o tema.');
    } finally {
      setSavingTheme(false);
    }
  };

  const submitGallery = async (event) => {
    event.preventDefault();
    setSavingGallery(true);
    setError('');
    try {
      await api.admin.gallery.create({
        ...galleryForm,
        featured: galleryForm.featured,
      });
      setGalleryForm(emptyGallery);
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível salvar o item de portfólio.');
    } finally {
      setSavingGallery(false);
    }
  };

  const editTheme = (theme) => {
    setThemeForm({
      id: theme.id,
      name: theme.name,
      description: theme.description || '',
      color_palette: themesToString(theme.color_palette),
      image_url: theme.image_url || '',
      trend_score: theme.trend_score || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteTheme = async (id) => {
    if (!window.confirm('Excluir este tema removerá itens vinculados. Deseja continuar?')) return;
    try {
      await api.admin.themes.remove(id);
      if (themeForm.id === id) {
        setThemeForm(emptyTheme);
      }
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível excluir o tema.');
    }
  };

  const deleteGallery = async (id) => {
    if (!window.confirm('Deseja remover este item do portfólio?')) return;
    try {
      await api.admin.gallery.remove(id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível excluir o item.');
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <span className="badge">Curadoria de experiências</span>
        <h1 style={{ marginTop: '1rem' }}>Temas & portfólio visual</h1>
        <p className="text-muted" style={{ maxWidth: '620px', marginTop: '0.75rem' }}>
          Atualize a paleta dos projetos autorais, destaque cenários no portfólio e mantenha a
          narrativa visual alinhada à personalidade da marca.
        </p>
      </header>

      {error && !loading ? <ErrorState message={error} /> : null}

      {loading ? (
        <Loader message="Carregando experiências..." />
      ) : (
        <div className={styles.layout}>
          <section className={styles.formCard}>
            <div>
              <h2>{themeForm.id ? 'Editar tema' : 'Novo tema'}</h2>
              <p className="text-muted">
                Paletas ajudam a equipe de decoração e design a manter consistência visual.
              </p>
            </div>

            <form className={styles.form} onSubmit={submitTheme}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  Nome
                </label>
                <input
                  id="name"
                  name="name"
                  className={styles.input}
                  value={themeForm.name}
                  onChange={handleThemeChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="description">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  className={styles.textarea}
                  value={themeForm.description}
                  onChange={handleThemeChange}
                  placeholder="Resumo conceitual do tema."
                />
              </div>

              <div className={styles.inline}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="color_palette">
                    Paleta (separe por vírgulas)
                  </label>
                  <input
                    id="color_palette"
                    name="color_palette"
                    className={styles.input}
                    value={themeForm.color_palette}
                    onChange={handleThemeChange}
                    placeholder="#F5E6D3, #D9AAB7..."
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="trend_score">
                    Tendência
                  </label>
                  <input
                    id="trend_score"
                    name="trend_score"
                    type="number"
                    className={styles.input}
                    value={themeForm.trend_score}
                    onChange={handleThemeChange}
                    placeholder="0 - 100"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="image_url">
                  Imagem principal
                </label>
                <input
                  id="image_url"
                  name="image_url"
                  className={styles.input}
                  value={themeForm.image_url}
                  onChange={handleThemeChange}
                  placeholder="https://..."
                />
              </div>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  disabled={savingTheme}
                >
                  {savingTheme ? 'Salvando...' : themeForm.id ? 'Atualizar tema' : 'Cadastrar tema'}
                </button>
                {themeForm.id ? (
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonGhost}`}
                    onClick={() => setThemeForm(emptyTheme)}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>

            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tema</th>
                    <th>Paleta</th>
                    <th>Tendência</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {themes.map((theme) => (
                    <tr key={theme.id}>
                      <td>{theme.name}</td>
                      <td>{themesToString(theme.color_palette) || '—'}</td>
                      <td>{theme.trend_score}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonGhost}`}
                            onClick={() => editTheme(theme)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonDanger}`}
                            onClick={() => deleteTheme(theme.id)}
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

          <section className={styles.formCard}>
            <div>
              <h2>Portfólio visual</h2>
              <p className="text-muted">
                Cadastre registros fotográficos para inspirar clientes com projetos realizados.
              </p>
            </div>

            <form className={styles.form} onSubmit={submitGallery}>
              <div className={styles.inline}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="theme_id">
                    Tema relacionado
                  </label>
                  <select
                    id="theme_id"
                    name="theme_id"
                    className={styles.select}
                    value={galleryForm.theme_id}
                    onChange={handleGalleryChange}
                  >
                    <option value="">Sem vínculo</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="event_type">
                    Tipo de evento
                  </label>
                  <input
                    id="event_type"
                    name="event_type"
                    className={styles.input}
                    value={galleryForm.event_type}
                    onChange={handleGalleryChange}
                    placeholder="Casamento, Chá Revelação..."
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="title">
                  Título
                </label>
                <input
                  id="title"
                  name="title"
                  className={styles.input}
                  value={galleryForm.title}
                  onChange={handleGalleryChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="description">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  className={styles.textarea}
                  value={galleryForm.description}
                  onChange={handleGalleryChange}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="image_url">
                  Imagem (URL)
                </label>
                <input
                  id="image_url"
                  name="image_url"
                  className={styles.input}
                  value={galleryForm.image_url}
                  onChange={handleGalleryChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="palette">
                  Paleta textual
                </label>
                <input
                  id="palette"
                  name="palette"
                  className={styles.input}
                  value={galleryForm.palette}
                  onChange={handleGalleryChange}
                  placeholder="Verde oliva, nude, dourado"
                />
              </div>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="featured"
                  checked={galleryForm.featured}
                  onChange={handleGalleryChange}
                />
                Destacar no portfólio
              </label>

              <button
                type="submit"
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={savingGallery}
              >
                {savingGallery ? 'Salvando...' : 'Adicionar ao portfólio'}
              </button>
            </form>

            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Evento</th>
                    <th>Destaque</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {gallery.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.event_type || '—'}</td>
                      <td>{item.featured ? 'Sim' : 'Não'}</td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonDanger}`}
                          onClick={() => deleteGallery(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
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

export default ThemesAdmin;
