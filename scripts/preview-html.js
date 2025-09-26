const fs = require('fs');
const path = require('path');

// 마크다운을 HTML로 변환하는 함수
function markdownToHtml(markdown) {
  let html = markdown;
  
  // 코드 블록 처리 (```로 시작하는 블록)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  
  // 인라인 코드 처리
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 제목 처리
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  
  // 강조 처리
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 목록 처리
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // 목록을 ul/ol로 감싸기
  html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
    const lines = match.split('\n');
    let result = '<ul>\n';
    lines.forEach(line => {
      if (line.trim().startsWith('<li>')) {
        result += line + '\n';
      }
    });
    result += '</ul>';
    return result;
  });
  
  // 구분선 처리
  html = html.replace(/^---$/gim, '<hr>');
  
  // 단락 처리
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/^(?!<[h|l|p|d|t|u|o])/gm, '<p>');
  
  // 빈 태그 정리
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-6])/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr)/g, '$1');
  html = html.replace(/(<\/hr>)<\/p>/g, '$1');
  
  return html;
}

async function generatePreview() {
  try {
    console.log('HTML 미리보기 생성 시작...');
    
    // 마크다운 파일 읽기
    const markdownPath = path.join(__dirname, '../docs/kakao-map-implementation-guide.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');
    
    // HTML 변환
    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>카카오맵 API 구현 및 에러 해결 가이드</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-top: 40px;
            margin-bottom: 20px;
        }
        
        h3 {
            color: #374151;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        
        h4 {
            color: #4b5563;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
        }
        
        pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        li {
            margin: 8px 0;
        }
        
        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 30px 0;
        }
        
        blockquote {
            border-left: 4px solid #3b82f6;
            margin: 20px 0;
            padding: 10px 20px;
            background: #f8fafc;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background: #f3f4f6;
            font-weight: 600;
        }
        
        .highlight {
            background: #fef3c7;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .error-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .success-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .info-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    ${markdownToHtml(markdownContent)}
</body>
</html>`;

    // HTML 파일 저장
    const htmlPath = path.join(__dirname, '../docs/kakao-map-implementation-guide.html');
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log(`HTML 미리보기 생성 완료: ${htmlPath}`);
    console.log('브라우저에서 확인하세요!');
    
  } catch (error) {
    console.error('HTML 미리보기 생성 중 오류 발생:', error);
  }
}

generatePreview();
