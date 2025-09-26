const fs = require('fs');
const path = require('path');

// 프로젝트 데이터 로드
const projectData = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/project-data.json'), 'utf8'));

// HTML 템플릿 생성 함수
function generateResumeHTML(data) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>기술 경력서 - [이름]</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* 헤더 섹션 */
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 48px 0;
            margin-bottom: 48px;
        }

        .header-content {
            display: grid;
            grid-template-columns: 120px 1fr;
            gap: 32px;
            align-items: center;
        }

        .profile-image {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 4px solid rgba(255, 255, 255, 0.2);
            object-fit: cover;
        }

        .header-info h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .header-info .title {
            font-size: 20px;
            font-weight: 500;
            opacity: 0.9;
            margin-bottom: 16px;
        }

        .header-info .description {
            font-size: 16px;
            opacity: 0.8;
            margin-bottom: 24px;
        }

        .contact-info {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }

        .contact-item a {
            color: white;
            text-decoration: none;
            transition: opacity 0.3s;
        }

        .contact-item a:hover {
            opacity: 0.8;
        }

        /* 섹션 공통 스타일 */
        .section {
            margin-bottom: 48px;
        }

        .section-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 24px;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 8px;
        }

        /* 핵심 역량 섹션 */
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
        }

        .skill-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .skill-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .skill-card h3 {
            font-size: 18px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 16px;
        }

        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .skill-tag {
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }

        /* 프로젝트 섹션 */
        .project-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 32px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            transition: box-shadow 0.3s;
        }

        .project-card:hover {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
        }

        .project-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 8px;
        }

        .project-period {
            background: #f1f5f9;
            color: #64748b;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        .project-description {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 24px;
        }

        .project-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 24px;
        }

        .project-detail h4 {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
        }

        .project-detail ul {
            list-style: none;
            padding: 0;
        }

        .project-detail li {
            position: relative;
            padding-left: 20px;
            margin-bottom: 8px;
            font-size: 14px;
            color: #6b7280;
        }

        .project-detail li::before {
            content: "•";
            color: #3b82f6;
            font-weight: bold;
            position: absolute;
            left: 0;
        }

        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 16px;
        }

        .tech-tag {
            background: #eff6ff;
            color: #1e40af;
            border: 1px solid #bfdbfe;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }

        .project-links {
            display: flex;
            gap: 16px;
            margin-top: 24px;
        }

        .project-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.3s;
        }

        .project-link:hover {
            background: #2563eb;
        }

        /* 경력 섹션 */
        .experience-item {
            display: flex;
            gap: 24px;
            margin-bottom: 32px;
            padding-bottom: 32px;
            border-bottom: 1px solid #e2e8f0;
        }

        .experience-item:last-child {
            border-bottom: none;
        }

        .experience-period {
            min-width: 120px;
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }

        .experience-content h3 {
            font-size: 18px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 4px;
        }

        .experience-content .company {
            font-size: 16px;
            color: #374151;
            margin-bottom: 8px;
        }

        .experience-content .description {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
        }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
            .header-content {
                grid-template-columns: 1fr;
                text-align: center;
            }

            .project-details {
                grid-template-columns: 1fr;
            }

            .contact-info {
                justify-content: center;
            }

            .container {
                padding: 0 16px;
            }
        }

        /* 인쇄 스타일 */
        @media print {
            body {
                font-size: 12px;
            }
            
            .header {
                background: #2563eb !important;
                -webkit-print-color-adjust: exact;
            }
            
            .project-card {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <!-- 헤더 섹션 -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <img src="profile-image.jpg" alt="프로필 사진" class="profile-image">
                <div class="header-info">
                    <h1>[이름]</h1>
                    <div class="title">풀스택 개발자 / 프론트엔드 개발자</div>
                    <div class="description">
                        사용자 중심의 웹 애플리케이션을 개발하며, 
                        최신 기술 트렌드를 활용한 혁신적인 솔루션을 제공합니다.
                    </div>
                    <div class="contact-info">
                        <div class="contact-item">
                            <span>📧</span>
                            <a href="mailto:your.email@example.com">your.email@example.com</a>
                        </div>
                        <div class="contact-item">
                            <span>📱</span>
                            <a href="tel:+82-10-1234-5678">010-1234-5678</a>
                        </div>
                        <div class="contact-item">
                            <span>🔗</span>
                            <a href="https://github.com/yourusername" target="_blank">GitHub</a>
                        </div>
                        <div class="contact-item">
                            <span>💼</span>
                            <a href="https://linkedin.com/in/yourprofile" target="_blank">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- 핵심 역량 섹션 -->
        <section class="section">
            <h2 class="section-title">핵심 역량</h2>
            <div class="skills-grid">
                ${Object.entries(data.skills).map(([category, skills]) => `
                    <div class="skill-card">
                        <h3>${getCategoryName(category)}</h3>
                        <div class="skill-tags">
                            ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>

        <!-- 프로젝트 섹션 -->
        <section class="section">
            <h2 class="section-title">주요 프로젝트</h2>
            ${data.projects.map(project => `
                <div class="project-card">
                    <div class="project-header">
                        <div>
                            <h3 class="project-title">${project.title}</h3>
                            <p class="project-description">${project.description}</p>
                        </div>
                        <span class="project-period">${project.period}</span>
                    </div>
                    
                    <div class="project-details">
                        <div class="project-detail">
                            <h4>주요 성과</h4>
                            <ul>
                                ${project.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="project-detail">
                            <h4>기술 스택</h4>
                            <div class="tech-stack">
                                ${Object.values(project.techStack).flat().map(tech => 
                                    `<span class="tech-tag">${tech}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="project-links">
                        ${project.links.github ? `<a href="${project.links.github}" class="project-link">🔗 GitHub</a>` : ''}
                        ${project.links.demo ? `<a href="${project.links.demo}" class="project-link">🌐 Live Demo</a>` : ''}
                        ${project.links.documentation ? `<a href="${project.links.documentation}" class="project-link">📄 문서</a>` : ''}
                    </div>
                </div>
            `).join('')}
        </section>

        <!-- 경력 섹션 -->
        <section class="section">
            <h2 class="section-title">경력 사항</h2>
            ${data.experience.map(exp => `
                <div class="experience-item">
                    <div class="experience-period">${exp.period}</div>
                    <div class="experience-content">
                        <h3>${exp.title}</h3>
                        <div class="company">${exp.company}</div>
                        <div class="description">${exp.description}</div>
                    </div>
                </div>
            `).join('')}
        </section>
    </div>
</body>
</html>`;
}

// 카테고리명 매핑
function getCategoryName(category) {
  const categoryNames = {
    'frontend': '프론트엔드',
    'backend': '백엔드 & 데이터베이스',
    'devops': 'DevOps & 배포',
    'tools': '개발 도구'
  };
  return categoryNames[category] || category;
}

// HTML 생성 및 저장
async function generateResume() {
  try {
    console.log('기술 경력서 생성 시작...');
    
    const htmlContent = generateResumeHTML(projectData);
    
    // HTML 파일 저장
    const htmlPath = path.join(__dirname, '../docs/tech-resume.html');
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log(`기술 경력서 생성 완료: ${htmlPath}`);
    console.log('브라우저에서 확인하세요!');
    
  } catch (error) {
    console.error('기술 경력서 생성 중 오류 발생:', error);
  }
}

generateResume();
