import styles from '../dynamic.module.css';
import { createStyle } from '../helpers.js';

const RichTextBlock = ({ props = {} }) => {
  const { html = '', align = 'left', style = {} } = props;
  return (
    <div
      className={styles.richText}
      style={{ textAlign: align, ...createStyle(style) }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default RichTextBlock;
