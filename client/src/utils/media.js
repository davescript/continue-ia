const fallbackImages = [
  { match: /aranha|spider/i, src: '/homem-aranha.jpg' },
  { match: /stitch/i, src: '/lilo-stitch.jpg' },
  { match: /minnie|minie/i, src: '/minnie.jpg' },
  { match: /heineken|beer/i, src: '/heineken-party.jpg' },
];

const defaultImage = '/homem-aranha.jpg';

export const getAccessoryImage = (item) => {
  if (!item) return defaultImage;

  if (item.image_url) return item.image_url;

  const sourceText = `${item.name || ''} ${item.slug || ''}`.trim();

  const found = fallbackImages.find(({ match }) => match.test(sourceText));
  return found ? found.src : defaultImage;
};

export default getAccessoryImage;
