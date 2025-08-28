variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_password" {
  description = "PostgreSQL database password"
  type        = string
  sensitive   = true
}

variable "certificate_arn" {
  description = "SSL certificate ARN for the load balancer"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "ai-storyboard-creator"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
