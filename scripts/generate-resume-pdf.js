#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateResumePDF() {
  console.log('📄 경력기술서 PDF 생성 중...');
  
  try {
    // Puppeteer 브라우저 실행
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // HTML 파일 경로
    const htmlPath = path.join(__dirname, '../docs/resume-template.html');
    const htmlUrl = `file://${htmlPath}`;
    
    console.log('📖 HTML 파일 로딩 중...', htmlUrl);
    
    // HTML 파일 로드
    await page.goto(htmlUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // PDF 생성 설정
    const pdfOptions = {
      path: path.join(__dirname, '../docs/resume-yunseonghyeon.pdf'),
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    };
    
    console.log('🖨️ PDF 생성 중...');
    
    // PDF 생성
    const pdf = await page.pdf(pdfOptions);
    
    // 파일 크기 확인
    const stats = fs.statSync(pdfOptions.path);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ 경력기술서 PDF 생성 완료!');
    console.log(`📁 파일 위치: ${pdfOptions.path}`);
    console.log(`📊 파일 크기: ${fileSizeInMB} MB`);
    
    // 브라우저 종료
    await browser.close();
    
    return {
      success: true,
      filePath: pdfOptions.path,
      fileSize: fileSizeInMB
    };
    
  } catch (error) {
    console.error('❌ PDF 생성 중 오류 발생:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 스크립트 실행
if (require.main === module) {
  generateResumePDF()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 경력기술서가 성공적으로 생성되었습니다!');
        console.log(`📄 파일: ${result.filePath}`);
        console.log(`📏 크기: ${result.fileSize} MB`);
      } else {
        console.error('\n💥 PDF 생성에 실패했습니다:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 예상치 못한 오류:', error);
      process.exit(1);
    });
}

module.exports = { generateResumePDF };
