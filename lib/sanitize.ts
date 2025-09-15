import sanitizeHtml from 'sanitize-html'

// 허용된 HTML 태그 및 속성 설정
const allowedTags = [
  'p', 'br', 'strong', 'em', 'u', 's', 'strike', 'del',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span'
]

const allowedAttributes = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'table': ['class'],
  'th': ['colspan', 'rowspan'],
  'td': ['colspan', 'rowspan'],
  'div': ['class'],
  'span': ['class'],
  '*': ['class']
}

// 허용된 URL 프로토콜
const allowedSchemes = ['http', 'https', 'mailto']

// 콘텐츠 정화 옵션
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags,
  allowedAttributes,
  allowedSchemes,
  allowedSchemesByTag: {
    'a': ['http', 'https', 'mailto'],
    'img': ['http', 'https']
  },
  allowedClasses: {
    'div': ['highlight', 'code-block', 'quote'],
    'span': ['highlight', 'code'],
    'table': ['table', 'table-striped', 'table-bordered']
  },
  // 스타일 속성은 허용하지 않음 (보안상 이유)
  allowedStyles: {},
  // 스크립트 태그와 이벤트 핸들러 제거
  disallowedTagsMode: 'discard',
  // 빈 태그 제거
  exclusiveFilter(frame) {
    // 빈 태그 제거 (br, img 제외)
    if (frame.tag === 'p' && !frame.text.trim()) {
      return true
    }
    return false
  },
  // 텍스트 정규화
  normalizeWhitespace: true,
  // HTML 엔티티 디코딩
  decodeEntities: true
}

/**
 * HTML 콘텐츠를 정화하여 XSS 공격을 방지합니다.
 * @param content 정화할 HTML 콘텐츠
 * @returns 정화된 안전한 HTML 콘텐츠
 */
export function sanitizeContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  try {
    return sanitizeHtml(content, sanitizeOptions)
  } catch (error) {
    console.error('콘텐츠 정화 오류:', error)
    // 정화 실패 시 HTML 태그를 모두 제거하고 텍스트만 반환
    return sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {},
      allowedSchemes: []
    })
  }
}

/**
 * 제목을 정화합니다 (HTML 태그 제거)
 * @param title 정화할 제목
 * @returns 정화된 제목
 */
export function sanitizeTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return ''
  }

  return sanitizeHtml(title, {
    allowedTags: [],
    allowedAttributes: {},
    allowedSchemes: []
  }).trim()
}

/**
 * 댓글 콘텐츠를 정화합니다 (더 제한적인 태그만 허용)
 * @param content 정화할 댓글 콘텐츠
 * @returns 정화된 댓글 콘텐츠
 */
export function sanitizeComment(content: string): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  const commentOptions: sanitizeHtml.IOptions = {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a'],
    allowedAttributes: {
      'a': ['href', 'title']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedStyles: {},
    normalizeWhitespace: true,
    decodeEntities: true
  }

  try {
    return sanitizeHtml(content, commentOptions)
  } catch (error) {
    console.error('댓글 정화 오류:', error)
    return sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {},
      allowedSchemes: []
    })
  }
}

/**
 * URL이 안전한지 확인합니다
 * @param url 확인할 URL
 * @returns 안전한 URL인지 여부
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const urlObj = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * 이미지 URL이 안전한지 확인합니다
 * @param url 확인할 이미지 URL
 * @returns 안전한 이미지 URL인지 여부
 */
export function isSafeImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}
