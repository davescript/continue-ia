import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import styles from './Products.module.css';

const emptyPost = {
  title: '',
  excerpt: '',
  content: '',
  author: '',
  image_url: '',
  published_at: '',
  reading_time: '',
};

const emptyFaq = {
  category: '',
  question: '',
  answer: '',
};

const ContentAdmin = () => {
  const [posts, setPosts] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [postForm, setPostForm] = useState(emptyPost);
  const [faqForm, setFaqForm] = useState(emptyFaq);
  const [loading, setLoading] = useState(true);
  const [savingPost, setSavingPost] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [blogResponse, faqsResponse] = await Promise.all([
        api.admin.blog.list(),
        api.admin.faqs.list(),
      ]);
      setPosts(blogResponse);
      setFaqs(faqsResponse);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar conteúdo editorial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePostChange = (event) => {
    const { name, value } = event.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFaqChange = (event) => {
    const { name, value } = event.target;
    setFaqForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitPost = async (event) => {
    event.preventDefault();
    setSavingPost(true);
    setError('');
    try {
      await api.admin.blog.create({
        ...postForm,
        reading_time: postForm.reading_time ? Number(postForm.reading_time) : undefined,
      });
      setPostForm(emptyPost);
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível publicar o artigo.');
    } finally {
      setSavingPost(false);
    }
  };

  const submitFaq = async (event) => {
    event.preventDefault();
    setSavingFaq(true);
    setError('');
    try {
      await api.admin.faqs.create(faqForm);
      setFaqForm(emptyFaq);
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível salvar a FAQ.');
    } finally {
      setSavingFaq(false);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm('Remover esta publicação do blog?')) return;
    try {
      await api.admin.blog.remove(id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível excluir a publicação.');
    }
  };

  const deleteFaq = async (id) => {
    if (!window.confirm('Remover esta pergunta frequente?')) return;
    try {
      await api.admin.faqs.remove(id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível excluir a FAQ.');
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <span className="badge">Conteúdo editorial</span>
        <h1 style={{ marginTop: '1rem' }}>Blog & FAQ</h1>
        <p className="text-muted" style={{ maxWidth: '600px', marginTop: '0.75rem' }}>
          Compartilhe tendências, bastidores e orientações para fortalecer a presença digital da
          marca e nutrir os clientes.
        </p>
      </header>

      {error && !loading ? <ErrorState message={error} /> : null}

      {loading ? (
        <Loader message="Carregando conteúdos..." />
      ) : (
        <div className={styles.layout}>
          <section className={styles.formCard}>
            <div>
              <h2>Novo artigo</h2>
              <p className="text-muted">
                Produza materiais inspiracionais e otimize a busca orgânica com relatos autorais.
              </p>
            </div>

            <form className={styles.form} onSubmit={submitPost}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="title">
                  Título
                </label>
                <input
                  id="title"
                  name="title"
                  className={styles.input}
                  value={postForm.title}
                  onChange={handlePostChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="excerpt">
                  Resumo
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  className={styles.textarea}
                  value={postForm.excerpt}
                  onChange={handlePostChange}
                  placeholder="Resumo convidativo para redes sociais e SEO."
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="content">
                  Conteúdo
                </label>
                <textarea
                  id="content"
                  name="content"
                  className={styles.textarea}
                  value={postForm.content}
                  onChange={handlePostChange}
                  placeholder="Descreva o conteúdo completo..."
                  required
                />
              </div>

              <div className={styles.inline}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="author">
                    Autor
                  </label>
                  <input
                    id="author"
                    name="author"
                    className={styles.input}
                    value={postForm.author}
                    onChange={handlePostChange}
                    placeholder="Equipe Leia Sabores"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="published_at">
                    Data publicação
                  </label>
                  <input
                    id="published_at"
                    name="published_at"
                    type="date"
                    className={styles.input}
                    value={postForm.published_at}
                    onChange={handlePostChange}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="reading_time">
                    Tempo leitura
                  </label>
                  <input
                    id="reading_time"
                    name="reading_time"
                    type="number"
                    className={styles.input}
                    value={postForm.reading_time}
                    onChange={handlePostChange}
                    placeholder="minutos"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="image_url">
                  Imagem destaque
                </label>
                <input
                  id="image_url"
                  name="image_url"
                  className={styles.input}
                  value={postForm.image_url}
                  onChange={handlePostChange}
                  placeholder="https://..."
                />
              </div>

              <button
                type="submit"
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={savingPost}
              >
                {savingPost ? 'Publicando...' : 'Publicar artigo'}
              </button>
            </form>

            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Publicado em</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td>{post.title}</td>
                      <td>{post.author}</td>
                      <td>{post.published_at || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonDanger}`}
                          onClick={() => deletePost(post.id)}
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

          <section className={styles.formCard}>
            <div>
              <h2>FAQ</h2>
              <p className="text-muted">
                Antecipe dúvidas mais recorrentes e facilite o atendimento consultivo.
              </p>
            </div>

            <form className={styles.form} onSubmit={submitFaq}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="category">
                  Categoria
                </label>
                <input
                  id="category"
                  name="category"
                  className={styles.input}
                  value={faqForm.category}
                  onChange={handleFaqChange}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="question">
                  Pergunta
                </label>
                <input
                  id="question"
                  name="question"
                  className={styles.input}
                  value={faqForm.question}
                  onChange={handleFaqChange}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="answer">
                  Resposta
                </label>
                <textarea
                  id="answer"
                  name="answer"
                  className={styles.textarea}
                  value={faqForm.answer}
                  onChange={handleFaqChange}
                  required
                />
              </div>

              <button
                type="submit"
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={savingFaq}
              >
                {savingFaq ? 'Salvando...' : 'Adicionar FAQ'}
              </button>
            </form>

            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Pergunta</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq) => (
                    <tr key={faq.id}>
                      <td>{faq.category}</td>
                      <td>{faq.question}</td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonDanger}`}
                          onClick={() => deleteFaq(faq.id)}
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

export default ContentAdmin;
