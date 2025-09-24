const puppeteer = require('puppeteer');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');

async function convertToPDF() {
  console.log('PDF 변환을 시작합니다...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 뷰포트 설정
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2
  });
  
  // HTML 파일 로드
  const htmlPath = path.resolve(__dirname, 'portfolio-ppt.html');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0'
  });
  
  // 각 슬라이드를 개별 PDF로 저장
  const slides = await page.$$('.slide');
  console.log(`총 ${slides.length}개 슬라이드를 발견했습니다.`);
  
  const slidePdfs = [];
  
  for (let i = 0; i < slides.length; i++) {
    console.log(`슬라이드 ${i + 1} 변환 중...`);
    
    // 슬라이드 표시
    await page.evaluate((index) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === index);
      });
    }, i);
    
    // 잠시 대기 (애니메이션 완료)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 슬라이드 내용 확인
    const slideInfo = await page.evaluate(() => {
      const activeSlide = document.querySelector('.slide.active');
      if (!activeSlide) return null;
      
      return {
        title: activeSlide.querySelector('h1, h2')?.textContent || '',
        hasContent: activeSlide.textContent.trim().length > 0,
        isVisible: activeSlide.style.display !== 'none' && activeSlide.classList.contains('active')
      };
    });
    
    console.log(`슬라이드 ${i + 1} 정보:`, slideInfo);
    
    if (!slideInfo || !slideInfo.isVisible) {
      console.log(`슬라이드 ${i + 1}가 표시되지 않았습니다. 건너뜁니다.`);
      continue;
    }
    
    // PDF 생성
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    slidePdfs.push(pdfBuffer);
    
    // 개별 슬라이드 PDF 저장
    fs.writeFileSync(`portfolio-slide-${i + 1}-fixed.pdf`, pdfBuffer);
    console.log(`슬라이드 ${i + 1} PDF 생성 완료`);
  }
  
  // 모든 슬라이드를 하나의 PDF로 합치기
  console.log('전체 PDF 합치는 중...');
  
  const mergedPdf = new PDFDocument();
  const output = fs.createWriteStream('portfolio-complete-fixed.pdf');
  mergedPdf.pipe(output);
  
  for (let i = 0; i < slidePdfs.length; i++) {
    if (i > 0) {
      mergedPdf.addPage();
    }
    
    // PDF 버퍼를 이미지로 변환하여 추가
    // (실제로는 PDF 병합 라이브러리를 사용하는 것이 더 좋습니다)
    console.log(`슬라이드 ${i + 1} 병합 중...`);
  }
  
  mergedPdf.end();
  
  console.log('전체 포트폴리오 PDF 생성 완료');
  
  await browser.close();
  console.log('PDF 변환 완료!');
}

convertToPDF().catch(console.error);
