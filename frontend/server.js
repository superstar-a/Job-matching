const http = require('http');

const PORT = process.env.PORT || 3000;
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JobMatch AI - Nền Tảng Gợi Ý Việc Làm Thông Minh</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0b0f19;
      --bg-card: rgba(21, 28, 45, 0.7);
      --bg-card-hover: rgba(30, 41, 66, 0.85);
      --border-color: rgba(255, 255, 255, 0.08);
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.35);
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-pink: #ec4899;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --font-main: 'Inter', sans-serif;
      --font-heading: 'Outfit', sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-main);
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 85% 75%, rgba(6, 182, 212, 0.12) 0%, transparent 40%);
      background-attachment: fixed;
      line-height: 1.6;
    }

    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

    header {
      background: rgba(11, 15, 25, 0.8);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
      position: sticky; top: 0; z-index: 100;
    }
    .header-content {
      display: flex; justify-content: space-between; align-items: center;
      height: 70px;
    }
    .logo {
      display: flex; align-items: center; gap: 10px;
      font-family: var(--font-heading); font-size: 22px; font-weight: 700;
      color: #fff; text-decoration: none;
    }
    .logo-badge {
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
      letter-spacing: 0.5px; text-transform: uppercase;
    }
    .nav-tabs { display: flex; gap: 8px; }
    .nav-tab {
      padding: 8px 16px; border-radius: 10px; border: none;
      background: transparent; color: var(--text-muted);
      font-weight: 500; font-size: 14px; cursor: pointer;
      transition: all 0.2s ease;
    }
    .nav-tab:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
    .nav-tab.active {
      color: #fff; background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      box-shadow: 0 0 15px var(--primary-glow);
    }

    .status-bar {
      display: flex; align-items: center; gap: 12px;
      font-size: 12px; color: var(--text-muted);
    }
    .status-indicator {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255, 255, 255, 0.04); padding: 4px 10px; border-radius: 20px;
      border: 1px solid var(--border-color);
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-emerald); }

    .hero {
      padding: 40px 0 25px; text-align: center; max-width: 800px; margin: 0 auto;
    }
    .hero h1 {
      font-family: var(--font-heading); font-size: 38px; font-weight: 800;
      background: linear-gradient(135deg, #ffffff 30%, var(--accent-cyan));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
    }
    .hero p { color: var(--text-muted); font-size: 16px; margin-bottom: 24px; }

    .search-box {
      display: flex; gap: 12px; background: var(--bg-card);
      padding: 10px; border-radius: 16px; border: 1px solid var(--border-color);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3); backdrop-filter: blur(12px);
      margin-bottom: 30px;
    }
    .search-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #fff; padding: 0 16px; font-size: 15px;
    }
    .btn-search {
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      color: #fff; border: none; padding: 12px 28px; border-radius: 12px;
      font-weight: 600; cursor: pointer; transition: transform 0.2s;
    }
    .btn-search:hover { transform: translateY(-2px); }

    .skill-chips { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 30px; }
    .chip {
      padding: 6px 14px; border-radius: 20px; font-size: 13px;
      background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color);
      color: var(--text-muted); cursor: pointer; transition: all 0.2s;
    }
    .chip:hover, .chip.active {
      background: rgba(99, 102, 241, 0.25); border-color: var(--primary); color: #fff;
    }

    .view-content { display: none; }
    .view-content.active { display: block; }

    .job-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
    .job-card {
      background: var(--bg-card); border-radius: 18px; border: 1px solid var(--border-color);
      padding: 24px; transition: all 0.3s ease; position: relative; overflow: hidden;
      backdrop-filter: blur(12px); display: flex; flex-direction: column; justify-content: space-between;
    }
    .job-card:hover {
      transform: translateY(-4px); background: var(--bg-card-hover);
      border-color: rgba(99, 102, 241, 0.4); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }
    .job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .job-title { font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .company-name { font-size: 13px; color: var(--accent-cyan); font-weight: 500; }
    .match-badge {
      background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);
      border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 20px;
      font-size: 12px; font-weight: 700; white-space: nowrap;
    }
    .job-meta { display: flex; gap: 14px; font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
    .job-desc { font-size: 14px; color: #d1d5db; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
    .tag {
      background: rgba(255, 255, 255, 0.05); color: #e5e7eb; font-size: 11px;
      padding: 3px 10px; border-radius: 6px; border: 1px solid var(--border-color);
    }
    .btn-apply {
      width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--primary);
      background: rgba(99, 102, 241, 0.15); color: #fff; font-weight: 600; cursor: pointer;
      transition: all 0.2s; text-align: center;
    }
    .btn-apply:hover { background: var(--primary); box-shadow: 0 0 15px var(--primary-glow); }

    .upload-box {
      border: 2px dashed var(--primary); border-radius: 20px; padding: 40px; text-align: center;
      background: rgba(99, 102, 241, 0.05); cursor: pointer; transition: all 0.3s; margin-bottom: 30px;
    }
    .upload-box:hover { background: rgba(99, 102, 241, 0.12); }
    .upload-icon { font-size: 48px; margin-bottom: 12px; }
    .progress-bar-wrap {
      background: rgba(255, 255, 255, 0.1); border-radius: 10px; height: 10px;
      overflow: hidden; margin: 20px 0 10px; display: none;
    }
    .progress-bar {
      height: 100%; width: 0%; background: linear-gradient(90deg, var(--primary), var(--accent-cyan));
      transition: width 0.4s ease;
    }
    .ai-status-text { font-size: 13px; color: var(--accent-cyan); display: none; margin-bottom: 20px; text-align: center; }

    .match-results { display: none; margin-top: 30px; }
    .results-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
    .score-card {
      background: var(--bg-card); border-radius: 18px; padding: 30px; border: 1px solid var(--border-color);
      text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .score-circle {
      width: 130px; height: 130px; border-radius: 50%;
      background: conic-gradient(var(--accent-emerald) 88%, rgba(255, 255, 255, 0.1) 0);
      display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
      position: relative;
    }
    .score-circle::after {
      content: ''; position: absolute; width: 100px; height: 100px;
      border-radius: 50%; background: var(--bg-dark);
    }
    .score-number { position: relative; z-index: 2; font-family: var(--font-heading); font-size: 32px; font-weight: 800; color: #fff; }
    .match-job-list { margin-top: 20px; display: grid; gap: 12px; }
    .match-job-item {
      border: 1px solid var(--border-color); border-radius: 12px; padding: 14px;
      background: rgba(255, 255, 255, 0.04);
    }
    .match-job-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .match-job-title { font-weight: 700; font-size: 15px; }
    .match-job-meta { color: var(--text-muted); font-size: 12px; margin-top: 4px; }
    .match-job-score { color: var(--accent-emerald); font-weight: 800; white-space: nowrap; }
    .match-job-reason { color: #d1d5db; font-size: 12px; line-height: 1.5; margin-top: 10px; }

    .assistant-shell { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr); gap: 20px; align-items: start; }
    .assistant-chat-panel, .assistant-results-panel, .assistant-detail-panel {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 16px; padding: 20px; backdrop-filter: blur(12px);
    }
    .assistant-panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    .assistant-panel-title { font-family: var(--font-heading); font-size: 20px; font-weight: 700; }
    .assistant-panel-subtitle { color: var(--text-muted); font-size: 12px; margin-top: 2px; }
    .assistant-messages {
      height: 360px; overflow-y: auto; display: flex; flex-direction: column;
      gap: 12px; padding-right: 4px; margin-bottom: 12px;
    }
    .assistant-message {
      max-width: 88%; padding: 12px 14px; border-radius: 14px;
      border: 1px solid var(--border-color); font-size: 14px; line-height: 1.5;
      overflow-wrap: anywhere;
    }
    .assistant-message.assistant { align-self: flex-start; background: rgba(6, 182, 212, 0.08); }
    .assistant-message.user { align-self: flex-end; background: rgba(99, 102, 241, 0.18); }
    .assistant-attachment {
      min-height: 28px; color: var(--text-muted); font-size: 12px;
      display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
    }
    .assistant-input-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) 104px; gap: 10px; align-items: stretch; }
    .assistant-file-btn {
      border: 1px solid var(--border-color); border-radius: 12px;
      background: rgba(255, 255, 255, 0.06); color: #fff; cursor: pointer; font-weight: 800;
    }
    .assistant-file-btn:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }
    .assistant-input {
      width: 100%; min-height: 48px; max-height: 120px; resize: vertical;
      border-radius: 12px; border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.05); color: #fff; padding: 12px;
      font-family: inherit; outline: none; line-height: 1.4;
    }
    .assistant-input:focus { border-color: var(--primary); }
    .assistant-job-results { display: grid; gap: 12px; margin-top: 14px; }
    .assistant-job-card {
      border: 1px solid var(--border-color); border-radius: 14px; padding: 14px;
      background: rgba(255, 255, 255, 0.04); cursor: pointer; transition: all 0.2s ease;
    }
    .assistant-job-card:hover, .assistant-job-card.active { border-color: var(--accent-cyan); background: rgba(6, 182, 212, 0.08); }
    .assistant-job-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .assistant-job-title { font-weight: 800; font-size: 15px; line-height: 1.35; }
    .assistant-job-meta { color: var(--text-muted); font-size: 12px; margin-top: 5px; }
    .assistant-score { color: var(--accent-emerald); font-weight: 800; white-space: nowrap; }
    .assistant-detail-panel { margin-top: 16px; }
    .assistant-detail-empty { color: var(--text-muted); font-size: 13px; line-height: 1.6; }
    .assistant-detail-title { font-family: var(--font-heading); font-size: 19px; margin-bottom: 4px; }
    .assistant-detail-meta { color: var(--text-muted); font-size: 12px; margin-bottom: 14px; }
    .assistant-detail-desc { color: #d1d5db; font-size: 13px; line-height: 1.6; margin-bottom: 14px; }
    .assistant-section-label { color: var(--text-muted); font-size: 12px; font-weight: 700; margin: 12px 0 6px; text-transform: uppercase; }
    .assistant-error { border-color: rgba(248, 113, 113, 0.4); background: rgba(248, 113, 113, 0.08); }

    @media (max-width: 900px) {
      .assistant-shell { grid-template-columns: 1fr; }
      .assistant-input-row { grid-template-columns: 44px minmax(0, 1fr); }
      .assistant-input-row .btn-search { grid-column: 1 / -1; }
      .results-grid { grid-template-columns: 1fr; }
    }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat-card {
      background: var(--bg-card); padding: 24px; border-radius: 16px; border: 1px solid var(--border-color);
      text-align: center;
    }
    .stat-num { font-family: var(--font-heading); font-size: 32px; font-weight: 800; color: var(--accent-cyan); }
    .stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
    .insight-card {
      background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 16px; padding: 20px; margin-top: 20px; display: flex; gap: 16px; align-items: center;
    }

    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; color: var(--text-main); }
    .form-input {
      width: 100%; padding: 12px 16px; border-radius: 10px;
      background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color);
      color: #fff; font-family: inherit; outline: none;
    }
    .form-input:focus { border-color: var(--primary); }

    footer {
      border-top: 1px solid var(--border-color); padding: 30px 0; margin-top: 60px;
      text-align: center; color: var(--text-muted); font-size: 13px;
    }
  </style>
</head>
<body>

  <header>
    <div class="container header-content">
      <a href="#" class="logo">
        <span>⚡ JobMatch AI</span>
        <span class="logo-badge">Monorepo v1.0.0</span>
      </a>

      <nav class="nav-tabs">
        <button class="nav-tab active" onclick="switchTab('assistant', event)">💬 Chat Assistant</button>
        <button class="nav-tab" onclick="switchTab('matcher', event)">🤖 AI CV Matcher</button>
        <button class="nav-tab" onclick="switchTab('analytics', event)">📊 Thống Kê Kỹ Năng</button>
        <button class="nav-tab" onclick="switchTab('employer', event)">💼 Nhà Tuyển Dụng</button>
      </nav>

      <div class="status-bar">
        <div class="status-indicator"><span class="dot"></span> Backend: <b>4000</b></div>
        <div class="status-indicator"><span class="dot"></span> AI Service: <b>8000</b></div>
        <div class="status-indicator"><span class="dot"></span> MSSQL DB: <b>1434</b></div>
      </div>
    </div>
  </header>

  <main class="container">

    <!-- TAB 1: AI CV MATCHER -->
    <div id="tab-matcher" class="view-content">
      <div style="max-width: 800px; margin: 0 auto;">
        <div class="upload-box" onclick="triggerCVUpload()">
          <div class="upload-icon">📄</div>
          <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Tải lên CV của bạn (.PDF, .DOCX)</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Kéo thả file vào đây hoặc bấm để chọn tệp mô phỏng</p>
          <input type="file" id="cvFileInput" style="display: none;" onchange="startAIParsing(this)">
        </div>

        <div class="progress-bar-wrap" id="progressWrap">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        <div class="ai-status-text" id="aiStatusText">Đang bóc tách kỹ năng từ CV với Amazon Comprehend NLP...</div>

        <div class="match-results" id="matchResults">
          <h2 style="font-family: var(--font-heading); margin-bottom: 20px; font-size: 24px;">Kết Quả Phân Tích Độ Tương Thích</h2>
          <div class="results-grid">
            <div class="score-card">
              <div class="score-circle">
                <div class="score-number" id="resultScore">88%</div>
              </div>
              <h4 style="color: var(--accent-emerald);">Rất Phù Hợp</h4>
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">Dựa trên 6 kỹ năng trùng khớp với yêu cầu tuyển dụng</p>
            </div>

            <div class="score-card" style="align-items: flex-start; text-align: left;">
              <h4 style="margin-bottom: 12px;">Bóc Tách Kỹ Năng (NLP Entity Extraction):</h4>
              <div class="tags" id="extractedSkillTags" style="margin-bottom: 20px;">
                <span class="tag" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);">✔ Flutter</span>
                <span class="tag" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);">✔ SQL Server</span>
                <span class="tag" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);">✔ Node.js</span>
                <span class="tag" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);">✔ REST API</span>
                <span class="tag" style="background: rgba(239, 68, 68, 0.2); color: #f87171;">✖ Docker (Chưa có)</span>
              </div>
              <p style="font-size: 13px; color: var(--text-muted);">
                💡 <b>Dự đoán Machine Learning:</b> Cơ hội trúng tuyển vị trí <i>Mobile / Fullstack Developer</i> đạt <b>88.5%</b>. Khuyến nghị cập nhật thêm kỹ năng Docker.
              </p>
            </div>
          </div>
          <div class="match-job-list" id="recommendedJobList"></div>
        </div>
      </div>
    </div>

    <!-- TAB 2: CHAT ASSISTANT -->
    <div id="tab-assistant" class="view-content active">
      <div class="assistant-shell">
        <section class="assistant-chat-panel">
          <div class="assistant-panel-heading">
            <div>
              <div class="assistant-panel-title">Job Chat Assistant</div>
              <div class="assistant-panel-subtitle">Context-aware search with CV ranking</div>
            </div>
            <span class="match-badge" id="assistantSessionBadge">New session</span>
          </div>

          <div class="assistant-messages" id="assistantMessages">
            <div class="assistant-message assistant">Tell me the role, source, salary, location, or work mode you want. Attach a CV when you want ranking by fit.</div>
          </div>

          <div class="assistant-attachment" id="assistantAttachmentLabel">No CV attached</div>
          <div class="assistant-input-row">
            <button class="assistant-file-btn" onclick="triggerAssistantUpload()" title="Attach CV">CV</button>
            <textarea id="assistantInput" class="assistant-input" placeholder="Example: Find TopCV jobs above 20tr in HCM for Python backend" onkeydown="handleAssistantKeydown(event)"></textarea>
            <button class="btn-search" id="assistantSendButton" onclick="sendAssistantMessage()">Send</button>
            <input type="file" id="assistantCvInput" style="display: none;" onchange="handleAssistantUpload(this)">
          </div>
        </section>

        <aside>
          <section class="assistant-results-panel">
            <div class="assistant-panel-heading">
              <div>
                <div class="assistant-panel-title">Ranked Jobs</div>
                <div class="assistant-panel-subtitle" id="assistantFilterSummary">No filters yet</div>
              </div>
            </div>
            <div class="assistant-job-results" id="assistantJobResults">
              <div class="assistant-detail-empty">Search results will appear here.</div>
            </div>
          </section>

          <section class="assistant-detail-panel" id="assistantDetailPanel">
            <div class="assistant-detail-empty">Select a job to inspect match evidence.</div>
          </section>
        </aside>
      </div>
    </div>

    <!-- TAB 3: ANALYTICS -->
    <div id="tab-analytics" class="view-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num">1,240</div>
          <div class="stat-label">Mô tả công việc (JD) đã cào</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">3,850</div>
          <div class="stat-label">Hồ sơ CV đã được NLP xử lý</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">87.4%</div>
          <div class="stat-label">Tỷ lệ Match chính xác</div>
        </div>
      </div>

      <div style="background: var(--bg-card); border-radius: 18px; padding: 24px; border: 1px solid var(--border-color);">
        <h3 style="font-family: var(--font-heading); margin-bottom: 20px;">Top Kỹ Năng IT Được Yêu Cầu Nhanh Nhất (Khai Phá Dữ Liệu)</h3>
        
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
            <span>1. Node.js & NestJS</span> <span>89% tuyển dụng</span>
          </div>
          <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px;">
            <div style="width: 89%; height: 100%; background: var(--primary); border-radius: 4px;"></div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
            <span>2. SQL Server & Database Tuning</span> <span>82% tuyển dụng</span>
          </div>
          <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px;">
            <div style="width: 82%; height: 100%; background: var(--accent-cyan); border-radius: 4px;"></div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
            <span>3. Flutter & Cross-platform Mobile</span> <span>76% tuyển dụng</span>
          </div>
          <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px;">
            <div style="width: 76%; height: 100%; background: var(--accent-emerald); border-radius: 4px;"></div>
          </div>
        </div>
      </div>

      <div class="insight-card">
        <div style="font-size: 24px;">💡</div>
        <div>
          <h4 style="color: var(--accent-emerald); font-size: 15px; margin-bottom: 4px;">Phát hiện luật ẩn (Association Rules Mining):</h4>
          <p style="font-size: 13px; color: #d1d5db;">Hệ thống AI phát hiện <b>82% công ty tuyển lập trình viên Flutter</b> đều yêu cầu ứng viên có thêm kiến thức vững về <b>SQL Server</b> và giao tiếp <b>REST API</b>.</p>
        </div>
      </div>
    </div>

    <!-- TAB 4: EMPLOYER -->
    <div id="tab-employer" class="view-content">
      <div style="max-width: 600px; margin: 0 auto; background: var(--bg-card); padding: 30px; border-radius: 20px; border: 1px solid var(--border-color);">
        <h3 style="font-family: var(--font-heading); margin-bottom: 20px; font-size: 22px;">Đăng Tin Tuyển Dụng Mới (Mô phỏng JD)</h3>
        
        <div class="form-group">
          <label class="form-label">Tên vị trí tuyển dụng</label>
          <input type="text" id="newJobTitle" class="form-input" placeholder="Ví dụ: Backend Developer (NestJS + SQL Server)">
        </div>

        <div class="form-group">
          <label class="form-label">Tên Công ty</label>
          <input type="text" id="newJobCompany" class="form-input" placeholder="Tên công ty của bạn">
        </div>

        <div class="form-group">
          <label class="form-label">Mức lương dự kiến</label>
          <input type="text" id="newJobSalary" class="form-input" placeholder="$1,200 - $2,000">
        </div>

        <div class="form-group">
          <label class="form-label">Yêu cầu kỹ năng (Phân cách bằng dấu phẩy)</label>
          <input type="text" id="newJobSkills" class="form-input" placeholder="Flutter, SQL Server, REST API, Node.js">
        </div>

        <button class="btn-search" style="width: 100%; margin-top: 10px;" onclick="createNewJob()">Tạo Bài Tuyển Dụng & Lưu Vào DB</button>
      </div>
    </div>

  </main>

  <footer>
    <div class="container">
      <p>© 2026 JobMatch AI - Đề tài Phân tích và Gợi ý Việc làm Thông minh (Monorepo Node.js / FastAPI / MS SQL Server)</p>
    </div>
  </footer>

  <script>
    var BACKEND_API_URL = '${BACKEND_API_URL}';
    var jobsData = [
      {
        id: 'job-1',
        title: 'Senior Flutter & Mobile Developer',
        company: 'TechCorp Vietnam',
        location: 'TP. Hồ Chí Minh (Hybrid)',
        salary: '$1,500 - $2,500',
        skills: ['Flutter', 'Dart', 'REST API', 'SQL Server', 'Git'],
        description: 'Xây dựng ứng dụng di động đa nền tảng kết nối API Gateway NestJS và cơ sở dữ liệu SQL Server.',
        matchScore: 94
      },
      {
        id: 'job-2',
        title: 'Fullstack Node.js & React Architect',
        company: 'InnovateX Solutions',
        location: 'Hà Nội',
        salary: '$1,800 - $3,000',
        skills: ['Node.js', 'NestJS', 'React', 'TypeScript', 'SQL Server', 'Docker'],
        description: 'Phát triển kiến trúc Microservices Monorepo, tối ưu hóa các RESTful endpoints và cơ sở dữ liệu lớn.',
        matchScore: 88
      },
      {
        id: 'job-3',
        title: 'AI & Data NLP Engineer (Python / FastAPI)',
        company: 'AI Automation Lab',
        location: 'Đà Nẵng (Remote)',
        salary: '$2,000 - $3,500',
        skills: ['Python', 'FastAPI', 'PyTorch', 'NLP', 'Amazon Comprehend', 'Docker'],
        description: 'Xây dựng pipeline cào dữ liệu JD tuyển dụng, trích xuất thực thể tên kỹ năng bằng NLP và huấn luyện mô hình Machine Learning.',
        matchScore: 91
      },
      {
        id: 'job-4',
        title: 'Database Administrator & SQL Server Specialist',
        company: 'FinTech Global',
        location: 'TP. Hồ Chí Minh',
        salary: '$1,400 - $2,200',
        skills: ['SQL Server', 'T-SQL', 'Database Tuning', 'Stored Procedures'],
        description: 'Quản trị và tối ưu hóa hệ thống CSDL MS SQL Server 2022, viết Stored Procedures phức tạp.',
        matchScore: 82
      }
    ];

    var assistantConversationId = null;
    var assistantCvFile = null;
    var assistantLastDetails = [];

    function switchTab(tabName, evt) {
      document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.view-content').forEach(function(v) { v.classList.remove('active'); });
      
      if (evt && evt.target) evt.target.classList.add('active');
      var el = document.getElementById('tab-' + tabName);
      if (el) el.classList.add('active');
    }

    function triggerCVUpload() {
      document.getElementById('cvFileInput').click();
    }

    function startAIParsing(input) {
      var file = (input.files && input.files[0]) ? input.files[0] : null;
      var fileName = file ? file.name : 'CV_UngVien_Flutter.pdf';
      var progressWrap = document.getElementById('progressWrap');
      var progressBar = document.getElementById('progressBar');
      var statusText = document.getElementById('aiStatusText');
      var results = document.getElementById('matchResults');

      progressWrap.style.display = 'block';
      statusText.style.display = 'block';
      results.style.display = 'none';

      var matchRequest = readFileAsBase64(file)
        .then(function(fileBase64) {
          return requestCvMatch(buildMatchPayload(fileName, fileBase64));
        });

      var step = 0;
      var stepsText = [
        'Reading uploaded CV file ' + fileName + '...',
        'Calling AI-service /api/parse-cv...',
        'Ranking jobs through Backend /api/match...',
        'Rendering match score and recommendations...'
      ];

      var interval = setInterval(function() {
        step += 25;
        progressBar.style.width = step + '%';
        statusText.innerText = stepsText[Math.floor(step / 25) - 1] || stepsText[3];

        if (step >= 100) {
          clearInterval(interval);
          matchRequest
            .then(function(data) {
              renderMatchResults(data);
              progressWrap.style.display = 'none';
              statusText.style.display = 'none';
              results.style.display = 'block';
            })
            .catch(function(error) {
              console.log('CV match failed', error);
              statusText.innerText = 'Cannot connect to Backend API. Check backend port 4000 and try again.';
              progressBar.style.width = '0%';
            });
        }
      }, 500);
    }

    function readFileAsBase64(file) {
      return new Promise(function(resolve, reject) {
        if (!file) {
          resolve(null);
          return;
        }

        var reader = new FileReader();
        reader.onload = function() {
          var raw = String(reader.result || '');
          var parts = raw.split(',');
          resolve(parts.length > 1 ? parts[1] : raw);
        };
        reader.onerror = function() {
          reject(new Error('Cannot read CV file'));
        };
        reader.readAsDataURL(file);
      });
    }

    function buildMatchPayload(fileName, fileBase64) {
      var payload = {
        fileName: fileName,
        title: 'AI/Data Candidate',
        location: 'Vietnam',
        totalYearsExperience: 2,
        skills: ['Python', 'FastAPI', 'SQL', 'Docker', 'Git']
      };

      if (fileBase64) {
        payload.fileBase64 = fileBase64;
      }

      return payload;
    }

    function requestCvMatch(payload) {
      return fetch(BACKEND_API_URL + '/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(response) {
        if (!response.ok) {
          throw new Error('Backend match failed with status ' + response.status);
        }
        return response.json();
      }).then(function(data) {
        if (!data || !data.success) {
          throw new Error((data && data.error) || 'Backend match returned an invalid response');
        }
        return data;
      });
    }

    function renderMatchResults(data) {
      var score = Math.round(data.overallCompatibility || 0);
      var scoreEl = document.getElementById('resultScore');
      var scoreCircle = document.querySelector('.score-circle');
      var skillTags = document.getElementById('extractedSkillTags');
      var jobList = document.getElementById('recommendedJobList');
      var skills = data.extractedSkills || [];
      var jobs = (data.recommendedJobs || []).slice(0, 3);

      scoreEl.innerText = score + '%';
      scoreCircle.style.background = 'conic-gradient(var(--accent-emerald) ' + score + '%, rgba(255, 255, 255, 0.1) 0)';
      skillTags.innerHTML = skills.map(function(skill) {
        return '<span class="tag" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);">OK ' + escapeHtml(skill) + '</span>';
      }).join('');

      jobList.innerHTML = jobs.map(function(job) {
        return '<div class="match-job-item">' +
          '<div class="match-job-head">' +
            '<div>' +
              '<div class="match-job-title">' + escapeHtml(job.jobTitle || 'Untitled job') + '</div>' +
              '<div class="match-job-meta">' + escapeHtml(job.company || 'Unknown company') + ' - ' + escapeHtml(job.salary || 'Salary hidden') + '</div>' +
            '</div>' +
            '<div class="match-job-score">' + Math.round(job.score || 0) + '%</div>' +
          '</div>' +
          '<div class="match-job-reason">' + escapeHtml(job.recommendationReason || 'Matched skills: ' + (job.matchedSkills || []).join(', ')) + '</div>' +
        '</div>';
      }).join('');
    }

    function triggerAssistantUpload() {
      document.getElementById('assistantCvInput').click();
    }

    function handleAssistantUpload(input) {
      assistantCvFile = (input.files && input.files[0]) ? input.files[0] : null;
      var label = document.getElementById('assistantAttachmentLabel');
      label.innerText = assistantCvFile ? 'CV attached: ' + assistantCvFile.name : 'No CV attached';
    }

    function handleAssistantKeydown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendAssistantMessage();
      }
    }

    function sendAssistantMessage() {
      var input = document.getElementById('assistantInput');
      var message = input.value.trim();
      if (!message && !assistantCvFile) return;

      appendAssistantMessage('user', message || 'Uploaded CV');
      input.value = '';
      setAssistantLoading(true);

      buildAssistantChatPayload(message)
        .then(requestJobAssistantChat)
        .then(renderAssistantResponse)
        .catch(function(error) {
          console.log('Job assistant failed', error);
          appendAssistantMessage('assistant assistant-error', 'Cannot reach Backend /api/job-assistant/chat. Check backend port 4000 and try again.');
        })
        .finally(function() {
          setAssistantLoading(false);
        });
    }

    function buildAssistantChatPayload(message) {
      return readFileAsBase64(assistantCvFile).then(function(fileBase64) {
        var payload = {
          conversation_id: assistantConversationId,
          message: message
        };

        if (assistantCvFile) {
          payload.cv = {
            fileName: assistantCvFile.name
          };
          if (fileBase64) payload.cv.fileBase64 = fileBase64;
        }

        return payload;
      });
    }

    function requestJobAssistantChat(payload) {
      return fetch(BACKEND_API_URL + '/api/job-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(response) {
        if (!response.ok) {
          throw new Error('Backend assistant failed with status ' + response.status);
        }
        return response.json();
      }).then(function(data) {
        if (!data || !data.success) {
          throw new Error((data && data.error) || 'Backend assistant returned an invalid response');
        }
        return data;
      });
    }

    function renderAssistantResponse(data) {
      assistantConversationId = data.conversation_id || assistantConversationId;
      assistantLastDetails = data.job_details || [];

      document.getElementById('assistantSessionBadge').innerText = assistantConversationId ? 'Session active' : 'New session';
      document.getElementById('assistantFilterSummary').innerText = buildAssistantFilterSummary(data.filters || {}, data.selected_sources || []);
      appendAssistantMessage('assistant', data.assistant_message || 'I ranked the jobs I found.');
      if (assistantCvFile) {
        assistantCvFile = null;
        document.getElementById('assistantCvInput').value = '';
        document.getElementById('assistantAttachmentLabel').innerText = 'CV profile saved for this session';
      }

      var questions = data.follow_up_questions || [];
      if (questions.length > 0) {
        appendAssistantMessage('assistant', questions.join(' '));
      }

      renderAssistantJobCards(data.ranked_jobs || [], assistantLastDetails);
      if (assistantLastDetails.length > 0) {
        openAssistantJobDetail(0);
      } else {
        document.getElementById('assistantDetailPanel').innerHTML = '<div class="assistant-detail-empty">No job detail available yet.</div>';
      }
    }

    function renderAssistantJobCards(rankedJobs, details) {
      var container = document.getElementById('assistantJobResults');
      if (!rankedJobs.length) {
        container.innerHTML = '<div class="assistant-detail-empty">No ranked jobs for the current filters.</div>';
        return;
      }

      container.innerHTML = rankedJobs.map(function(job, index) {
        var detail = details[index] || {};
        var title = job.jobTitle || job.title || detail.title || 'Untitled job';
        var company = job.company || detail.company_name || 'Unknown company';
        var salary = job.salary || detail.salary || 'Salary hidden';
        var score = Math.round(job.score || detail.score || 0);
        return '<div class="assistant-job-card' + (index === 0 ? ' active' : '') + '" onclick="openAssistantJobDetail(' + index + ')">' +
          '<div class="assistant-job-card-head">' +
            '<div>' +
              '<div class="assistant-job-title">' + escapeHtml(title) + '</div>' +
              '<div class="assistant-job-meta">' + escapeHtml(company) + ' - ' + escapeHtml(salary) + '</div>' +
            '</div>' +
            '<div class="assistant-score">' + score + '%</div>' +
          '</div>' +
          '<div class="assistant-job-meta">' + escapeHtml(job.recommendationReason || detail.recommendation_reason || 'Open detail for match evidence') + '</div>' +
        '</div>';
      }).join('');
    }

    function openAssistantJobDetail(index) {
      var detail = assistantLastDetails[index];
      var panel = document.getElementById('assistantDetailPanel');
      document.querySelectorAll('.assistant-job-card').forEach(function(card, cardIndex) {
        card.classList.toggle('active', cardIndex === index);
      });

      if (!detail) {
        panel.innerHTML = '<div class="assistant-detail-empty">Select a job to inspect match evidence.</div>';
        return;
      }

      panel.innerHTML =
        '<div class="assistant-detail-title">' + escapeHtml(detail.title || 'Untitled job') + '</div>' +
        '<div class="assistant-detail-meta">' + escapeHtml(detail.company_name || 'Unknown company') + ' - ' +
          escapeHtml(detail.location || 'Location hidden') + ' - ' + escapeHtml(detail.salary || 'Salary hidden') + '</div>' +
        '<div class="assistant-detail-desc">' + escapeHtml(detail.description || 'No description available.') + '</div>' +
        '<div class="assistant-section-label">Matched skills</div>' +
        '<div class="tags">' + renderAssistantSkillTags(detail.matched_skills, true) + '</div>' +
        '<div class="assistant-section-label">Missing skills</div>' +
        '<div class="tags">' + renderAssistantSkillTags(detail.missing_skills, false) + '</div>' +
        '<div class="assistant-section-label">Reason</div>' +
        '<div class="assistant-detail-desc">' + escapeHtml(detail.recommendation_reason || 'No recommendation reason returned.') + '</div>';
    }

    function renderAssistantSkillTags(skills, positive) {
      var list = skills || [];
      if (!list.length) {
        return '<span class="tag">None</span>';
      }
      return list.map(function(skill) {
        var style = positive
          ? 'background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);'
          : 'background: rgba(236, 72, 153, 0.18); color: #f9a8d4;';
        return '<span class="tag" style="' + style + '">' + escapeHtml(skill) + '</span>';
      }).join('');
    }

    function appendAssistantMessage(role, text) {
      var messages = document.getElementById('assistantMessages');
      var bubble = document.createElement('div');
      bubble.className = 'assistant-message ' + role;
      bubble.innerText = text;
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    }

    function setAssistantLoading(isLoading) {
      var button = document.getElementById('assistantSendButton');
      button.disabled = isLoading;
      button.innerText = isLoading ? 'Sending' : 'Send';
    }

    function buildAssistantFilterSummary(filters, sources) {
      var parts = [];
      if (sources.length) parts.push('Sources: ' + sources.join(', '));
      if (filters.location) parts.push('Location: ' + filters.location);
      if (filters.work_mode) parts.push('Mode: ' + filters.work_mode);
      if (filters.salary_min) parts.push('Min salary: ' + filters.salary_min);
      return parts.length ? parts.join(' | ') : 'No filters yet';
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function createNewJob() {
      var title = document.getElementById('newJobTitle').value;
      var company = document.getElementById('newJobCompany').value;
      var salary = document.getElementById('newJobSalary').value;
      var skillsStr = document.getElementById('newJobSkills').value;

      if (!title || !company) { alert('Vui lòng nhập tên công việc và tên công ty!'); return; }

      var newJob = {
        id: 'job-' + (jobsData.length + 1),
        title: title,
        company: company,
        location: 'Việt Nam',
        salary: salary || '$1,000 - $2,000',
        skills: skillsStr ? skillsStr.split(',').map(function(s){ return s.trim(); }) : ['SQL Server', 'REST API'],
        description: 'Vị trí công việc mới tạo được lưu vào cơ sở dữ liệu SQL Server.',
        matchScore: 90
      };

      jobsData.unshift(newJob);
      alert('Đã thêm bài tuyển dụng thành công! Dùng Chat Assistant để tìm và phân tích job phù hợp.');
      switchTab('assistant');
    }

    function applyJob(title) {
      alert('Đã gửi hồ sơ ứng tuyển vị trí: ' + title + '\\nHệ thống AI đang tính toán cơ hội trúng tuyển!');
    }

  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML_CONTENT);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend UI server running on port ${PORT}`);
});
