import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import BlogCard from '../components/cards/BlogCard.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import styles from './Blog.module.css';

const Blog = () => {
  const {
    data: posts,
    loading,
    error,
  } = useFetch(() => api.getBlogPosts(), []);

  const [heroPost, ...otherPosts] = posts || [];
  const heroDate = heroPost?.published_at
    ? format(new Date(heroPost.published_at), "dd 'de' MMMM 'de' yyyy", { locale: pt })
    : null;

  return (
    <div className="section">
      <div className="container">
        <div className={styles.intro}>
          <span className="badge">
            <Sparkles size={16} />
            Conteúdo Leia Sabores
          </span>
          <h1>Insights, tendências e bastidores do universo das celebrações autorais.</h1>
          <p className="text-muted">
            Guias práticos, entrevistas e reportagens com a curadoria do nosso time de especialistas
            em confeitaria e ambientação. Inspire-se para o seu próximo evento.
          </p>
        </div>

        <SectionHeading
          eyebrow="Destaque"
          title="O que está movimentando o backstage das festas personalizadas."
        />

        {loading ? (
          <Loader message="Organizando as publicações mais recentes..." />
        ) : error ? (
          <ErrorState message="Não foi possível carregar o conteúdo do blog." />
        ) : heroPost ? (
          <>
            <article className={styles.heroPost}>
              <div className={styles.heroMedia}>
                <img src={heroPost.image_url} alt={heroPost.title} />
              </div>
              <div className={styles.heroContent}>
                <span className="tag">{heroPost.author}</span>
                <h2>{heroPost.title}</h2>
                {heroDate ? <span className="text-muted">{heroDate}</span> : null}
                <p className="text-muted">{heroPost.excerpt}</p>
                <Link className={styles.heroActions} to={`/blog/${heroPost.slug}`}>
                  Ler artigo completo
                  <ArrowRight size={18} />
                </Link>
              </div>
            </article>

            {otherPosts.length > 0 ? (
              <>
                <SectionHeading
                  eyebrow="Mais leituras"
                  title="Curadoria Leia Sabores"
                  description="Amplie seu repertório com artigos sobre sabores, ambientação e planejamento."
                />
                <div className={styles.grid}>
                  {otherPosts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <ErrorState message="Ainda não temos publicações cadastradas." />
        )}
      </div>
    </div>
  );
};

export default Blog;
