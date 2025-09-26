const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertResumeToPDF() {
  try {
    console.log('기술 경력서 PDF 변환 시작...');
    
    // HTML 파일 읽기
    const htmlPath = path.join(__dirname, '../docs/tech-resume.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // 브라우저 실행
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // HTML 설정
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // PDF 생성
    const pdfPath = path.join(__dirname, '../docs/tech-resume.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    console.log(`PDF 변환 완료: ${pdfPath}`);
    console.log('파일 크기:', fs.statSync(pdfPath).size, 'bytes');
    
  } catch (error) {
    console.error('PDF 변환 중 오류 발생:', error);
  }
}

convertResumeToPDF();
