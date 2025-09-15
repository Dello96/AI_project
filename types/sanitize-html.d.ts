declare module 'sanitize-html' {
  namespace sanitizeHtml {
    interface IOptions {
      allowedTags?: string[]
      allowedAttributes?: { [key: string]: string[] }
      allowedClasses?: { [key: string]: string[] }
      allowedStyles?: { [key: string]: { [key: string]: RegExp[] } }
      allowedSchemes?: string[]
      allowedSchemesByTag?: { [key: string]: string[] }
      allowedSchemesAppliedToAttributes?: string[]
      allowProtocolRelative?: boolean
      enforceHtmlBoundary?: boolean
      disallowedTagsMode?: 'discard' | 'escape'
      exclusiveFilter?: (frame: any) => boolean
      normalizeWhitespace?: boolean
      decodeEntities?: boolean
    }
  }

  function sanitizeHtml(dirty: string, options?: sanitizeHtml.IOptions): string
  export = sanitizeHtml
}
