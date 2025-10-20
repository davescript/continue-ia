import { Link } from 'react-router-dom';
import { PartyPopper, Gift, Truck } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading.jsx';
import AccessoryCard from '../components/cards/AccessoryCard.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useCart } from '../context/useCart.js';
import { getAccessoryImage } from '../utils/media.js';
import HeroSlider from '../components/hero/HeroSlider.jsx';
import styles from './Home.module.css';

const highlights = [
  {
    icon: PartyPopper,
    title: 'Temáticas completas',
    description:
      'Coleções coordenadas com copos, pratos, talheres, balões e painéis prontos para montar.',
  },
  {
    icon: Gift,
    title: 'Kits personalizáveis',
    description:
      'Combine itens avulsos e kits prontos para adaptar ao número de convidados e ao estilo da festa.',
  },
  {
    icon: Truck,
    title: 'Envios rápidos',
    description: 'Expedição em até 48h úteis para todo o território português com rastreamento.',
  },
];

const processSteps = [
  {
    title: 'Escolha o estilo',
    description: 'Filtre por temática ou idade e descubra combinações prontas para a sua festa.',
  },
  {
    title: 'Adicione ao carrinho',
    description: 'Selecione itens avulsos ou kits completos e ajuste quantidades conforme a lista.',
  },
  {
    title: 'Complete o checkout',
    description: 'Finalize o pedido com pagamento seguro e agende a data de entrega ideal.',
  },
  {
    title: 'Receba & monte',
    description: 'Receba tudo embalado, com instruções práticas para montar um cenário surpreendente.',
  },
];

const metrics = [
  { value: '+4.800', label: 'Itens enviados no último ano' },
  { value: '48h', label: 'Preparação média dos pedidos' },
  { value: '4,9', label: 'Avaliação média dos clientes' },
];

const slides = [
  {
    image: '/homem-aranha.jpg',
    eyebrow: 'Coleções infantis',
    title: 'Temas heroicos para aniversários inesquecíveis.',
    description:
      'Monte o cenário completo com kits de acessórios coordenados, toppers personalizados e iluminação especial.',
    actions: [
      { label: 'Explorar catálogo', to: '/acessorios' },
      { label: 'Coleção destaque', to: '/destaque', variant: 'ghost' },
    ],
  },
  {
    image: '/lilo-stitch.jpg',
    eyebrow: 'Lançamento',
    title: 'Novas paletas tropicais para festas hawaianas.',
    description:
      'Combinações prontas com balões, mesa posta e lembranças personalizadas com entrega para todo Portugal.',
    actions: [{ label: 'Ver novidades', to: '/acessorios?categoria=novidades' }],
  },
  {
    image: '/heineken-party.jpg',
    eyebrow: 'Eventos adultos',
    title: 'Experiência premium para festas corporativas e sociais.',
    description:
      'Acessórios para bar, iluminação ambiente e detalhes sofisticados para impressionar os convidados.',
    actions: [{ label: 'Ocasiões especiais', to: '/acessorios?categoria=ocasioes' }],
  },
];

const showcaseThemes = [
  {
    title: 'Festa Homem-Aranha',
    description: 'Explosão de cores com talheres metalizados, toppers 3D e backdrop para heróis.',
    image: '/homem-aranha.jpg',
  },
  {
    title: 'Universo Lilo & Stitch',
    description: 'Paleta tropical com folhas, neon azul e acessórios holográficos para as mesas.',
    image: '/lilo-stitch.jpg',
  },
  {
    title: 'Coleção Minnie Glam',
    description: 'Mix de rosa e dourado com arco orgânico, cake toppers e lembranças personalizadas.',
    image: '/minnie.jpg',
  },
  {
    title: 'Bar temático Heineken',
    description: 'Baldes térmicos, copos especiais e iluminação verde para eventos adultos.',
    image: '/heineken-party.jpg',
  },
];

const Home = () => {
  const { addItem } = useCart();
  const {
    data: categories,
    loading: loadingCategories,
    error: errorCategories,
  } = useFetch(() => api.getAccessoryCategories(), []);

  const {
    data: accessories,
    loading: loadingAccessories,
    error: errorAccessories,
  } = useFetch(() => api.getAccessories(), []);

  const featuredAccessories = Array.isArray(accessories) ? accessories.slice(0, 4) : [];

  return (
    <>
      <div className={styles.heroWrapper}>
        <HeroSlider slides={slides} metrics={metrics} />
      </div>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Motivos para escolher"
            title="Festas memoráveis com curadoria e praticidade."
            description="Selecionamos acessórios resistentes, com acabamentos premium e prontos para encantar do convite à sobremesa."
          />

          <div className={styles.valuesGrid}>
            {highlights.map((item) => (
              <article key={item.title} className={styles.valueCard}>
                <span className={styles.valueIcon}>
                  <item.icon size={22} />
                </span>
                <h3>{item.title}</h3>
                <p className="text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <SectionHeading
            eyebrow="Categorias em destaque"
            title="Encontre a temática perfeita para o seu evento."
            description="Escolha um universo e personalize com os acessórios que combinam com a sua celebração."
          />

          {loadingCategories ? (
            <Loader message="Carregando categorias de acessórios..." />
          ) : errorCategories ? (
            <ErrorState message="Não foi possível carregar as categorias." />
          ) : (
            <div className={styles.categoriesGrid}>
              {(categories || []).map((category) => (
                <article
                  key={category.id}
                  className={styles.categoryCard}
                  style={{ '--category-image': `url(${category.hero_image})` }}
                >
                  <div className={styles.categoryContent}>
                    <span className="tag">{category.name}</span>
                    <h3 className={styles.categoryTitle}>{category.name}</h3>
                    <p className="text-muted">{category.description}</p>
                  </div>
                  <div className={styles.categoryFooter}>
                    <span>{category.item_count} produtos disponíveis</span>
                    <Link
                      to={`/acessorios?categoria=${category.slug}`}
                      className="button button--ghost"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Mais pedidos"
            title="Best-sellers para montar a festa completa."
            description="Combine itens que se complementam e garanta um cenário cheio de personalidade."
          />

          {loadingAccessories ? (
            <Loader message="Separando os acessórios favoritos..." />
          ) : errorAccessories ? (
            <ErrorState message="Não foi possível carregar os acessórios." />
          ) : (
            <div className="grid grid--two">
              {featuredAccessories.map((item) => (
                <AccessoryCard
                  key={item.id}
                  accessory={item}
                  onAdd={(accessory) => addItem(accessory, 1)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <SectionHeading
            eyebrow="Inspirações visuais"
            title="Cenários que pode recriar com o nosso catálogo."
            description="Escolha um tema e combine acessórios do carrinho para alcançar um resultado surpreendente."
          />
          <div className={styles.showcaseGrid}>
            {showcaseThemes.map((theme) => (
              <article key={theme.title} className={styles.showcaseCard}>
                <div className={styles.showcaseImage}>
                  <img src={getAccessoryImage({ image_url: theme.image, name: theme.title })} alt={theme.title} />
                </div>
                <div className={styles.showcaseContent}>
                  <h3>{theme.title}</h3>
                  <p className="text-muted">{theme.description}</p>
                  <Link className={styles.showcaseLink} to="/acessorios">
                    Montar carrinho
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <SectionHeading
            eyebrow="Como funciona"
            title="Do carrinho à celebração em quatro etapas."
            description="Planeie com tranquilidade: nós cuidamos da seleção, embalo e envio para que você foque em celebrar."
          />
          <div className={styles.processGrid}>
            {processSteps.map((step, index) => (
              <article key={step.title} className={styles.processCard}>
                <span className={styles.processNumber}>{index + 1}</span>
                <h3>{step.title}</h3>
                <p className="text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.storeBanner}>
            <div>
              <span className="badge">Suporte dedicado</span>
              <h3>Precisa de ajuda com o orçamento da festa?</h3>
              <p className="text-muted">
                Nossa equipa separa sugestões alinhadas ao tema, quantidade de convidados e estilo da
                celebração. Conte connosco para montar o carrinho ideal.
              </p>
            </div>
            <Link className="button" to="/contato">
              Falar com especialista
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
