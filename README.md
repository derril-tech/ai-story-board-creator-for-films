# AI Storyboard Creator for Films

[![CI/CD](https://github.com/your-org/ai-storyboard-creator/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/ai-storyboard-creator/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-green.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

## 🎬 What is AI Storyboard Creator?

**AI Storyboard Creator** is a revolutionary cloud-based platform that transforms screenplay text into professional storyboards using artificial intelligence. It's designed specifically for filmmakers, production companies, and creative professionals who need to visualize their scripts quickly and efficiently.

### What the Product Does

The platform provides an end-to-end solution for storyboard creation:

1. **Script Upload & Parsing**: Upload screenplays in FDX (Final Draft), Fountain, or PDF formats
2. **AI-Powered Scene Analysis**: Automatically extracts scenes, characters, dialogue, and action descriptions
3. **Intelligent Shot Planning**: Generates shot lists with camera angles, movements, and compositions
4. **AI Frame Generation**: Creates visual frames using Stable Diffusion with cinematic style presets
5. **Dialogue Timing**: Calculates speaking rates and generates timing for each shot
6. **Animatic Creation**: Combines frames with dialogue to create moving storyboards
7. **Export & Sharing**: Export as PDF booklets, MP4 videos, or JSON metadata

### Benefits of the Product

#### 🚀 **Speed & Efficiency**
- **90% faster** storyboard creation compared to traditional hand-drawing
- **Automated workflow** from script to final storyboard in minutes, not days
- **Batch processing** for entire scenes or sequences

#### 💰 **Cost Savings**
- **Eliminates** the need for expensive storyboard artists for initial concepts
- **Reduces** pre-production time and associated costs
- **Scales** from indie films to major productions

#### 🎯 **Professional Quality**
- **Cinematic style presets** (sketch, storyboard, concept art, photorealistic)
- **Industry-standard** shot compositions and camera movements
- **Consistent visual style** across all frames

#### 🔄 **Iteration & Collaboration**
- **Real-time editing** and frame regeneration
- **Version control** for different storyboard cuts
- **Team collaboration** with comments and feedback
- **Easy sharing** with stakeholders and crew

#### 🎨 **Creative Freedom**
- **Custom style training** for unique visual aesthetics
- **Flexible export formats** for different production needs
- **Integration** with existing production workflows

## 🏗️ Architecture

This is a modern, cloud-native application built with:

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and React
- **Backend API**: NestJS with TypeORM and PostgreSQL
- **AI Workers**: Python FastAPI services for script parsing, frame generation, and exports
- **Infrastructure**: Docker, Kubernetes-ready, AWS-compatible
- **Observability**: OpenTelemetry, Prometheus, Grafana, Sentry

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- PostgreSQL 16
- Redis 7

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ai-storyboard-creator.git
   cd ai-storyboard-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd api && npm install
   cd ../frontend && npm install
   cd ../workers && pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development environment**
   ```bash
   # Start all services with Docker Compose
   docker-compose up -d
   
   # Or start individual services
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - Monitoring: http://localhost:9090 (Prometheus)

## 📁 Project Structure

```
ai-storyboard-creator/
├── frontend/                 # Next.js 14 frontend application
│   ├── components/          # React components
│   ├── pages/              # Next.js pages
│   ├── styles/             # Tailwind CSS styles
│   └── public/             # Static assets
├── api/                    # NestJS backend API
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── entities/       # TypeORM entities
│   │   ├── core/           # Core services
│   │   └── common/         # Shared utilities
│   └── test/               # API tests
├── workers/                # Python FastAPI workers
│   ├── script_worker/      # Script parsing service
│   ├── illustration_worker/ # Frame generation service
│   ├── animatic_worker/    # Animatic creation service
│   └── export_worker/      # Export generation service
├── infra/                  # Infrastructure configuration
│   ├── monitoring/         # Prometheus, Grafana configs
│   └── terraform/          # AWS infrastructure
├── tests/                  # End-to-end tests
│   ├── e2e/               # Playwright E2E tests
│   ├── load/              # Load and chaos tests
│   └── fixtures/          # Test data
└── docs/                   # Documentation
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test:unit

# End-to-end tests
npm run test:e2e

# Load tests
npm run test:load

# All tests
npm test
```

### Test Coverage

- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest
- **Workers**: Pytest
- **E2E**: Playwright with multi-browser support
- **Load Testing**: Chaos engineering and performance tests

## 🚀 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **AWS Deployment**
   ```bash
   cd infra/terraform
   terraform init
   terraform plan
   terraform apply
   ```

### Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://host:6379

# NATS
NATS_URL=nats://host:4222

# MinIO/S3
MINIO_ENDPOINT=host:9000
MINIO_ACCESS_KEY=your-key
MINIO_SECRET_KEY=your-secret

# JWT
JWT_SECRET=your-secret-key

# Sentry (optional)
SENTRY_DSN=your-sentry-dsn
```

## 📊 Monitoring & Observability

The application includes comprehensive monitoring:

- **Metrics**: Prometheus with custom storyboard metrics
- **Logging**: Structured logging with correlation IDs
- **Tracing**: OpenTelemetry with Jaeger
- **Error Tracking**: Sentry integration
- **Dashboards**: Grafana dashboards for system health

## 🔧 Configuration

### Style Presets

The platform includes four built-in style presets:

1. **Sketch**: Quick pencil sketch style for initial concepts
2. **Storyboard**: Classic storyboard style with clear composition
3. **Concept Art**: Detailed concept art with atmosphere
4. **Photorealistic**: High-quality photorealistic renders

### Custom Styles

You can train custom style models by:

1. Providing training images
2. Configuring style parameters
3. Fine-tuning the AI model
4. Deploying the custom style

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards

- **TypeScript**: Strict mode, ESLint, Prettier
- **Python**: Black, Flake8, MyPy
- **Tests**: Minimum 80% coverage
- **Documentation**: JSDoc and docstrings

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/ai-storyboard-creator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/ai-storyboard-creator/discussions)
- **Email**: support@aistoryboard.com

## 🙏 Acknowledgments

- **Stable Diffusion** for AI image generation
- **Final Draft** for FDX format support
- **Fountain** for screenplay markup
- **OpenAI** for inspiration and AI capabilities

---

**Made with ❤️ for filmmakers everywhere**
