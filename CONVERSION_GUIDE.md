# 포트폴리오 변환 가이드

## 🎯 변환 가능한 파일 형식들

### 1. PDF 변환 (가장 추천)

#### 방법 A: 브라우저에서 직접 변환
1. `portfolio-ppt.html` 파일을 브라우저에서 열기
2. `Ctrl+P` (Windows) 또는 `Cmd+P` (Mac) 누르기
3. "PDF로 저장" 선택
4. 설정에서 "배경 그래픽" 체크
5. 저장

#### 방법 B: 자동화 스크립트 사용
```bash
# Puppeteer 설치
npm install puppeteer

# PDF 변환 실행
node convert-to-pdf.js
```

### 2. 이미지 변환

#### 방법 A: 수동 스크린샷
1. `portfolio-ppt.html` 파일을 브라우저에서 열기
2. 각 슬라이드마다 스크린샷 찍기
3. 이미지 편집 프로그램에서 정리

#### 방법 B: 자동화 스크립트 사용
```bash
# 이미지 변환 실행
node convert-to-images.js
```

### 3. PowerPoint 변환

#### 방법 A: 수동 변환
1. `portfolio-ppt.html` 파일을 브라우저에서 열기
2. 각 슬라이드 내용을 복사
3. PowerPoint에서 새 슬라이드 생성
4. 내용 붙여넣기 및 디자인 적용

#### 방법 B: 자동화 스크립트 사용
```bash
# PptxGenJS 설치
npm install pptxgenjs

# PowerPoint 변환 실행
node convert-to-pptx.js
```

### 4. 비디오 변환

#### 방법 A: 화면 녹화
1. `portfolio-ppt.html` 파일을 브라우저에서 열기
2. 화면 녹화 프로그램 사용 (OBS, QuickTime 등)
3. 슬라이드 전환하면서 녹화
4. 편집 후 비디오 파일로 저장

#### 방법 B: 온라인 도구 사용
- Loom, Screencastify 등 온라인 녹화 도구 활용

## 🛠️ 필요한 도구들

### 필수 도구
- **웹 브라우저**: Chrome, Firefox, Safari 등
- **Node.js**: 자동화 스크립트 실행용

### 선택 도구
- **Puppeteer**: PDF/이미지 자동 변환
- **PptxGenJS**: PowerPoint 자동 변환
- **OBS Studio**: 화면 녹화
- **Adobe Acrobat**: PDF 편집

## 📋 변환 결과물

### PDF 변환 결과
- `portfolio-slide-1.pdf` ~ `portfolio-slide-11.pdf`: 개별 슬라이드
- `portfolio-complete.pdf`: 전체 프레젠테이션

### 이미지 변환 결과
- `portfolio-slide-1.png` ~ `portfolio-slide-11.png`: 고해상도 이미지

### PowerPoint 변환 결과
- `portfolio-presentation.pptx`: 편집 가능한 PowerPoint 파일

## 🎨 변환 시 주의사항

### PDF 변환 시
- 배경 그래픽 포함 설정
- 페이지 여백 조정
- 폰트 임베딩 확인

### 이미지 변환 시
- 고해상도 설정 (2x 이상)
- PNG 형식 사용 (품질 유지)
- 일관된 크기 유지

### PowerPoint 변환 시
- 텍스트 서식 유지
- 이미지 품질 확인
- 애니메이션 추가 가능

## 🚀 추천 변환 순서

1. **PDF 변환** (가장 범용적)
2. **이미지 변환** (소셜 미디어 공유용)
3. **PowerPoint 변환** (편집 및 수정용)
4. **비디오 변환** (온라인 공유용)

## 💡 추가 팁

### 품질 향상
- 고해상도 모니터에서 변환
- 브라우저 확대/축소 100% 유지
- 다크 모드 비활성화

### 파일 크기 최적화
- PDF: 이미지 압축 설정
- 이미지: WebP 형식 고려
- PowerPoint: 불필요한 요소 제거

### 공유 최적화
- PDF: 이메일 첨부용
- 이미지: SNS 업로드용
- PowerPoint: 발표용
- 비디오: 온라인 공유용
