variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for databases"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for load balancers"
  type        = list(string)
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "assessos"
  sensitive   = true
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "ecs_task_count" {
  description = "Number of ECS tasks"
  type        = number
  default     = 2
}

variable "api_container_image" {
  description = "API container image URI"
  type        = string
}

variable "web_container_image" {
  description = "Web container image URI"
  type        = string
}

variable "ai_sidecar_container_image" {
  description = "AI sidecar container image URI"
  type        = string
}

variable "cloudfront_domain_name" {
  description = "Custom domain name for CloudFront"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM SSL certificate ARN"
  type        = string
}
