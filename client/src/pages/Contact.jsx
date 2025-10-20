import { useState } from 'react';
import { Phone, Mail, MapPin, Sparkles } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import styles from './Contact.module.css';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  eventType: '',
  eventDate: '',
  guests: '',
  venue: '',
  budget: '',
  style: '',
  notes: '',
};

const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const {
    data: faqs,
    loading: loadingFaqs,
    error: errorFaqs,
  } = useFetch(() => api.getFaqs(), []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const payload = {
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
        },
        event: {
          type: form.eventType,
          date: form.eventDate,
          guests: form.guests ? Number(form.guests) : undefined,
          venue: form.venue,
        },
        preferences: {
          budget: form.budget,
          style: form.style ? form.style.split(',').map((item) => item.trim()) : [],
          notes: form.notes,
        },
      };

      const response = await api.createOrder(payload);
      setStatus({
        type: 'success',
        message: `${response.message} Protocolo: ${response.protocol}.`,
      });
      setForm(initialForm);
    } catch (err) {
      setStatus({
        type: 'error',
        message:
          err.message ||
          'Não foi possível enviar sua solicitação. Por favor, tente novamente em instantes.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className="container">
        <SectionHeading
          eyebrow="Consultoria Leia Sabores"
          title="Vamos criar a celebração que imaginou?"
          description="Conte-nos sobre o seu evento em Portugal e retornaremos com proposta personalizada, calendário de provas e recomendações de ambientação."
        />

        <div className={styles.layout}>
          <aside className={styles.infoCard}>
            <span className="badge">
              <Sparkles size={16} />
              Atendimento humanizado
            </span>
            <h3>Preferimos conversar com calma.</h3>
            <p className="text-muted">
              Escolha o canal preferido. Respondemos em até 24h úteis e agendamos a consultoria
              criativa sem custos.
            </p>

            <div className={styles.infoList}>
              <span className={styles.infoItem}>
                <Phone size={18} />
                +351 969 407 406 · WhatsApp & chamada
              </span>
              <span className={styles.infoItem}>
                <Mail size={18} />
                contacto@leiasabores.pt
              </span>
              <span className={styles.infoItem}>
                <MapPin size={18} />
                Rua dos Sabores, 45 – Chiado, Lisboa
              </span>
            </div>

            <p className="text-muted">
              Atendimento presencial com hora marcada. Provas às quartas e quintas-feiras no nosso
              atelier em Lisboa.
            </p>
          </aside>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className="grid grid--two">
              <div className={styles.formGroup}>
                <label htmlFor="name">Nome completo *</label>
                <input
                  id="name"
                  name="name"
                  className={styles.input}
                  required
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">E-mail *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={styles.input}
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid--two">
              <div className={styles.formGroup}>
                <label htmlFor="phone">Telefone / WhatsApp</label>
                <input
                  id="phone"
                  name="phone"
                  className={styles.input}
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="eventType">Tipo de evento *</label>
                <select
                  id="eventType"
                  name="eventType"
                  className={styles.select}
                  required
                  value={form.eventType}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  <option value="Mini Wedding">Mini Wedding</option>
                  <option value="Casamento">Casamento</option>
                  <option value="Aniversário Adulto">Aniversário Adulto</option>
                  <option value="Chá Revelação">Chá Revelação</option>
                  <option value="Evento Corporativo">Evento Corporativo</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="grid grid--three">
              <div className={styles.formGroup}>
                <label htmlFor="eventDate">Data estimada *</label>
                <input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  className={styles.input}
                  required
                  value={form.eventDate}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="guests">Número de convidados</label>
                <input
                  id="guests"
                  name="guests"
                  type="number"
                  min="0"
                  className={styles.input}
                  value={form.guests}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="venue">Local / Cidade</label>
                <input
                  id="venue"
                  name="venue"
                  className={styles.input}
                  value={form.venue}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid--two">
              <div className={styles.formGroup}>
                <label htmlFor="budget">Faixa de investimento</label>
                <select
                  id="budget"
                  name="budget"
                  className={styles.select}
                  value={form.budget}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  <option value="Até R$ 3 mil">Até R$ 3 mil</option>
                  <option value="R$ 3 mil a R$ 6 mil">R$ 3 mil a R$ 6 mil</option>
                  <option value="R$ 6 mil a R$ 10 mil">R$ 6 mil a R$ 10 mil</option>
                  <option value="Acima de R$ 10 mil">Acima de R$ 10 mil</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="style">
                  Estilo desejado <span className="text-muted">(separe por vírgulas)</span>
                </label>
                <input
                  id="style"
                  name="style"
                  className={styles.input}
                  placeholder="Ex: romântico, botânico, minimalista"
                  value={form.style}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="notes">Conte-nos sobre o seu sonho *</label>
              <textarea
                id="notes"
                name="notes"
                className={styles.textarea}
                required
                placeholder="Compartilhe referências, cores, sabores preferidos e o que não pode faltar."
                value={form.notes}
                onChange={handleChange}
              />
            </div>

            {status.message ? (
              <div className={status.type === 'success' ? styles.success : styles.error}>
                {status.message}
              </div>
            ) : null}

            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Solicitar proposta personalizada'}
            </button>
          </form>
        </div>

        <div className={styles.faqSection}>
          <SectionHeading
            eyebrow="Dúvidas frequentes"
            title="Tudo o que você precisa saber antes de reservar."
            description="Nosso atendimento é personalizado, mas reunimos respostas rápidas para agilizar seu planejamento."
            align="left"
          />
          {loadingFaqs ? (
            <Loader message="Carregando orientações..." />
          ) : errorFaqs ? (
            <ErrorState message="Não foi possível carregar as FAQs agora." />
          ) : (
            <div className={styles.faqGrid}>
              {(faqs || []).map((faq) => (
                <article key={faq.id} className={styles.faqCard}>
                  <span className="tag">{faq.category}</span>
                  <h4>{faq.question}</h4>
                  <p className="text-muted">{faq.answer}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
