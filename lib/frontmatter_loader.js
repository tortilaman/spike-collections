const yaml = require('js-yaml')
const File = require('filewrap')

// this loader will put out front matter, adding the props to the loader context for plugin to grab later
module.exports = function frontmatterLoader (source) {
  this.cacheable && this.cacheable()
  if (!this.options.__frontmatter) this.options.__frontmatter = {}

  // TODO: this regex doesn't handle \r\n line breaks
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n?---\s*\n?([\s\S]*)/

  /**
   * Indents the given string
   * From http://cwestblog.com/2014/01/02/javascript-indenting-text/
   * @param {string} str  The string to be indented.
   * @param {number} numOfIndents  The amount of indentations to place at the
   *     beginning of each line of the string.
   * @param {number=} opt_spacesPerIndent  Optional.  If specified, this should be
   *     the number of spaces to be used for each tab that would ordinarily be
   *     used to indent the text.  These amount of spaces will also be used to
   *     replace any tab characters that already exist within the string.
   * @return {string}  The new string with each line beginning with the desired
   *     amount of indentation.
   */
  function indent(str, numOfIndents, opt_spacesPerIndent) {
    str = str.replace(/^(?=.)/gm, new Array(numOfIndents + 1).join('\t'));
    numOfIndents = new Array(opt_spacesPerIndent + 1 || 0).join(' '); // re-use
    return opt_spacesPerIndent
      ? str.replace(/^\t+/g, function(tabs) {
          return tabs.replace(/./g, numOfIndents);
      })
      : str;
  }

  // pull front matter, add to options, return just the body
  return source.replace(frontmatterRegex, (match, fm, body) => {
    const f = new File(this.options.context, this.resourcePath)
    this.options.__frontmatter[f.relative] = yaml.safeLoad(fm)
    const layout = this.options.__frontmatter[f.relative].layout || '../views/_post'
    const wrappedFile = "extends(src='" + layout + ".sml')\nblock(name='content' md)\n" + indent(body, 1)
    return wrappedFile
  })
}
