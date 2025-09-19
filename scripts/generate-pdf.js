const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  console.log('🚀 PDF 생성 시작...');
  
  try {
    // Puppeteer 브라우저 실행
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // HTML 파일 경로
    const htmlPath = path.join(__dirname, '..', 'docs', 'view-count-bug-fix-documentation.html');
    const htmlUrl = `file://${htmlPath}`;
    
    console.log('📄 HTML 파일 로딩:', htmlUrl);
    
    // HTML 파일 로드
    await page.goto(htmlUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // PDF 생성 옵션
    const pdfOptions = {
      path: path.join(__dirname, '..', 'docs', 'view-count-bug-fix-documentation.pdf'),
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #667eea;">
          <span>조회수 중복 증가 버그 해결 과정 문서</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `
    };
    
    console.log('📝 PDF 생성 중...');
    
    // PDF 생성
    await page.pdf(pdfOptions);
    
    console.log('✅ PDF 생성 완료!');
    console.log('📁 저장 위치:', pdfOptions.path);
    
    // 파일 크기 확인
    const stats = fs.statSync(pdfOptions.path);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('📊 파일 크기:', fileSizeInMB, 'MB');
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ PDF 생성 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  generatePDF();
}

module.exports = generatePDF;
