const getTagValue = (parentNode, tag) => parentNode.querySelector(tag).textContent;


export default (xml) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(xml, 'text/xml');

  const title = getTagValue(dom, 'title');
  const description = getTagValue(dom, 'description');
  const formattedPubDate = getTagValue(dom, 'pubDate');
  const pubDate = new Date(formattedPubDate);

  const nodes = dom.querySelectorAll('item');
  const items = Array.from(nodes).map((item) => {
    const itemTitle = getTagValue(item, 'title');
    const itemLink = getTagValue(item, 'link');
    const itemFormattedPubDate = getTagValue(item, 'pubDate');
    const itemPubDate = new Date(itemFormattedPubDate);
    return { title: itemTitle, link: itemLink, pubDate: itemPubDate };
  });

  return {
    title, description, items, pubDate,
  };
};
