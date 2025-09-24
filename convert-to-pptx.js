const puppeteer = require('puppeteer');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

async function convertToPPTX() {
  console.log('PowerPoint 변환을 시작합니다...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // HTML 파일 로드
  const htmlPath = path.resolve(__dirname, 'portfolio-ppt.html');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0'
  });
  
  // PowerPoint 프레젠테이션 생성
  const pptx = new PptxGenJS();
  
  // 각 슬라이드를 PowerPoint 슬라이드로 변환
  const slides = await page.$$('.slide');
  console.log(`총 ${slides.length}개 슬라이드를 발견했습니다.`);
  
  for (let i = 0; i < slides.length; i++) {
    // 슬라이드 표시
    await page.evaluate((index) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === index);
      });
    }, i);
    
    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 슬라이드 내용 추출
    const slideData = await page.evaluate(() => {
      const activeSlide = document.querySelector('.slide.active');
      if (!activeSlide) return null;
      
      return {
        title: activeSlide.querySelector('h1, h2')?.textContent || '',
        content: activeSlide.textContent || '',
        html: activeSlide.innerHTML
      };
    });
    
    if (slideData) {
      // PowerPoint 슬라이드 추가
      const slide = pptx.addSlide();
      
      // 제목 추가
      if (slideData.title) {
        slide.addText(slideData.title, {
          x: 1,
          y: 0.5,
          w: 8,
          h: 1,
          fontSize: 32,
          bold: true,
          color: '2c3e50'
        });
      }
      
      // 내용 추가 (간단한 텍스트)
      const content = slideData.content.replace(slideData.title, '').trim();
      if (content) {
        slide.addText(content, {
          x: 1,
          y: 2,
          w: 8,
          h: 4,
          fontSize: 16,
          color: '555555'
        });
      }
      
      console.log(`슬라이드 ${i + 1} PowerPoint 변환 완료`);
    }
  }
  
  // PowerPoint 파일 저장
  await pptx.writeFile({ fileName: 'portfolio-presentation.pptx' });
  console.log('PowerPoint 변환 완료!');
  
  await browser.close();
}

convertToPPTX().catch(console.error);
