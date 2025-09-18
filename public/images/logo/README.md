# 로고 이미지 파일 위치

이 디렉토리에 로고 이미지 파일들을 저장하세요.

## 권장 파일 형식

### SVG (벡터 형식 - 권장)
- `logo.svg` - 기본 로고
- `logo-dark.svg` - 다크 테마용 로고
- `logo-light.svg` - 라이트 테마용 로고

### PNG (비트맵 형식)
- `logo.png` - 기본 로고 (고해상도)
- `logo@2x.png` - 2배 해상도
- `logo@3x.png` - 3배 해상도

## 권장 크기

- **SVG**: 무제한 (벡터이므로)
- **PNG**: 512x512px 이상 (고해상도 지원)

## 사용 방법

```tsx
// Next.js Image 컴포넌트 사용 (권장)
import Image from 'next/image'

<Image
  src="/images/logo/logo.svg"
  alt="PrayGround 로고"
  width={64}
  height={64}
  priority
/>

// 일반 img 태그 사용
<img 
  src="/images/logo/logo.svg" 
  alt="PrayGround 로고" 
  className="w-16 h-16"
/>
```

## 파일명 규칙

- 소문자와 하이픈 사용
- 의미있는 이름 사용
- 버전 번호 포함 (필요시)
- 예: `logo-v2.svg`, `logo-icon-only.png`
