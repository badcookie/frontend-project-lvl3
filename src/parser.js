const parser = new DOMParser();

export default (xml) => {
  const document = parser.parseFromString(xml, 'text/xml');
  const title = document.querySelector('title').textContent;
  const description = document.querySelector('description').textContent;

  const nodes = document.querySelectorAll('item');
  const items = Array.from(nodes).map((item) => {
    const itemTitle = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    return { title: itemTitle, link };
  });

  return { title, description, items };
};
