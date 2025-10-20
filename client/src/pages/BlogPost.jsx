import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import styles from './BlogPost.module.css';

const BlogPost = () => {
  const { slug } = useParams();

  const {
    data: post,
    loading,
    error,
  } = useFetch(() => api.getBlogPost(slug), [slug]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className="container">
          <Loader message="Preparando conteúdo exclusivo..." />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={styles.wrapper}>
        <div className="container">
          <ErrorState message="Publicação não encontrada." />
        </div>
      </div>
    );
  }

  const publishedAt = post.published_at
    ? format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: pt })
    : null;

  return (
    <div className={styles.wrapper}>
      <div className="container">
        <Link to="/blog" className="button button--ghost" style={{ marginBottom: '2rem' }}>
          <ArrowLeft size={18} />
          Voltar para o blog
        </Link>

        <header className={styles.header}>
          <span className="badge">
            <Sparkles size={16} />
            Inspirações
          </span>
          <h1>{post.title}</h1>
          <div className={styles.meta}>
            {post.author ? <span>{post.author}</span> : null}
            {publishedAt ? <span>{publishedAt}</span> : null}
            {post.reading_time ? <span>{post.reading_time} min</span> : null}
          </div>
        </header>

        <div className={styles.cover}>
          <img src={post.image_url} alt={post.title} />
        </div>

        <article className={styles.content}>
          {(post.content || '').split('\n').map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 10)}`}>{paragraph}</p>
          ))}
        </article>

        <div className={styles.cta}>
          <h3>Vamos criar algo único para o seu evento?</h3>
          <p className="text-muted">
            A consultoria Leia Sabores acolhe o seu briefing, desenha o conceito e executa todo o
            projeto com excelência artesanal.
          </p>
          <Link className="button" to="/contato">
            Agendar consultoria
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
