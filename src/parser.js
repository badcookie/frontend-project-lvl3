const getTagValue = (parentNode, tag) => parentNode.querySelector(tag).textContent;


export default (xml) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(xml, 'text/xml');
  console.log(dom);

  const title = getTagValue(dom, 'title');
  const description = getTagValue(dom, 'description');
  const formattedPubDate = getTagValue(dom, 'pubDate');
  const pubDate = new Date(formattedPubDate);

  const nodes = dom.querySelectorAll('item');
  const items = Array.from(nodes).map((node) => {
    const itemTitle = getTagValue(node, 'title');
    const itemLink = getTagValue(node, 'link');
    const itemFormattedPubDate = getTagValue(node, 'pubDate');
    const itemPubDate = new Date(itemFormattedPubDate);
    return { title: itemTitle, link: itemLink, pubDate: itemPubDate };
  });

  return {
    title, description, items, pubDate,
  };
};
