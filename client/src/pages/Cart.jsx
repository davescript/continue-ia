import { Link } from 'react-router-dom';
import CartSummary from '../components/cart/CartSummary.jsx';
import { useCart } from '../context/useCart.js';
import styles from './Cart.module.css';

const steps = [
  { label: 'Carrinho', status: 'active' },
  { label: 'Dados de envio', status: 'upcoming' },
  { label: 'Pagamento', status: 'upcoming' },
];

const Cart = () => {
  const { items } = useCart();

  return (
    <section className="section">
      <div className="container">
        <header className={styles.header}>
          <span className="badge">Carrinho de compras</span>
          <h1>Revise os acessórios da sua festa.</h1>
          <p className="text-muted">
            Ajuste quantidades, remova itens ou finalize a compra com total segurança. Quando estiver
            pronto, prossiga para o checkout.
          </p>
        </header>

        <div className={styles.wrapper}>
          <ol className={styles.progress} aria-label="Etapas do checkout">
            {steps.map((step) => (
              <li
                key={step.label}
                className={`${styles.progressItem} ${styles[`progressItem--${step.status}`]}`}
              >
                <span className={styles.progressDot} />
                <span>{step.label}</span>
              </li>
            ))}
          </ol>

          <CartSummary />

          <section className={styles.support} aria-label="Suporte e envio">
            <div>
              <h3>Precisa de ajuda?</h3>
              <p className="text-muted">
                Fale com a equipa Leia Sabores através do WhatsApp +351 969 407 406 ou
                envie um e-mail para <strong>leiasabores@hotmail.com</strong>.
              </p>
            </div>
            <div className={styles.supportGrid}>
              <article>
                <h4>Envios rápidos</h4>
                <p className="text-muted">Preparamos o pedido em até 48h úteis e partilhamos o rastreio assim que é enviado.</p>
              </article>
              <article>
                <h4>Personalização</h4>
                <p className="text-muted">Quer ajustar algum item do carrinho? Indique nas notas do checkout e fazemos o acompanhamento.</p>
              </article>
              <article>
                <h4>Pagamentos seguros</h4>
                <p className="text-muted">Stripe com cartões, Apple Pay e Google Pay — protegido e rápido.</p>
              </article>
            </div>
          </section>
        </div>

        {!items.length ? (
          <div className={styles.empty}>
            <p className="text-muted">
              Seu carrinho está vazio. Explore o catálogo para adicionar materiais de festa.
            </p>
            <Link className="button" to="/acessorios">
              Ver catálogo completo
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Cart;
