const puppeteer = require('puppeteer');
const path = require('path');

async function convertToImages() {
  console.log('이미지 변환을 시작합니다...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 뷰포트 설정 (고해상도)
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
  
  // 각 슬라이드를 이미지로 저장
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
    
    // 잠시 대기 (애니메이션 완료)
    await page.waitForTimeout(500);
    
    // 이미지 캡처
    const slideElement = await page.$('.slide.active');
    if (slideElement) {
      await slideElement.screenshot({
        path: `portfolio-slide-${i + 1}.png`,
        type: 'png',
        quality: 100
      });
      console.log(`슬라이드 ${i + 1} 이미지 생성 완료`);
    }
  }
  
  await browser.close();
  console.log('이미지 변환 완료!');
}

convertToImages().catch(console.error);
