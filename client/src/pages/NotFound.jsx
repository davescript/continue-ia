import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="section">
    <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
      <span className="badge">404</span>
      <h1 style={{ fontSize: '3rem', marginTop: '1rem' }}>Página encantada não encontrada.</h1>
      <p className="text-muted" style={{ maxWidth: '520px', margin: '1rem auto 2rem' }}>
        Parece que essa página ainda está em criação. Retorne para a página inicial ou explore nosso
        portfólio de experiências.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link className="button" to="/">
          Voltar ao início
        </Link>
        <Link className="button button--ghost" to="/produtos">
          Ver produtos
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;
