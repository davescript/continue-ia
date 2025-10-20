import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import PageRenderer from '../../components/dynamic/PageRenderer.jsx';
import styles from './PageEditor.module.css';

const parseJSON = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('JSON inválido.');
  }
};

const stringifyJSON = (value) => {
  if (!value) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
};

const PageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingPage, setSavingPage] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [savingComponent, setSavingComponent] = useState(null);
  const [metaForm, setMetaForm] = useState({ title: '', slug: '', status: 'draft' });
  const [newSection, setNewSection] = useState({ type: 'stack', settings: '{}', position: '' });
  const [newComponents, setNewComponents] = useState({});
  const [reorderingSection, setReorderingSection] = useState(null);
  const [reorderingComponent, setReorderingComponent] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [versionsError, setVersionsError] = useState(null);
  const [versionComment, setVersionComment] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(null);

  const componentTemplates = useMemo(
    () => ({
      text: { text: 'Digite seu texto aqui.' },
      heading: { text: 'Título da seção', level: 2 },
      image: {
        src: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=800&q=80',
        alt: 'Imagem ilustrativa',
      },
      button: { label: 'Explorar agora', to: '/acessorios', variant: 'primary' },
      spacer: { size: '2rem' },
      'rich-text': { html: '<p>Texto com <strong>formatação</strong> e HTML.</p>' },
      video: { url: 'https://www.youtube.com/embed/ScMzIvxBSi4', title: 'Vídeo' },
      'product-grid': { category: 'novidades', limit: 4, heading: 'Produtos em destaque' },
      'hero-cta': {
        title: 'Título de destaque',
        subtitle: 'Subtítulo para complementar o hero.',
        actions: [
          { label: 'Explorar catálogo', to: '/acessorios' },
          { label: 'Coleção destaque', to: '/destaque', variant: 'ghost' },
        ],
      },
    }),
    []
  );

  const getNewComponentForm = useCallback(
    (type = 'text') => ({
      type,
      position: '',
      props: stringifyJSON(componentTemplates[type] || {}),
    }),
    [componentTemplates]
  );

  const applyPagePayload = useCallback((payload) => {
    if (!payload) return;
    setPage(payload);
    setMetaForm({ title: payload.title, slug: payload.slug, status: payload.status });
    setNewComponents({});
  }, []);

  const loadPage = useCallback(() => {
    setLoading(true);
    setError(null);
    api.admin.pages
      .get(id)
      .then((data) => {
        applyPagePayload(data);
      })
      .catch((err) => {
        setError(err.message || 'Não foi possível carregar a página.');
      })
      .finally(() => setLoading(false));
  }, [id, applyPagePayload]);

  const loadVersions = useCallback(() => {
    setLoadingVersions(true);
    setVersionsError(null);
    api.admin.pages.versions
      .list(id)
      .then((data) => setVersions(data || []))
      .catch((err) => setVersionsError(err.message || 'Erro ao carregar versões.'))
      .finally(() => setLoadingVersions(false));
  }, [id]);

  useEffect(() => {
    loadPage();
    loadVersions();
  }, [loadPage, loadVersions]);

  const sortedSections = useMemo(() => {
    if (!page) return [];
    return [...(page.sections || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [page]);

  const handleMetaSubmit = (event) => {
    event.preventDefault();
    setSavingPage(true);
    api.admin.pages
      .update(id, metaForm)
      .then((payload) => {
        applyPagePayload(payload);
      })
      .catch((err) => {
        setError(err.message || 'Não foi possível atualizar os dados da página.');
      })
      .finally(() => setSavingPage(false));
  };

  const handleCreateSection = (event) => {
    event.preventDefault();
    try {
      const settings = newSection.settings ? parseJSON(newSection.settings, {}) : {};
      const payload = {
        type: newSection.type || 'stack',
        position: newSection.position ? Number(newSection.position) : undefined,
        settings,
      };
      setSavingSection('new');
      api.admin.pages.sections
        .create(id, payload)
        .then(() => {
          setNewSection({ type: 'stack', settings: '{}', position: '' });
          loadPage();
        })
        .catch((err) => {
          setError(err.message || 'Não foi possível criar a seção.');
        })
        .finally(() => setSavingSection(null));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateSection = (sectionId, data) => {
    try {
      const payload = {
        type: data.type,
        position: data.position ? Number(data.position) : undefined,
        settings: data.settings ? parseJSON(data.settings, {}) : {},
      };
      setSavingSection(sectionId);
      api.admin.pages.sections
        .update(id, sectionId, payload)
        .then(() => loadPage())
        .catch((err) => setError(err.message || 'Não foi possível atualizar a seção.'))
        .finally(() => setSavingSection(null));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveSection = (sectionId) => {
    if (!window.confirm('Remover esta seção?')) return;
    api.admin.pages.sections
      .remove(id, sectionId)
      .then(() => loadPage())
      .catch((err) => setError(err.message || 'Não foi possível remover a seção.'));
  };

  const handleMoveSection = (sectionId, direction) => {
    setReorderingSection(sectionId);
    api.admin.pages.sections
      .move(id, sectionId, direction)
      .then((payload) => applyPagePayload(payload))
      .catch((err) => setError(err.message || 'Não foi possível reordenar a seção.'))
      .finally(() => setReorderingSection(null));
  };

  const handleCreateComponent = (sectionId, form) => {
    try {
      const payload = {
        type: form.type,
        position: form.position ? Number(form.position) : undefined,
        props: form.props ? parseJSON(form.props, {}) : {},
      };
    setSavingComponent(`new-${sectionId}`);
    api.admin.pages.components
      .create(id, sectionId, payload)
      .then(() => {
        setNewComponents((prev) => ({
          ...prev,
          [sectionId]: getNewComponentForm(),
        }));
        loadPage();
      })
      .catch((err) => setError(err.message || 'Não foi possível criar o componente.'))
      .finally(() => setSavingComponent(null));
  } catch (err) {
    setError(err.message);
  }
  };

  const handleUpdateComponent = (sectionId, componentId, form) => {
    try {
      const payload = {
        type: form.type,
        position: form.position ? Number(form.position) : undefined,
        props: form.props ? parseJSON(form.props, {}) : {},
      };
      setSavingComponent(componentId);
      api.admin.pages.components
        .update(id, sectionId, componentId, payload)
        .then(() => loadPage())
        .catch((err) => setError(err.message || 'Não foi possível atualizar o componente.'))
        .finally(() => setSavingComponent(null));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveComponent = (sectionId, componentId) => {
    if (!window.confirm('Remover este componente?')) return;
    api.admin.pages.components
      .remove(id, sectionId, componentId)
      .then(() => loadPage())
      .catch((err) => setError(err.message || 'Não foi possível remover o componente.'));
  };

  const handleMoveComponent = (sectionId, componentId, direction) => {
    setReorderingComponent(componentId);
    api.admin.pages.components
      .move(id, sectionId, componentId, direction)
      .then((payload) => applyPagePayload(payload))
      .catch((err) => setError(err.message || 'Não foi possível reordenar o componente.'))
      .finally(() => setReorderingComponent(null));
  };

  const handleSaveVersion = (event) => {
    event.preventDefault();
    setSavingVersion(true);
    setVersionsError(null);
    api.admin.pages.versions
      .create(id, { comment: versionComment })
      .then(() => {
        setVersionComment('');
        loadVersions();
      })
      .catch((err) => setVersionsError(err.message || 'Não foi possível salvar a versão.'))
      .finally(() => setSavingVersion(false));
  };

  const handleRestoreVersion = (versionId) => {
    setRestoringVersion(versionId);
    setVersionsError(null);
    api.admin.pages.versions
      .restore(id, versionId)
      .then((payload) => {
        applyPagePayload(payload);
        loadVersions();
      })
      .catch((err) => setVersionsError(err.message || 'Não foi possível restaurar a versão.'))
      .finally(() => setRestoringVersion(null));
  };

  const handleDeleteVersion = (versionId) => {
    if (!window.confirm('Deseja remover esta versão?')) return;
    setVersionsError(null);
    api.admin.pages.versions
      .remove(id, versionId)
      .then(() => loadVersions())
      .catch((err) => setVersionsError(err.message || 'Não foi possível remover a versão.'));
  };

  const duplicatePage = () => {
    if (!page) return;
    const newTitle = `${page.title} (cópia)`;
    setSavingPage(true);
    api.admin.pages
      .create({ title: newTitle, status: 'draft' })
      .then((created) => {
        const clonePromises = sortedSections.map((section) =>
          api.admin.pages.sections.create(created.id, {
            type: section.type,
            position: section.position,
            settings: section.settings,
          }).then((newSection) =>
            Promise.all(
              (section.components || []).map((component) =>
                api.admin.pages.components.create(created.id, newSection.id, {
                  type: component.type,
                  position: component.position,
                  props: component.props,
                })
              )
            )
          )
        );
        return Promise.all(clonePromises).then(() => created);
      })
      .then((created) => {
        navigate(`/admin/paginas/${created.id}`);
      })
      .catch((err) => setError(err.message || 'Não foi possível duplicar a página.'))
      .finally(() => setSavingPage(false));
  };

  if (loading) {
    return <Loader message="Carregando página..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!page) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <button type="button" className="button button--ghost" onClick={() => navigate(-1)}>
            Voltar
          </button>
          <h1>Edição: {page.title}</h1>
          <p className="text-muted">Ajuste os blocos e visualize em tempo real.</p>
        </div>
        <button type="button" className="button button--ghost" onClick={duplicatePage} disabled={savingPage}>
          Duplicar página
        </button>
      </header>

      <section className={styles.metaSection}>
        <h2>Configurações da página</h2>
        <form className={styles.form} onSubmit={handleMetaSubmit}>
          <label className={styles.field}>
            <span>Título *</span>
            <input
              value={metaForm.title}
              onChange={(event) => setMetaForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Slug</span>
            <input
              value={metaForm.slug}
              onChange={(event) => setMetaForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="ex.: pagina-exemplo"
            />
          </label>
          <label className={styles.field}>
            <span>Status</span>
            <select
              value={metaForm.status}
              onChange={(event) => setMetaForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </label>
          <button type="submit" className="button" disabled={savingPage}>
            {savingPage ? 'Salvando...' : 'Salvar informações'}
          </button>
        </form>
      </section>

      <section className={styles.builder}>
        <div className={styles.structure}>
          <div className={styles.sectionHeader}>
            <h2>Seções</h2>
            <form className={styles.newSectionForm} onSubmit={handleCreateSection}>
              <select
                value={newSection.type}
                onChange={(event) => setNewSection((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option value="hero">Hero</option>
                <option value="stack">Bloco em coluna</option>
                <option value="grid">Grid</option>
              </select>
              <input
                value={newSection.position}
                onChange={(event) => setNewSection((prev) => ({ ...prev, position: event.target.value }))}
                placeholder="Posição"
                type="number"
                min="1"
              />
              <textarea
                value={newSection.settings}
                onChange={(event) => setNewSection((prev) => ({ ...prev, settings: event.target.value }))}
                placeholder="Configurações (JSON)"
                rows={2}
              />
              <button type="submit" className="button" disabled={savingSection === 'new'}>
                {savingSection === 'new' ? 'Adicionando...' : 'Adicionar seção'}
              </button>
            </form>
          </div>

          <div className={styles.sectionList}>
            {sortedSections.length === 0 ? (
              <p className="text-muted">Nenhuma seção criada ainda.</p>
            ) : (
              sortedSections.map((section, index) => {
                const componentForm = newComponents[section.id] || getNewComponentForm();
                const components = section.components || [];
                const componentCount = components.length;
                return (
                  <div key={section.id} className={styles.sectionItem}>
                    <div className={styles.sectionToolbar}>
                      <strong>
                        {section.type} · posição {section.position ?? '-'} · ID {section.id}
                      </strong>
                      <div className={styles.toolbarButtons}>
                        <button
                          type="button"
                          className="button button--ghost"
                          onClick={() => handleMoveSection(section.id, 'up')}
                          disabled={reorderingSection === section.id || index === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="button button--ghost"
                          onClick={() => handleMoveSection(section.id, 'down')}
                          disabled={
                            reorderingSection === section.id || index === sortedSections.length - 1
                          }
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="button button--ghost"
                          onClick={() => handleRemoveSection(section.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                    <form
                      className={styles.sectionForm}
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        handleUpdateSection(section.id, {
                          type: formData.get('type'),
                          position: formData.get('position'),
                          settings: formData.get('settings'),
                        });
                      }}
                    >
                      <label>
                        <span>Tipo</span>
                        <select name="type" defaultValue={section.type}>
                          <option value="hero">Hero</option>
                          <option value="stack">Bloco em coluna</option>
                          <option value="grid">Grid</option>
                        </select>
                      </label>
                      <label>
                        <span>Posição</span>
                        <input name="position" type="number" defaultValue={section.position ?? ''} />
                      </label>
                      <label>
                        <span>Configurações (JSON)</span>
                        <textarea name="settings" rows={3} defaultValue={stringifyJSON(section.settings)} />
                      </label>
                      <button type="submit" className="button button--ghost" disabled={savingSection === section.id}>
                        {savingSection === section.id ? 'Salvando...' : 'Salvar seção'}
                      </button>
                    </form>

                    <div className={styles.componentList}>
                      <h3>Componentes</h3>
                      {componentCount === 0 ? (
                        <p className="text-muted">Nenhum componente adicionado.</p>
                      ) : (
                        <ul className={styles.componentItems}>
                          {components.map((component, componentIndex) => (
                            <li key={component.id} className={styles.componentItem}>
                              <div className={styles.componentToolbar}>
                                <strong>
                                  {component.type} · posição {component.position ?? '-'} · ID {component.id}
                                </strong>
                                <div className={styles.toolbarButtons}>
                                  <button
                                    type="button"
                                    className="button button--ghost"
                                    onClick={() => handleMoveComponent(section.id, component.id, 'up')}
                                    disabled={
                                      reorderingComponent === component.id || componentIndex === 0
                                    }
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="button button--ghost"
                                    onClick={() => handleMoveComponent(section.id, component.id, 'down')}
                                    disabled={
                                      reorderingComponent === component.id ||
                                      componentIndex === componentCount - 1
                                    }
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    className="button button--ghost"
                                    onClick={() => handleRemoveComponent(section.id, component.id)}
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                              <form
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  const data = new FormData(event.currentTarget);
                                  handleUpdateComponent(section.id, component.id, {
                                    type: data.get('type'),
                                    position: data.get('position'),
                                    props: data.get('props'),
                                  });
                                }}
                                className={styles.componentForm}
                              >
                                <label>
                                  <span>Tipo</span>
                              <select name="type" defaultValue={component.type}>
                                <option value="text">Texto</option>
                                <option value="heading">Título</option>
                                <option value="image">Imagem</option>
                                <option value="button">Botão</option>
                                <option value="spacer">Espaçamento</option>
                                <option value="rich-text">Rich text</option>
                                <option value="video">Vídeo</option>
                                <option value="product-grid">Grid de produtos</option>
                                <option value="hero-cta">Hero CTA</option>
                              </select>
                                </label>
                                <label>
                                  <span>Posição</span>
                                  <input name="position" type="number" defaultValue={component.position ?? ''} />
                                </label>
                                <label>
                                  <span>Propriedades (JSON)</span>
                                  <textarea name="props" rows={3} defaultValue={stringifyJSON(component.props)} />
                                </label>
                                <button
                                  type="submit"
                                  className="button button--ghost"
                                  disabled={savingComponent === component.id}
                                >
                                  {savingComponent === component.id ? 'Salvando...' : 'Salvar componente'}
                                </button>
                              </form>
                            </li>
                          ))}
                        </ul>
                      )}

                      <form
                        className={styles.newComponentForm}
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleCreateComponent(section.id, newComponents[section.id] || getNewComponentForm());
                        }}
                      >
                        <h4>Adicionar componente</h4>
                        <select
                          value={componentForm.type}
                          onChange={(event) =>
                            setNewComponents((prev) => {
                              const nextType = event.target.value;
                              const current = prev[section.id] || getNewComponentForm();
                              return {
                                ...prev,
                                [section.id]: {
                                  ...current,
                                  type: nextType,
                                  props: stringifyJSON(componentTemplates[nextType] || {}),
                                },
                              };
                            })
                          }
                        >
                          <option value="text">Texto</option>
                          <option value="heading">Título</option>
                          <option value="image">Imagem</option>
                          <option value="button">Botão</option>
                          <option value="spacer">Espaçamento</option>
                          <option value="rich-text">Rich text</option>
                          <option value="video">Vídeo</option>
                          <option value="product-grid">Grid de produtos</option>
                          <option value="hero-cta">Hero CTA</option>
                        </select>
                        <input
                          value={componentForm.position}
                          onChange={(event) =>
                            setNewComponents((prev) => ({
                              ...prev,
                              [section.id]: {
                                ...(prev[section.id] || getNewComponentForm()),
                                position: event.target.value,
                              },
                            }))
                          }
                          placeholder="Posição"
                          type="number"
                        />
                        <textarea
                          value={componentForm.props}
                          onChange={(event) =>
                            setNewComponents((prev) => ({
                              ...prev,
                              [section.id]: {
                                ...(prev[section.id] || getNewComponentForm()),
                                props: event.target.value,
                              },
                            }))
                          }
                          placeholder='Propriedades (JSON), ex: {"text":"Olá"}'
                          rows={2}
                        />
                        <button
                          type="submit"
                          className="button"
                          disabled={savingComponent === `new-${section.id}`}
                        >
                          {savingComponent === `new-${section.id}` ? 'Adicionando...' : 'Adicionar componente'}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.preview}>
          <h2>Pré-visualização</h2>
          <div className={styles.previewCanvas}>
            <PageRenderer page={page} />
          </div>
        </div>
      </section>

      <section className={styles.versionSection}>
        <div className={styles.versionHeader}>
          <h2>Versionamento</h2>
          <form className={styles.versionForm} onSubmit={handleSaveVersion}>
            <input
              value={versionComment}
              onChange={(event) => setVersionComment(event.target.value)}
              placeholder="Comentário (opcional)"
            />
            <button type="submit" className="button" disabled={savingVersion}>
              {savingVersion ? 'Salvando...' : 'Salvar versão atual'}
            </button>
          </form>
        </div>

        {loadingVersions ? (
          <Loader message="Carregando versões..." />
        ) : versionsError ? (
          <ErrorState message={versionsError} />
        ) : versions.length === 0 ? (
          <p className="text-muted">Ainda não existem versões salvas.</p>
        ) : (
          <ul className={styles.versionsList}>
            {versions.map((version) => (
              <li key={version.id} className={styles.versionItem}>
                <div>
                  <strong>{new Date(version.created_at).toLocaleString('pt-PT')}</strong>
                  {version.comment ? <p className="text-muted">{version.comment}</p> : null}
                </div>
                <div className={styles.versionActions}>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => handleRestoreVersion(version.id)}
                    disabled={restoringVersion === version.id}
                  >
                    {restoringVersion === version.id ? 'Restaurando...' : 'Restaurar'}
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => handleDeleteVersion(version.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default PageEditor;
