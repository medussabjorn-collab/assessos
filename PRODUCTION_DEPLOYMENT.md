# AssessOS Production Deployment Guide

## Overview

AssessOS is deployed on AWS using:
- **Frontend**: Next.js on ECS Fargate + CloudFront CDN
- **API**: NestJS on ECS Fargate with ALB
- **AI Sidecar**: FastAPI on ECS Fargate
- **Database**: RDS PostgreSQL (Multi-AZ)
- **Cache**: ElastiCache Redis
- **Storage**: S3 (static assets, backups)
- **CI/CD**: GitHub Actions

## Prerequisites

- AWS Account with appropriate permissions
- Terraform >= 1.0
- Docker
- AWS CLI v2
- GitHub repository secrets configured

## Infrastructure Stack

```
Internet
    ↓
CloudFront (CDN, WAF, SSL)
    ├→ S3 (static assets)
    └→ ALB (API & Web)
        ├→ ECS Cluster (Fargate)
        │  ├→ API Service (2-10 tasks)
        │  ├→ Web Service (2-10 tasks)
        │  └→ AI Sidecar (1-5 tasks)
        ├→ RDS (PostgreSQL, Multi-AZ)
        └→ ElastiCache (Redis)
```

## Deployment Checklist

### Phase 1: Infrastructure
1. Create VPC with public/private subnets
2. Provision RDS PostgreSQL cluster
3. Provision ElastiCache Redis cluster
4. Create ECS cluster with Container Insights
5. Create Application Load Balancer

### Phase 2: Services
1. Build and push Docker images to ECR
2. Create ECS task definitions
3. Deploy API service (2-10 tasks)
4. Deploy Web service (2-10 tasks)
5. Deploy AI sidecar service (1-5 tasks)

### Phase 3: CDN & DNS
1. Create CloudFront distribution
2. Configure security headers & WAF
3. Update Route 53 DNS records
4. Verify SSL certificate deployment

### Phase 4: Monitoring
1. Configure CloudWatch alarms
2. Enable X-Ray tracing
3. Setup PagerDuty integration
4. Create operational dashboards

## Key Features

✅ **Security**
- SSL/TLS with automatic renewal
- Database encryption at rest & in transit
- Redis AUTH token & encryption
- Rate limiting (100 req/15min per user)
- CORS, CSRF, XSS protection
- Secrets stored in AWS Secrets Manager

✅ **Reliability**
- Multi-AZ RDS for HA
- Auto-scaling (2-10 ECS tasks)
- Health checks on all services
- Automated backup (30-day retention)
- Cross-region disaster recovery

✅ **Observability**
- CloudWatch logs with 30-day retention
- X-Ray distributed tracing
- Real-time metrics & alarms
- Performance insights (RDS)
- Slow query logs (Redis)

✅ **Performance**
- CloudFront global edge caching
- Redis in-memory cache (1-hour TTL)
- Database query optimization
- Auto-scaling based on CPU load
- Load testing verified (k6)

## Scaling Configuration

| Service | Min | Max | Scale Up | Scale Down |
|---------|-----|-----|----------|------------|
| API | 2 | 10 | CPU > 70% | CPU < 30% |
| Web | 2 | 10 | CPU > 70% | CPU < 30% |
| AI | 1 | 5 | CPU > 80% | CPU < 40% |

## Monitoring Thresholds

- API P95 Latency: < 500ms
- API P99 Latency: < 1000ms
- Error Rate: < 0.1%
- RDS CPU: < 80%
- Redis Memory: < 80%
- ECS Health: 100% passing
