import { Link } from 'react-router-dom';
import styles from '../dynamic.module.css';
import { createStyle } from '../helpers.js';

const ButtonBlock = ({ props = {} }) => {
  const { label = 'Explorar', to = '#', variant = 'primary', style = {} } = props;
  const className = variant === 'ghost' ? 'button button--ghost' : 'button';
  return (
    <Link to={to} className={`${styles.cta} ${className}`} style={createStyle(style)}>
      {label}
    </Link>
  );
};

export default ButtonBlock;
