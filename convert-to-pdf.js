const puppeteer = require('puppeteer');
const path = require('path');

async function convertToPDF() {
  console.log('PDF 변환을 시작합니다...');
  
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
  
  // 각 슬라이드를 개별 PDF로 저장
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // PDF 생성
    const pdf = await page.pdf({
      path: `portfolio-slide-${i + 1}.pdf`,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    console.log(`슬라이드 ${i + 1} PDF 생성 완료`);
  }
  
        // 전체 슬라이드를 하나의 PDF로 저장 (각 슬라이드를 개별 페이지로)
        const allSlides = [];
        for (let i = 0; i < slides.length; i++) {
            await page.evaluate((index) => {
                const slides = document.querySelectorAll('.slide');
                slides.forEach((slide, idx) => {
                    slide.classList.toggle('active', idx === index);
                });
            }, i);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const slideElement = await page.$('.slide.active');
            if (slideElement) {
                allSlides.push(slideElement);
            }
        }
        
        // 모든 슬라이드를 하나의 PDF로 저장
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
