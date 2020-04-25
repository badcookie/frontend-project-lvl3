const getTagValue = (parentNode, tag) => parentNode.querySelector(tag).textContent;

const domParser = new DOMParser();

export default (xml, parser = domParser) => {
  const dom = parser.parseFromString(xml, 'text/xml');

  const title = getTagValue(dom, 'title');
  const description = getTagValue(dom, 'description');
  const link = getTagValue(dom, 'link');

  const nodes = dom.querySelectorAll('item');
  const items = Array.from(nodes).map((item) => {
    const itemTitle = getTagValue(item, 'title');
    const itemLink = getTagValue(item, 'link');
    return { title: itemTitle, link: itemLink };
  });

  return {
    title, description, link, items,
  };
};
