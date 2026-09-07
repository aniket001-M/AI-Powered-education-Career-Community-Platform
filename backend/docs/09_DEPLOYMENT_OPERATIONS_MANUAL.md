# CareerGraph — Deployment & Operations Manual

## 1. Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **MongoDB**: v6.0+ (Replica Set mode required for multi-collection transactions)
- **Redis**: v7.0+
- **S3 Storage**: AWS S3, Cloudflare R2, or MinIO instance

---

## 2. Environment Configuration
Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
# Application
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1
CORS_ORIGIN=https://app.careergraph.dev

# Database
MONGODB_URI=mongodb://localhost:27017/careergraph?replicaSet=rs0
MONGODB_MIN_POOL_SIZE=5
MONGODB_MAX_POOL_SIZE=50

# Cache / Sessions
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Security / JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Object Storage (S3 / MinIO)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=careergraph-storage
S3_ENDPOINT=https://s3.ap-south-1.amazonaws.com
```

---

## 3. Build & Execution Commands
```bash
# 1. Install dependencies
npm install

# 2. Type validation
npx tsc --noEmit

# 3. Build production bundle
npm run build

# 4. Seed database with demo accounts & curriculum graph
npm run seed

# 5. Start production server
npm start
```

---

## 4. Docker Deployment
The backend includes a multi-stage `Dockerfile` and `docker-compose.yml`:
```bash
# Start MongoDB, Redis, and Backend together
docker-compose up -d --build
```
Health check endpoint: `GET /health` returns `{ "status": "ok" }`.

---

## 5. Monitoring & Operational Maintenance
- **Health Check**: `GET /health` periodically monitored via uptime checks (Kubernetes liveness/readiness probe, AWS ALB health checks).
- **Log Aggregation**: Winston structured JSON logs directed to stdout for parsing by Datadog, Grafana Loki, or AWS CloudWatch.
- **Audit Logs**: Queryable anytime through `/api/v1/admin/audit-logs` or directly in `auditlogs` collection.
- **Redis Purge**: Flush keys starting with `refresh:*` or `rate_limit:*` during maintenance if session state reset is required.
