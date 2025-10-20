const SectionHeading = ({ eyebrow, title, description, align = 'center' }) => (
  <header
    className="section-heading"
    style={{ textAlign: align, alignItems: align === 'left' ? 'flex-start' : 'center' }}
  >
    {eyebrow ? <span className="badge">{eyebrow}</span> : null}
    <h2>{title}</h2>
    {description ? <p>{description}</p> : null}
  </header>
);

export default SectionHeading;
