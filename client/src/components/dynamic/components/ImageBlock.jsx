import styles from '../dynamic.module.css';
import { createStyle } from '../helpers.js';

const ImageBlock = ({ props = {} }) => {
  const { src, alt = '', width, height, style = {}, objectFit = 'cover' } = props;
  if (!src) return null;
  return (
    <div className={styles.imageWrapper} style={createStyle(style)}>
      <img src={src} alt={alt} style={{ width: width || '100%', height: height || 'auto', objectFit }} />
    </div>
  );
};

export default ImageBlock;
