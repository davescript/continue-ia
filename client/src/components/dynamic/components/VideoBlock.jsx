import styles from '../dynamic.module.css';
import { createStyle } from '../helpers.js';

const VideoBlock = ({ props = {} }) => {
  const { url, title = 'Vídeo', style = {}, autoplay = false, controls = true } = props;
  if (!url) return null;

  const isYouTube = /youtube|youtu\.be/.test(url);
  if (isYouTube) {
    return (
      <div className={styles.videoWrapper} style={createStyle(style)}>
        <iframe
          src={url}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className={styles.videoWrapper} style={createStyle(style)}>
      <video src={url} title={title} controls={controls} autoPlay={autoplay} />
    </div>
  );
};

export default VideoBlock;
