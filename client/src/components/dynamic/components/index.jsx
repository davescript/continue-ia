import TextBlock from './TextBlock.jsx';
import HeadingBlock from './HeadingBlock.jsx';
import ImageBlock from './ImageBlock.jsx';
import ButtonBlock from './ButtonBlock.jsx';
import SpacerBlock from './SpacerBlock.jsx';
import RichTextBlock from './RichTextBlock.jsx';
import VideoBlock from './VideoBlock.jsx';
import ProductGridBlock from './ProductGridBlock.jsx';
import HeroCtaBlock from './HeroCtaBlock.jsx';

export const componentRenderers = {
  text: TextBlock,
  heading: HeadingBlock,
  image: ImageBlock,
  button: ButtonBlock,
  spacer: SpacerBlock,
  'rich-text': RichTextBlock,
  video: VideoBlock,
  'product-grid': ProductGridBlock,
  'hero-cta': HeroCtaBlock,
};

export const renderComponent = (component) => {
  if (!component) return null;
  const Renderer = componentRenderers[component.type];
  if (!Renderer) return null;
  const key = component.id || `${component.type}-${Math.random().toString(36).slice(2, 9)}`;
  return <Renderer key={key} props={component.props} />;
};
