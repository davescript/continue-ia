import styles from '../dynamic.module.css';
import { createStyle } from '../helpers.js';

const HeadingBlock = ({ props = {} }) => {
  const { text = '', level = 2, align = 'left', style = {} } = props;
  const HeadingTag = `h${Math.min(Math.max(level, 1), 6)}`;
  return (
    <HeadingTag className={styles.heading} style={{ textAlign: align, ...createStyle(style) }}>
      {text}
    </HeadingTag>
  );
};

export default HeadingBlock;
