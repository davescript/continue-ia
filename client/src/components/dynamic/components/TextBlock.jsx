import styles from '../dynamic.module.css';
import { createStyle } from '../helpers.js';

const TextBlock = ({ props = {} }) => {
  const { text = '', align = 'left', style = {} } = props;
  return (
    <p className={styles.textBlock} style={{ textAlign: align, ...createStyle(style) }}>
      {text}
    </p>
  );
};

export default TextBlock;
