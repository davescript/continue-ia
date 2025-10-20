import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeading from '../components/common/SectionHeading.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import styles from './Portfolio.module.css';

const Portfolio = () => {
  const [filter, setFilter] = useState('Todos');

  const {
    data: gallery,
    loading,
    error,
  } = useFetch(() => api.getGallery(), []);

  const filters = useMemo(() => {
    const options = new Set(['Todos']);
    (gallery || []).forEach((item) => {
      if (item.event_type) {
        options.add(item.event_type);
      }
    });
    return Array.from(options);
  }, [gallery]);

  const filteredGallery = useMemo(() => {
    if (!gallery) return [];
    if (filter === 'Todos') return gallery;
    return gallery.filter((item) => item.event_type === filter);
  }, [gallery, filter]);

  return (
    <div className="section">
      <div className="container">
        <div className={styles.intro}>
          <span className="badge">
            <Sparkles size={16} />
            Portfólio Leia Sabores
          </span>
          <h1>Memórias que traduzem nosso olhar artístico.</h1>
          <p className="text-muted">
            Selecionamos projetos que representam a essência da marca: delicadeza artesanal,
            storytelling visual e execução impecável. Use os filtros para explorar por tipo de
            evento.
          </p>
        </div>

        <div className={styles.filters}>
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.filter} ${filter === option ? styles.filterActive : ''}`}
              onClick={() => setFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <SectionHeading
          eyebrow="Projetos reais"
          title="Cenários que celebram histórias."
          description="Cada projeto integra confeitaria, styling e ambientação pensados exclusivamente para cada cliente."
        />

        {loading ? (
          <Loader message="Carregando memórias..." />
        ) : error ? (
          <ErrorState message="Não foi possível carregar o portfólio." />
        ) : (
          <div className={styles.grid}>
            {filteredGallery.map((item) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.image}>
                  <img src={item.image_url} alt={item.title} loading="lazy" />
                </div>
                <div className={styles.content}>
                  <span className="tag">{item.event_type}</span>
                  <h3>{item.title}</h3>
                  <p className="text-muted">{item.description}</p>
                  <span className="text-muted">Paleta cromática: {item.palette}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className={styles.cta}>
          <h3>Deseja viver uma experiência exclusiva?</h3>
          <p className="text-muted">
            Vamos co-criar um projeto tailor-made para o seu evento. Do moodboard à entrega final, a
            dedicação é total.
          </p>
          <Link className="button" to="/contato">
            Agendar reunião criativa
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
