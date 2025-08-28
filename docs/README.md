# AI Storyboard Creator - Documentation

## Overview

The AI Storyboard Creator is a comprehensive platform that transforms screenplays into fully illustrated storyboards using AI-powered analysis and generation. The system provides end-to-end functionality from script ingestion to final storyboard export.

## Architecture

### System Components

1. **Frontend (Next.js 14)**
   - Modern React application with TypeScript
   - Tailwind CSS for styling
   - Real-time updates via WebSocket
   - Drag-and-drop file uploads

2. **API Gateway (NestJS)**
   - RESTful API with OpenAPI 3.1 documentation
   - JWT authentication and RBAC
   - TypeORM for database operations
   - WebSocket support for real-time features

3. **Workers (Python/FastAPI)**
   - Script parsing worker (FDX/Fountain/PDF)
   - Shot planning worker
   - Illustration generation worker
   - Dialogue timing worker
   - Animatic creation worker
   - Export worker

4. **Infrastructure**
   - PostgreSQL 16 for data persistence
   - Redis for caching and sessions
   - NATS for event messaging
   - S3/MinIO for file storage
   - Docker containerization

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- Python 3.11+
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-story-board-creator-for-films
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose up -d postgres redis nats minio
   ```

3. **Install dependencies**
   ```bash
   # Root dependencies
   npm install
   
   # API dependencies
   cd api && npm install
   
   # Frontend dependencies
   cd ../frontend && npm install
   
   # Worker dependencies
   cd ../workers && pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp api/.env.example api/.env
   cp workers/.env.example workers/.env
   ```

5. **Run database migrations**
   ```bash
   cd api && npm run migration:run
   ```

6. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

### Production Deployment

1. **Build Docker images**
   ```bash
   docker-compose build
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Or deploy to cloud infrastructure**
   ```bash
   # Using Terraform
   cd infra/terraform
   terraform init
   terraform plan
   terraform apply
   ```

## API Documentation

### Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Scripts
- `POST /v1/scripts/upload` - Upload a script file
- `POST /v1/scripts/{id}/parse` - Parse a script
- `GET /v1/scripts/{id}` - Get script details

#### Scenes
- `GET /v1/scenes` - List scenes
- `GET /v1/scenes/{id}` - Get scene details
- `PUT /v1/scenes/{id}` - Update scene

#### Shots
- `POST /v1/shots/generate` - Generate shots for a scene
- `GET /v1/shots` - List shots
- `PUT /v1/shots/{id}` - Update shot

#### Frames
- `POST /v1/frames/generate` - Generate frames for a shot
- `GET /v1/frames/{id}` - Get frame details
- `PUT /v1/frames/{id}` - Update frame

#### Exports
- `POST /v1/exports/storyboard` - Export storyboard
- `GET /v1/exports/{id}` - Get export status

### WebSocket Events

- `script.uploaded` - Script upload completed
- `script.parsed` - Script parsing completed
- `shots.generated` - Shots generation completed
- `frames.generated` - Frames generation completed
- `export.completed` - Export completed

## Database Schema

### Core Tables

- `users` - User accounts and authentication
- `projects` - Storyboard projects
- `scripts` - Uploaded script files
- `scenes` - Script scenes
- `shots` - Individual shots within scenes
- `dialogues` - Dialogue lines
- `frames` - Generated storyboard frames
- `animatics` - Generated animatics
- `exports` - Export records

### Relationships

- Projects belong to Users
- Scripts belong to Projects
- Scenes belong to Scripts
- Shots belong to Scenes
- Dialogues belong to Scenes
- Frames belong to Shots

## Worker Services

### Script Parser Worker

Parses different script formats:
- **FDX (Final Draft)** - XML-based format
- **Fountain** - Plain text screenplay format
- **PDF** - PDF documents with OCR fallback

### Shot Planning Worker

Generates shot suggestions based on:
- Scene content analysis
- Dialogue timing
- Action sequences
- Camera angle templates

### Illustration Worker

Generates storyboard frames using:
- AI image generation models
- Shot metadata as prompts
- Style presets (sketch, storyboard, concept art)

### Dialogue Worker

Handles dialogue timing:
- Syllable-based timing estimation
- Audio alignment (optional)
- TTS generation (optional)

### Animatic Worker

Creates video animatics:
- Combines frames with timing
- Adds dialogue audio
- Generates captions
- Exports MP4 files

### Export Worker

Handles various export formats:
- PDF storyboard booklets
- CSV shot lists
- JSON metadata bundles
- ZIP archives

## Configuration

### Environment Variables

#### API
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `NATS_URL` - NATS connection string

#### Workers
- `MINIO_ENDPOINT` - S3-compatible storage endpoint
- `MINIO_ACCESS_KEY` - Storage access key
- `MINIO_SECRET_KEY` - Storage secret key
- `AI_MODEL_PATH` - Path to AI models

#### Frontend
- `NEXT_PUBLIC_API_URL` - API base URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

## Monitoring and Observability

### Metrics

- Script parsing latency
- Frame generation success rate
- Export completion times
- API response times

### Logging

- Structured JSON logging
- Request tracing with correlation IDs
- Error tracking with Sentry

### Health Checks

- `/health` endpoints on all services
- Database connectivity checks
- Storage service availability

## Security

### Authentication

- JWT-based authentication
- Password hashing with bcrypt
- Session management with Redis

### Authorization

- Role-based access control (RBAC)
- Row-level security (RLS) in database
- API rate limiting

### Data Protection

- Encrypted data at rest
- TLS for data in transit
- Signed URLs for file access
- Content filtering for generated images

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL service is running
   - Verify connection string format
   - Ensure database exists

2. **File Upload Failures**
   - Check MinIO/S3 service status
   - Verify storage credentials
   - Check file size limits

3. **Worker Failures**
   - Check NATS connectivity
   - Verify worker logs
   - Ensure required dependencies are installed

### Debug Mode

Enable debug logging by setting:
```
LOG_LEVEL=DEBUG
```

### Support

For issues and questions:
- Check the GitHub issues
- Review the API documentation
- Contact the development team

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines

- Follow TypeScript/ESLint rules
- Use conventional commits
- Add tests for new features
- Update documentation as needed
