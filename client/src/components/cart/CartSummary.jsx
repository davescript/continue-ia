import { Minus, Plus, Trash2, Eye, ShieldCheck, CreditCard, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useCart } from '../../context/useCart.js';
import { getAccessoryImage } from '../../utils/media.js';
import styles from './CartSummary.module.css';

const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const CartSummary = ({ onCheckoutStart }) => {
  const { items, totalAmount, updateItem, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    setPreviewItem((current) => {
      if (!items.length) return null;
      if (current && items.some((item) => item.id === current.id)) {
        return items.find((item) => item.id === current.id) || items[0];
      }
      return items[0];
    });
  }, [items]);

  const handleCheckout = async () => {
    if (!items.length) return;
    setLoading(true);
    setError('');
    try {
      const origin = window.location.origin;
      const response = await api.createCheckoutSession({
        items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        successUrl: `${origin}/acessorios?status=sucesso`,
        cancelUrl: `${origin}/acessorios?status=cancelado`,
      });
      if (response.url) {
        if (typeof onCheckoutStart === 'function') onCheckoutStart();
        window.location.href = response.url;
      }
    } catch (err) {
      setError(err.message || 'Não foi possível iniciar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Carrinho de acessórios</h3>
        {items.length ? (
          <button type="button" className={styles.iconButton} onClick={clearCart} title="Limpar carrinho">
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>Adicione acessórios para montar seu kit festa.</p>
      ) : (
        <div className={styles.content}>
          <div className={styles.list}>
            {items.map((item) => {
              const image = getAccessoryImage(item);
              return (
                <div
                  key={item.id}
                  className={styles.item}
                  onClick={() => setPreviewItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setPreviewItem(item);
                    }
                  }}
                >
                  <div className={styles.thumbnailWrapper}>
                    <img className={styles.thumbnail} src={image} alt={item.name} />
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemDetails}>
                      {currencyFormatter.format(item.price)} · {item.quantity}{' '}
                      {item.quantity === 1 ? 'unidade' : 'unidades'}
                    </span>
                    <button
                      type="button"
                      className={styles.previewButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewItem(item);
                      }}
                    >
                      <Eye size={16} />
                      Ver preview
                    </button>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        updateItem(item.id, item.quantity - 1);
                      }}
                      title="Diminuir"
                    >
                      <Minus size={16} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        updateItem(item.id, item.quantity + 1);
                      }}
                      title="Aumentar"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeItem(item.id);
                      }}
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <aside className={styles.preview}>
            {previewItem ? (
              <>
                <div className={styles.previewImageWrapper}>
                  <img
                    src={getAccessoryImage(previewItem)}
                    alt={previewItem.name}
                    className={styles.previewImage}
                  />
                </div>
                <div className={styles.previewInfo}>
                  <h4>{previewItem.name}</h4>
                  <p className="text-muted">
                    {currencyFormatter.format(previewItem.price)} · {previewItem.quantity}{' '}
                    {previewItem.quantity === 1 ? 'unidade' : 'unidades'}
                  </p>
                  {previewItem.description ? (
                    <p className="text-muted">{previewItem.description}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className={styles.previewEmpty}>
                <p className="text-muted">Selecione um item para visualizar o preview.</p>
              </div>
            )}
          </aside>
        </div>
      )}

      <div className={styles.totalRow}>
        <span>Total estimado</span>
        <span>{currencyFormatter.format(totalAmount)}</span>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button
        type="button"
        className={styles.checkoutButton}
        onClick={handleCheckout}
        disabled={!items.length || loading}
      >
        {loading ? 'Redirecionando...' : 'Finalizar com Stripe'}
      </button>

      <div className={styles.trustRow} aria-hidden="true">
        <span className={styles.trustItem}>
          <ShieldCheck size={16} />
          Pagamento seguro pela Stripe
        </span>
        <span className={styles.trustItem}>
          <CreditCard size={16} />
          Cartões e wallet suportados
        </span>
        <span className={styles.trustItem}>
          <Truck size={16} />
          Envio em até 48h úteis
        </span>
      </div>
    </div>
  );
};

export default CartSummary;
