const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 4000;

// Sample Job Database
const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Flutter & Mobile Developer',
    company: 'TechCorp Vietnam',
    location: 'TP. Hồ Chí Minh (Hybrid)',
    salary: '$1,500 - $2,500',
    type: 'Full-time',
    posted: '2 giờ trước',
    skills: ['Flutter', 'Dart', 'REST API', 'SQL Server', 'Git', 'State Management (Bloc/Provider)'],
    description: 'Xây dựng ứng dụng di động đa nền tảng kết nối API Gateway NestJS, tối ưu hiệu năng UI/UX và tích hợp thông báo Push Notification.',
    matchScore: 94
  },
  {
    id: 'job-2',
    title: 'Fullstack Node.js & React Architect',
    company: 'InnovateX Solutions',
    location: 'Hà Nội',
    salary: '$1,800 - $3,000',
    type: 'Full-time',
    posted: '5 giờ trước',
    skills: ['Node.js', 'NestJS', 'React', 'TypeScript', 'SQL Server', 'Docker', 'Redis'],
    description: 'Phát triển kiến trúc Microservices Monorepo, tối ưu hóa các RESTful endpoints và cơ sở dữ liệu lớn.',
    matchScore: 88
  },
  {
    id: 'job-3',
    title: 'AI & Data NLP Engineer (Python / FastAPI)',
    company: 'AI Automation Lab',
    location: 'Đà Nẵng (Remote)',
    salary: '$2,000 - $3,500',
    type: 'Full-time',
    posted: '1 ngày trước',
    skills: ['Python', 'FastAPI', 'PyTorch', 'Scikit-Learn', 'NLP', 'Amazon Comprehend', 'Docker'],
    description: 'Xây dựng pipeline cào dữ liệu JD tuyển dụng, trích xuất thực thể tên kỹ năng bằng NLP và huấn luyện mô hình Recommendation.',
    matchScore: 91
  },
  {
    id: 'job-4',
    title: 'Database Administrator & SQL Server Specialist',
    company: 'FinTech Global',
    location: 'TP. Hồ Chí Minh',
    salary: '$1,400 - $2,200',
    type: 'Full-time',
    posted: '3 ngày trước',
    skills: ['SQL Server', 'T-SQL', 'Database Tuning', 'Stored Procedures', 'C#', '.NET Core'],
    description: 'Quản trị và tối ưu hóa hệ thống CSDL MS SQL Server 2022, viết Stored Procedures phức tạp và đảm bảo High Availability.',
    matchScore: 82
  },
  {
    id: 'job-5',
    title: 'Junior Web & Mobile Developer',
    company: 'NextGen Startup',
    location: 'Hà Nội (Hybrid)',
    salary: '$700 - $1,200',
    type: 'Full-time',
    posted: 'Hôm nay',
    skills: ['JavaScript', 'Flutter', 'HTML/CSS', 'SQL Server', 'Git'],
    description: 'Tham gia phát triển các tính năng giao diện người dùng, tích hợp API và hỗ trợ bảo trì hệ thống backend hiện tại.',
    matchScore: 78
  }
];

const MOCK_STATS = {
  totalJobs: 1240,
  analyzedCVs: 3850,
  avgMatchRate: '87.4%',
  topSkills: [
    { name: 'SQL Server', demand: '82%' },
    { name: 'Flutter', demand: '76%' },
    { name: 'Node.js / NestJS', demand: '89%' },
    { name: 'Python (NLP / AI)', demand: '68%' },
    { name: 'Docker / DevOps', demand: '71%' }
  ]
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Endpoint: Health
  if (pathname === '/api/health' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() }));
    return;
  }

  // Endpoint: Get Jobs
  if (pathname === '/api/jobs' && req.method === 'GET') {
    const keyword = (parsedUrl.query.q || '').toLowerCase();
    let filtered = MOCK_JOBS;
    if (keyword) {
      filtered = MOCK_JOBS.filter(job => 
        job.title.toLowerCase().includes(keyword) ||
        job.company.toLowerCase().includes(keyword) ||
        job.skills.some(s => s.toLowerCase().includes(keyword))
      );
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: filtered.length, data: filtered }));
    return;
  }

  // Endpoint: Stats
  if (pathname === '/api/stats' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: MOCK_STATS }));
    return;
  }

  // Endpoint: AI CV Matcher simulation
  if (pathname === '/api/match' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userSkills = payload.skills || ['Flutter', 'Node.js', 'SQL Server', 'Git', 'JavaScript'];
        const cvName = payload.fileName || 'Candidate_CV.pdf';

        // Calculate match scores for all jobs based on user skills
        const results = MOCK_JOBS.map(job => {
          const matchedSkills = job.skills.filter(s => 
            userSkills.some(us => us.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(us.toLowerCase()))
          );
          const missingSkills = job.skills.filter(s => !matchedSkills.includes(s));
          const score = Math.min(99, Math.max(50, Math.round((matchedSkills.length / job.skills.length) * 100) + 15));

          return {
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            salary: job.salary,
            score: score,
            matchedSkills: matchedSkills,
            missingSkills: missingSkills
          };
        }).sort((a, b) => b.score - a.score);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          cvName: cvName,
          extractedSkills: userSkills,
          overallCompatibility: results[0] ? results[0].score : 85,
          recommendedJobs: results
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API Gateway listening on port ${PORT}`);
});
