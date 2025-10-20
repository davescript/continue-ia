import clsx from 'clsx';
import { renderComponent } from './components/index.jsx';
import styles from './dynamic.module.css';

const SectionRenderer = ({ section }) => {
  if (!section) return null;
  const { type = 'container', settings = {}, components = [] } = section;
  const {
    backgroundColor,
    backgroundImage,
    overlay = false,
    paddingTop,
    paddingBottom,
    layout = 'stack',
    align = 'center',
    columns = 3,
  } = settings;

  const sectionStyle = {
    backgroundColor,
    paddingTop,
    paddingBottom,
  };

  const containerClass = clsx(styles.section, {
    [styles['section--full']]: settings.fullWidth,
  });

  const innerClass = clsx({
    [styles.sectionInner]: !settings.fullWidth,
  });

  const resolvedType = type === 'container' ? layout : type;

  const contentWrapper = () => {
    switch (resolvedType) {
      case 'hero':
        return (
          <div
            className={styles.heroContainer}
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
              textAlign: align,
            }}
          >
            <div className={styles.heroContent}>{components.map(renderComponent)}</div>
          </div>
        );
      case 'grid':
        return (
          <div
            className={styles.grid}
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, Number(columns) || 1)}, minmax(0, 1fr))`,
            }}
          >
            {components.map(renderComponent)}
          </div>
        );
      case 'stack':
      case 'container':
      default:
        return (
          <div className={styles.stack} style={{ alignItems: align === 'center' ? 'center' : 'stretch' }}>
            {components.map(renderComponent)}
          </div>
        );
    }
  };

  const backgroundStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : undefined;

  return (
    <section className={containerClass} style={sectionStyle} data-section-type={type}>
      <div className={clsx(innerClass, { [styles.sectionBackground]: Boolean(backgroundImage) })}>
        {backgroundImage ? (
          <div className={styles.sectionBackgroundContent} style={backgroundStyle}>
            {overlay ? (
              <div className={styles.overlay}>
                <div className={styles.overlayContent}>{contentWrapper()}</div>
              </div>
            ) : (
              contentWrapper()
            )}
          </div>
        ) : (
          contentWrapper()
        )}
      </div>
    </section>
  );
};

export default SectionRenderer;
