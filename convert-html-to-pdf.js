const puppeteer = require('puppeteer');
const path = require('path');

async function convertHTMLToPDF() {
  console.log('HTML을 PDF로 변환합니다...');
  
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
  const htmlPath = path.resolve(__dirname, 'portfolio.html');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0'
  });
  
  // PDF 생성
  const pdf = await page.pdf({
    path: 'portfolio-complete-final.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });
  
  console.log('PDF 생성 완료!');
  
  await browser.close();
}

convertHTMLToPDF().catch(console.error);
