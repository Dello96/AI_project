const puppeteer = require('puppeteer');
const path = require('path');
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
  
  const pdfBuffers = [];
  
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
    
    // 슬라이드가 제대로 표시되었는지 확인
    const activeSlide = await page.$('.slide.active');
    if (!activeSlide) {
      console.log(`슬라이드 ${i + 1}를 찾을 수 없습니다.`);
      continue;
    }
    
    // 슬라이드 내용 확인
    const slideContent = await page.evaluate(() => {
      const activeSlide = document.querySelector('.slide.active');
      if (!activeSlide) return null;
      
      return {
        title: activeSlide.querySelector('h1, h2')?.textContent || '',
        hasContent: activeSlide.textContent.trim().length > 0
      };
    });
    
    console.log(`슬라이드 ${i + 1} 내용:`, slideContent);
    
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
    
    pdfBuffers.push(pdfBuffer);
    
    // 개별 슬라이드 PDF 저장
    fs.writeFileSync(`portfolio-slide-${i + 1}.pdf`, pdfBuffer);
    console.log(`슬라이드 ${i + 1} PDF 생성 완료`);
  }
  
  // 모든 슬라이드를 하나의 PDF로 합치기
  console.log('전체 PDF 생성 중...');
  
  // 첫 번째 슬라이드로 시작
  await page.evaluate((index) => {
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === index);
    });
  }, 0);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 전체 PDF 생성
  await page.pdf({
    path: 'portfolio-complete.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });
  
  console.log('전체 포트폴리오 PDF 생성 완료');
  
  await browser.close();
  console.log('PDF 변환 완료!');
}

convertToPDF().catch(console.error);
