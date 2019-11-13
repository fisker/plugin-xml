const attrsPattern = '([^\\s=]+)\\s*(=\\s*([\'"])(.*?)\\3)?';
const tagPattern = '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|(([\\w:\\-._]*:)?([\\w:\\-._]+))([^>]*)>|((\\/)(([\\w:\\-._]*:)?([\\w:\\-._]+))\\s*>))([^<]*)';

class XMLNode {
  constructor(tagname, parent, value, attrs) {
    this.tagname = tagname;
    this.parent = parent;
    this.children = [];
    this.attrs = {};
    this.value = value || "";

    if (typeof attrs === "string" && attrs) {
      this._parseAttrs(attrs);
    }
  }

  _parseAttrs(attrs) {
    const normal = attrs.replace(/\r?\n/g, " ");
    const attrsRegex = new RegExp(attrsPattern, "g");
    let match;

    while (match = attrsRegex.exec(normal)) {
      const name = match[1];
      if (name.length) {
        this.attrs[name] = match[4] === undefined ? true : match[4].trim();
      }
    }
  }
}

const parse = (text, _parsers, _opts) => {
  const xmlData = text.replace(/<!--[\s\S]*?-->/g, ''); // Remove comments

  const rootNode = new XMLNode("!xml");
  let node = rootNode;

  const tagsRegx = new RegExp(tagPattern, "g");
  let tag;

  while (tag = tagsRegx.exec(xmlData)) {
    const tagValue = (tag[14] || "").trim();

    if (tag[4] === "]]>") {
      node.children.push(new XMLNode("!cdata", node, tag[3], tag[8]));
      node.value += `\\c${tagValue}`;
    } else if (tag[10] === "/") {
      if (node.parent) {
        node.parent.value += tagValue;
      }
      node = node.parent;
    } else if (typeof tag[8] !== "undefined" && tag[8].charAt(tag[8].length - 1) === "/") {
      if (node) {
        node.value += tagValue;
      }
      node.children.push(new XMLNode(tag[5], node, "", tag[8].slice(0, -1)));
    } else {
      node = new XMLNode(tag[5], node, tagValue, tag[8]);
      node.parent.children.push(node);
    }
  }

  return rootNode;
};

module.exports = parse;
