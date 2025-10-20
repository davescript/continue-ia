import SectionRenderer from './SectionRenderer.jsx';
import styles from './dynamic.module.css';

const PageRenderer = ({ page }) => {
  if (!page) return null;
  const { sections = [] } = page;
  return (
    <div className={styles.page}>
      {sections.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((section) => (
        <SectionRenderer key={section.id || `${section.type}-${Math.random()}`} section={section} />
      ))}
    </div>
  );
};

export default PageRenderer;
