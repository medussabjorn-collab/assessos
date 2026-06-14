terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "assessos-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "AssessOS"
      ManagedBy   = "Terraform"
    }
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "assessos-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/assessos-api"
  retention_in_days = 30

  tags = {
    Name = "assessos-ecs-logs"
  }
}

# RDS Database (PostgreSQL)
resource "aws_db_instance" "main" {
  identifier     = "assessos-db"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = var.db_instance_class

  db_name  = "assessos"
  username = var.db_username
  password = random_password.db_password.result

  allocated_storage          = var.db_allocated_storage
  storage_type              = "gp3"
  storage_encrypted         = true
  deletion_protection       = true
  backup_retention_period   = 30
  backup_window             = "03:00-04:00"
  maintenance_window        = "sun:04:00-sun:05:00"
  multi_az                  = true
  publicly_accessible       = false
  skip_final_snapshot       = false
  final_snapshot_identifier = "assessos-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  enable_cloudwatch_logs_exports = ["postgresql"]

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  tags = {
    Name = "assessos-db"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "assessos-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "assessos-db-subnet-group"
  }
}

# RDS Security Group
resource "aws_security_group" "db" {
  name        = "assessos-db-sg"
  description = "Security group for AssessOS RDS database"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "assessos-db-sg"
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "assessos-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  engine_version       = "7.0"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.main.name

  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result

  logs {
    slow_log {
      log_destination      = aws_cloudwatch_log_group.redis_slow_log.arn
      log_destination_type = "cloudwatch-logs"
      log_format           = "JSON"
    }
  }

  tags = {
    Name = "assessos-redis"
  }
}

# Redis Parameter Group
resource "aws_elasticache_parameter_group" "redis" {
  name   = "assessos-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = {
    Name = "assessos-redis-params"
  }
}

# Redis Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "assessos-redis-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "assessos-redis-subnet-group"
  }
}

# Redis Security Group
resource "aws_security_group" "redis" {
  name        = "assessos-redis-sg"
  description = "Security group for AssessOS Redis"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "assessos-redis-sg"
  }
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/redis/assessos/slow-log"
  retention_in_days = 7

  tags = {
    Name = "assessos-redis-slow-log"
  }
}

# ECS Security Group
resource "aws_security_group" "ecs_tasks" {
  name        = "assessos-ecs-tasks-sg"
  description = "Security group for AssessOS ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "assessos-ecs-tasks-sg"
  }
}

# Random passwords
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "redis_auth_token" {
  length  = 32
  special = false
}

# Store secrets in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name_prefix             = "assessos/db-password-"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id       = aws_secretsmanager_secret.db_password.id
  secret_string   = random_password.db_password.result
}
