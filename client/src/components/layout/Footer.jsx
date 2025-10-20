import { NavLink } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => (
  <footer className={styles.footer}>
    <div className="container">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>Leia Sabores</span>
          <p className={styles.brandText}>
            Bolos artesanais e decorações de festa criadas com amor, sabor e dedicação.
          </p>
        </div>

        <div>
          <h4>Mapa do site</h4>
          <ul className={styles.linkList}>
            <li className={styles.linkItem}>
              <NavLink to="/acessorios">Catálogo de acessórios</NavLink>
            </li>
            <li className={styles.linkItem}>
              <NavLink to="/carrinho">Carrinho de compras</NavLink>
            </li>
            <li className={styles.linkItem}>
              <NavLink to="/blog">Blog & inspirações</NavLink>
            </li>
            <li className={styles.linkItem}>
              <NavLink to="/contato">Consultoria exclusiva</NavLink>
            </li>
            <li className={styles.linkItem}>
              <NavLink to="/admin/login">Painel administrativo</NavLink>
            </li>
          </ul>
        </div>

        <div className={styles.newsletter}>
          <h4>Newsletter Leia Sabores</h4>
          <p>
            Receba convites para provas de sabores, pré-vendas e guias exclusivos sobre celebrações
            personalizadas em Portugal.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              alert('Obrigada! Entraremos em contato em breve.');
            }}
          >
            <input className={styles.input} type="email" required placeholder="Seu e-mail" />
            <button type="submit" className={styles.submit}>
              Quero receber novidades
            </button>
          </form>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>
          Siga-nos nas redes sociais e acompanhe nossas criações diárias:
          {' '}
          <a
            className={styles.socialTextLink}
            href="https://www.instagram.com/leiasabores/"
            aria-label="Instagram"
          >
            Instagram
          </a>
          {' | '}
          <a className={styles.socialTextLink} href="https://facebook.com" aria-label="Facebook">
            Facebook
          </a>
          {' | '}
          <a
            className={styles.socialTextLink}
            href="https://tiktok.com/@leiasabores"
            aria-label="TikTok"
          >
            TikTok
          </a>
        </p>
        <p>© 2025 Leiasabores. Todos os direitos reservados.</p>
        <p>Bolos artesanais e decorações de festa criadas com amor, sabor e dedicação.</p>
        <p>📍 Atendemos em todo o território português | 🎂 Encomendas personalizadas sob medida.</p>
        <p>💌 E-mail: leiasabores@hotmail.com</p>
      </div>
    </div>
  </footer>
);

export default Footer;
