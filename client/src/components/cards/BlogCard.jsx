import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import styles from './BlogCard.module.css';

const BlogCard = ({ post }) => {
  if (!post) return null;

  const publishedAt = post.published_at
    ? format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: pt })
    : null;

  return (
    <article className={styles.card}>
      <div className={styles.image}>
        <img src={post.image_url} alt={post.title} loading="lazy" />
      </div>
      <div className={styles.content}>
        <div className={styles.meta}>
          {publishedAt ? <span>{publishedAt}</span> : null}
          {post.reading_time ? <span>{post.reading_time} minutos</span> : null}
        </div>
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.excerpt}>{post.excerpt}</p>
        <Link className={styles.link} to={`/blog/${post.slug}`}>
          Ler matéria completa
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </article>
  );
};

export default BlogCard;
