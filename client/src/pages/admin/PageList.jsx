import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loader from '../../components/common/Loader.jsx';
import styles from './PageList.module.css';

const PageList = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', status: 'draft' });
  const navigate = useNavigate();

  const loadPages = () => {
    setLoading(true);
    setError(null);
    api.admin.pages
      .list()
      .then((data) => {
        setPages(data || []);
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar páginas.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title) return;
    setCreating(true);
    api.admin.pages
      .create(form)
      .then((page) => {
        setForm({ title: '', slug: '', status: 'draft' });
        loadPages();
        navigate(`/admin/paginas/${page.id}`);
      })
      .catch((err) => {
        setError(err.message || 'Não foi possível criar a página.');
      })
      .finally(() => setCreating(false));
  };

  const handleRemove = (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta página?')) return;
    api.admin.pages
      .remove(id)
      .then(() => {
        setPages((prev) => prev.filter((page) => page.id !== id));
      })
      .catch((err) => {
        setError(err.message || 'Não foi possível remover a página.');
      });
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1>Editor de páginas</h1>
        <p className="text-muted">Gerencie páginas dinâmicas e construa layouts reutilizáveis.</p>
      </header>

      <section className={styles.newPage}>
        <h2>Criar nova página</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Título *</span>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Slug</span>
            <input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="Opcional (será gerado automaticamente)"
            />
          </label>
          <label className={styles.field}>
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </label>
          <button type="submit" className="button" disabled={creating}>
            {creating ? 'Criando...' : 'Criar página'}
          </button>
        </form>
      </section>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <section className={styles.listSection}>
          <h2>Páginas existentes</h2>
          {pages.length === 0 ? (
            <p className="text-muted">Nenhuma página criada ainda.</p>
          ) : (
            <ul className={styles.list}>
              {pages.map((page) => (
                <li key={page.id} className={styles.listItem}>
                  <div>
                    <strong>{page.title}</strong>
                    <span className={styles.meta}>
                      /{page.slug} · {page.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    <Link className="button button--ghost" to={`/admin/paginas/${page.id}`}>
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => handleRemove(page.id)}
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

export default PageList;
