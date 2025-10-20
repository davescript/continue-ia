const SpacerBlock = ({ props = {} }) => {
  const { size = '1rem' } = props;
  return <div style={{ height: size, width: '100%' }} aria-hidden="true" />;
};

export default SpacerBlock;
