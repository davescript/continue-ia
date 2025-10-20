import { Sparkles, LayoutDashboard, Lightbulb, Brush, CheckCircle2 } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import ThemeCard from '../components/cards/ThemeCard.jsx';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import styles from './Experiences.module.css';

const serviceHighlights = [
  {
    icon: LayoutDashboard,
    title: 'Direção criativa completa',
    description:
      'Narrativa estética, moodboard, paleta cromática, referências de mobiliário e briefing fotográfico.',
  },
  {
    icon: Brush,
    title: 'Projetos cenográficos autorais',
    description:
      'Painéis exclusivos, instalações suspensas, lettering artístico e peças produzidas sob medida.',
  },
  {
    icon: Lightbulb,
    title: 'Ambientação sensorial',
    description:
      'Iluminação cênica, scent design, playlist curada e ativações que envolvem convidados.',
  },
  {
    icon: CheckCircle2,
    title: 'Styling e cronograma',
    description:
      'Coordenação de fornecedores, montagem técnica, check-list final e acompanhamento no evento.',
  },
];

const Experiences = () => {
  const {
    data: themes,
    loading: loadingThemes,
    error: errorThemes,
  } = useFetch(() => api.getThemes(), []);

  const {
    data: gallery,
    loading: loadingGallery,
    error: errorGallery,
  } = useFetch(() => api.getGallery({ featured: true }), []);

  return (
    <div className="section">
      <div className="container">
        <div className={styles.intro}>
          <span className="badge">
            <Sparkles size={16} />
            Experiências imersivas
          </span>
          <h1>Ambientações personalizadas para celebrar com autenticidade.</h1>
          <p className="text-muted">
            Criamos projetos integrados de bolo, mesa de doces e cenografia que traduzem a essência
            do seu evento. Estudamos estética, storytelling e jornada do convidado para entregar
            memórias inesquecíveis.
          </p>
        </div>

        <SectionHeading
          eyebrow="Coleções assinadas"
          title="Temáticas autorais disponíveis para customização."
          description="Cada conceito pode ser adaptado com novas paletas, volumes florais, mobiliário e experiências sensoriais."
        />

        {loadingThemes ? (
          <Loader message="Planejando cada detalhe criativo..." />
        ) : errorThemes ? (
          <ErrorState message="Não foi possível carregar as experiências." />
        ) : (
          <div className={styles.experienceGrid}>
            {(themes || []).map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        )}

        <div className={styles.services}>
          <h2>Como conduzimos seu evento dos sonhos</h2>
          <div className={styles.servicesList}>
            {serviceHighlights.map((service) => (
              <article key={service.title} className={styles.serviceCard}>
                <span className={styles.serviceIcon}>
                  <service.icon size={20} />
                </span>
                <h3>{service.title}</h3>
                <p className="text-muted">{service.description}</p>
              </article>
            ))}
          </div>
        </div>

        <SectionHeading
          eyebrow="Portfólio curado"
          title="Eventos que ganharam alma com a assinatura Leia Sabores."
          description="Uma seleção de projetos recentes que evidenciam nossa estética: delicada, sofisticada e personalizada."
        />

        {loadingGallery ? (
          <Loader message="Selecionando memórias do nosso portfólio..." />
        ) : errorGallery ? (
          <ErrorState message="Não foi possível carregar o portfólio." />
        ) : (
          <div className={styles.galleryGrid}>
            {(gallery || []).map((item) => (
              <article key={item.id} className={styles.galleryCard}>
                <div className={styles.galleryImage}>
                  <img src={item.image_url} alt={item.title} loading="lazy" />
                </div>
                <div className={styles.galleryContent}>
                  <span className="tag">{item.event_type}</span>
                  <h3>{item.title}</h3>
                  <p className="text-muted">{item.description}</p>
                  <span className="text-muted">Paleta: {item.palette}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Experiences;
