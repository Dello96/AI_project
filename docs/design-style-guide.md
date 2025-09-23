# 🎭 인터파크 극장 스타일 가이드

캡쳐 이미지를 기반으로 분석한 인터파크 극장의 디자인 시스템과 스타일 가이드입니다.

## 🎨 컬러 팔레트

### Primary Colors
- **Black (#000000)**: 메인 배경색, 헤더
- **Dark Gray (#1a1a1a)**: 섹션 배경, 카드 배경
- **White (#ffffff)**: 주요 텍스트, 카드 배경

### Accent Colors
- **Orange (#ff6b35)**: 액센트 컬러, 버튼, 링크
- **Red (#e74c3c)**: 강조, 알림, CTA 버튼
- **Gray (#666666)**: 보조 텍스트, 설명

## 📝 타이포그래피

### 폰트 패밀리
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### 폰트 크기 시스템
- **Hero Title**: 4rem (64px) - 메인 타이틀
- **Section Title**: 2rem (32px) - 섹션 제목
- **Card Title**: 1.5rem (24px) - 카드 제목
- **Body Text**: 1rem (16px) - 본문
- **Caption**: 0.9rem (14px) - 부가 설명

### 폰트 웨이트
- **Bold (700)**: 메인 타이틀, 강조
- **Semi-Bold (600)**: 섹션 제목, 버튼
- **Regular (400)**: 본문 텍스트

## 🔘 버튼 스타일

### Primary Button
```css
.btn-primary {
    background: #ff6b35;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    background: #e74c3c;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255,107,53,0.3);
}
```

### Secondary Button
```css
.btn-secondary {
    background: #333;
    color: #fff;
    border: none;
}

.btn-secondary:hover {
    background: #555;
}
```

### Outline Button
```css
.btn-outline {
    background: transparent;
    color: #ff6b35;
    border: 2px solid #ff6b35;
}

.btn-outline:hover {
    background: #ff6b35;
    color: #fff;
}
```

## 🃏 카드 컴포넌트

### 기본 카드
```css
.content-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.content-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}
```

### 포스터 카드
- 이미지 비율: 3:4 (포스터 표준 비율)
- 둥근 모서리: 12px
- 호버 효과: 상승 + 그림자 증가

## 🧭 네비게이션

### 헤더 네비게이션
```css
.nav-item {
    display: inline-block;
    padding: 12px 24px;
    margin: 5px;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #fff;
    transition: all 0.3s ease;
    border: 1px solid rgba(255,255,255,0.2);
}

.nav-item:hover,
.nav-item.active {
    background: #ff6b35;
    transform: translateY(-2px);
}
```

## 📐 레이아웃 원칙

### 그리드 시스템
```css
.content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}
```

### 컨테이너
```css
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}
```

### 섹션 간격
```css
.section {
    margin: 60px 0;
    padding: 40px 0;
}
```

## 📏 스페이싱 시스템

```css
:root {
    --spacing-xs: 4px;   /* 미세 간격 */
    --spacing-sm: 8px;   /* 작은 간격 */
    --spacing-md: 16px;  /* 기본 간격 */
    --spacing-lg: 24px;  /* 중간 간격 */
    --spacing-xl: 32px;  /* 큰 간격 */
    --spacing-2xl: 48px; /* 섹션 간격 */
}
```

## ✨ 애니메이션 & 효과

### 호버 효과
```css
.hover-lift:hover {
    transform: translateY(-5px);
    transition: transform 0.3s ease;
}
```

### 페이드 인 애니메이션
```css
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-in-up {
    animation: fadeInUp 0.6s ease-out;
}
```

### 펄스 효과
```css
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.pulse {
    animation: pulse 2s infinite;
}
```

## 📱 반응형 브레이크포인트

```css
/* Mobile */
@media (max-width: 767px) {
    .hero-title { font-size: 2.5rem; }
    .content-grid { grid-template-columns: 1fr; }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
    .content-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1024px) {
    .content-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Large Desktop */
@media (min-width: 1200px) {
    .content-grid { grid-template-columns: repeat(4, 1fr); }
}
```

## 🎪 브랜드 아이덴티티

### 핵심 가치
1. **Premium**: 고급스럽고 세련된 디자인
2. **Dynamic**: 생동감 있는 애니메이션과 인터랙션
3. **Artistic**: 예술적 감성을 담은 비주얼
4. **Modern**: 현대적이고 직관적인 사용자 경험

### 디자인 원칙
- **Dark Theme**: 극장의 분위기를 살린 어두운 배경
- **Bold Typography**: 강인하고 임팩트 있는 타이포그래피
- **Vibrant Accents**: 오렌지/레드 액센트로 시선 집중
- **Grid-based Layout**: 체계적인 그리드 레이아웃
- **Interactive Elements**: 호버 효과와 애니메이션

## 💡 구현 가이드라인

### CSS 변수 시스템
```css
:root {
    /* Colors */
    --color-primary: #000000;
    --color-primary-dark: #1a1a1a;
    --color-accent: #ff6b35;
    --color-accent-red: #e74c3c;
    --color-text-primary: #ffffff;
    --color-text-secondary: #666666;
    
    /* Typography */
    --font-size-hero: 4rem;
    --font-size-title: 2rem;
    --font-size-subtitle: 1.5rem;
    --font-size-body: 1rem;
    --font-size-caption: 0.9rem;
    
    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --spacing-2xl: 48px;
    
    /* Border Radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    
    /* Shadows */
    --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 15px rgba(0,0,0,0.1);
    --shadow-lg: 0 8px 25px rgba(0,0,0,0.15);
}
```

### 컴포넌트 명명 규칙
- **BEM 방법론** 사용: `.block__element--modifier`
- **의미적 이름** 사용: `.hero-section`, `.content-card`
- **일관된 접두사**: `.btn-`, `.nav-`, `.card-`

## ♿ 접근성 고려사항

### 색상 대비
- **텍스트/배경 대비**: 최소 4.5:1
- **큰 텍스트 대비**: 최소 3:1
- **상태 표시**: 색상 외 다른 방법도 함께 사용

### 키보드 네비게이션
```css
.focusable:focus {
    outline: 2px solid #ff6b35;
    outline-offset: 2px;
}
```

### 스크린 리더 지원
```html
<button aria-label="공연 예매하기">예매</button>
<img src="poster.jpg" alt="가든 브리즈 공연 포스터" />
```

## 🚀 성능 최적화

### 이미지 최적화
- **WebP 포맷** 사용
- **적절한 크기**로 리사이징
- **Lazy Loading** 적용

### CSS 최적화
- **Critical CSS** 인라인 배치
- **미사용 CSS** 제거
- **CSS 압축** 적용

### 애니메이션 최적화
```css
.optimized-animation {
    will-change: transform;
    transform: translateZ(0); /* GPU 가속 */
}
```

이 스타일 가이드는 인터파크 극장의 시각적 아이덴티티를 유지하면서도 현대적이고 접근성이 좋은 웹 디자인을 구현하는 데 도움이 됩니다.
