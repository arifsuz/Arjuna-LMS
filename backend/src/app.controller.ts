import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';

@ApiTags('System Health')
@Controller()
export class AppController {
  @Get(['', 'api'])
  @ApiOperation({ summary: 'Enterprise System Overview & Status' })
  getRoot(@Req() req: Request, @Res() res: Response) {
    const isHtml = req.headers.accept?.includes('text/html');

    const domain =
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://arjuna-api.sandiwarno.tech'
        : `http://${req.get('host') || 'localhost:4000'}`);

    const data = {
      status: 'operational',
      service: 'ARJUNA LMS Backend API & Real-Time Engine',
      version: '2.1.0',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      domain: domain,
      uptime: `${Math.floor(process.uptime())} seconds`,
      timestamp: new Date().toISOString(),
      architecture: {
        runtime: 'NestJS 11 + Node.js',
        database: 'PostgreSQL 16 via Prisma 7 (@prisma/adapter-pg)',
        connectionPool: {
          max: parseInt(process.env.DB_POOL_MAX || '25', 10),
          idleTimeoutMs: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10),
          connTimeoutMs: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '5000', 10),
        },
        cacheAndRealtime: 'Redis 7 (Socket.IO Adapter)',
        security: 'Argon2id + JWT + Strict RBAC Multi-Level Isolation',
      },
      documentation: {
        swaggerUi: `${domain}/api/docs`,
        healthCheck: `${domain}/api/health`,
      },
      endpoints: {
        auth: '/api/auth/login, /api/auth/me, /api/auth/refresh, /api/auth/logout',
        users: '/api/admin/users, /api/users/me',
        courses: '/api/courses, /api/admin/courses',
        threads: '/api/courses/:courseId/threads, /api/threads/:threadId',
        academic: '/api/academic/courses/:id/modules, /api/academic/courses/:id/gradebook',
        datasets: '/api/datasets/export, /api/datasets/compliance',
        health: '/api/health',
      },
    };

    if (isHtml) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(this.renderEnterpriseLandingHtml(data));
    }

    return res.json(data);
  }

  @Get(['health', 'api/health'])
  @ApiOperation({ summary: 'System Health Check & Uptime' })
  getHealth(@Req() req: Request, @Res() res: Response) {
    const memory = process.memoryUsage();
    return res.json({
      status: 'healthy',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memoryUsage: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
      },
    });
  }

  private renderEnterpriseLandingHtml(data: any): string {
    const swaggerUrl = data.documentation.swaggerUi;
    const healthUrl = data.documentation.healthCheck;
    const frontendUrl =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://arjuna.sandiwarno.tech'
        : 'http://localhost:3000');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARJUNA LMS — Enterprise API Engine & Real-Time Gateway</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-deep: #030d1d;
      --bg-card: rgba(6, 26, 59, 0.75);
      --border-gold: rgba(201, 160, 92, 0.35);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --gold-primary: #C9A05C;
      --gold-light: #ebd09e;
      --text-main: #FBF8F3;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: radial-gradient(circle at 50% 0%, #0a3266 0%, var(--bg-deep) 65%, #020710 100%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      overflow-x: hidden;
    }
    .container {
      width: 100%;
      max-width: 860px;
      position: relative;
      z-index: 10;
    }
    .ambient-glow {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(201, 160, 92, 0.15) 0%, rgba(10, 50, 102, 0) 70%);
      top: -120px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 0;
    }
    .card {
      background: var(--bg-card);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border-gold);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(10, 50, 102, 0.3);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, transparent, var(--gold-primary), transparent);
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .brand-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .brand-gradient {
      background: linear-gradient(135deg, #ffffff 0%, var(--gold-light) 60%, var(--gold-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
      margin-top: 0.75rem;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }
    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 0.9rem 1.4rem;
      border-radius: 14px;
      font-size: 0.9375rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0A3266 0%, #174b8c 100%);
      color: #ffffff;
      border: 1px solid rgba(201, 160, 92, 0.5);
      box-shadow: 0 8px 20px -4px rgba(10, 50, 102, 0.6);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      border-color: var(--gold-primary);
      box-shadow: 0 12px 28px -4px rgba(201, 160, 92, 0.3);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      border: 1px solid var(--border-subtle);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(201, 160, 92, 0.3);
      transform: translateY(-2px);
    }
    .specs-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      background: rgba(3, 13, 29, 0.5);
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }
    .specs-table tr {
      border-bottom: 1px solid var(--border-subtle);
    }
    .specs-table tr:last-child {
      border-bottom: none;
    }
    .specs-table td {
      padding: 0.85rem 1.25rem;
      font-size: 0.875rem;
    }
    .specs-table td:first-child {
      font-weight: 600;
      color: var(--gold-light);
      width: 35%;
    }
    .specs-table td:last-child {
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1 class="brand-title">
          <span class="brand-gradient">ARJUNA LMS</span>
        </h1>
        <p style="color: var(--gold-light); font-weight: 500; font-size: 0.95rem;">
          Enterprise REST API Engine & Real-Time Gateway
        </p>
        <div class="badge">
          <span class="pulse-dot"></span>
          <span>System Status: 100% Operational (${data.environment.toUpperCase()})</span>
        </div>
      </div>

      <div class="action-grid">
        <a href="${swaggerUrl}" class="btn btn-primary">
          <span>📖</span>
          <span>OpenAPI / Swagger UI</span>
        </a>
        <a href="${healthUrl}" class="btn btn-secondary">
          <span>🩺</span>
          <span>Health JSON Check</span>
        </a>
        <a href="${frontendUrl}" target="_blank" class="btn btn-secondary">
          <span>🎓</span>
          <span>Buka Aplikasi LMS</span>
        </a>
      </div>

      <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-top: 1.5rem;">
        ⚙️ Informasi Spesifikasi & Arsitektur Server
      </h3>
      <table class="specs-table">
        <tr>
          <td>Service Identity</td>
          <td>${data.service}</td>
        </tr>
        <tr>
          <td>Release Version</td>
          <td>v${data.version}</td>
        </tr>
        <tr>
          <td>Active Endpoint</td>
          <td>${data.domain}</td>
        </tr>
        <tr>
          <td>Runtime & Framework</td>
          <td>${data.architecture.runtime}</td>
        </tr>
        <tr>
          <td>Primary Database</td>
          <td>${data.architecture.database}</td>
        </tr>
        <tr>
          <td>Connection Pool Tuning</td>
          <td>Max: ${data.architecture.connectionPool.max} | Idle: ${data.architecture.connectionPool.idleTimeoutMs}ms | Timeout: ${data.architecture.connectionPool.connTimeoutMs}ms</td>
        </tr>
        <tr>
          <td>Pub/Sub & WebSocket</td>
          <td>${data.architecture.cacheAndRealtime}</td>
        </tr>
        <tr>
          <td>Security & Auth</td>
          <td>${data.architecture.security}</td>
        </tr>
        <tr>
          <td>Research AI Pipeline</td>
          <td>ARJUNA-Net 18-Labels Dataset Extraction Pipeline</td>
        </tr>
        <tr>
          <td>Server Uptime</td>
          <td>${data.uptime}</td>
        </tr>
      </table>

      <div class="footer">
        <p>© 2026 <strong>Muhamad Nur Arif</strong> — ARJUNA LMS Academic & AI Research Engine. Hak Cipta Dilindungi.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}

