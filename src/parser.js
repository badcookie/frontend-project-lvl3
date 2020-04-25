const parser = new DOMParser();

export default (xml) => {
  const document = parser.parseFromString(xml, 'text/xml');
  const feedTitle = document.querySelector('title').textContent;

  const nodes = document.querySelectorAll('item');
  const items = Array.from(nodes).map((item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    return { title, link };
  });

  return { title: feedTitle, items };
};
