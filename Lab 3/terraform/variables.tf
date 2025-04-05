variable "region" {
  default = "us-east-1"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "db_username" {
  default = "admin"
}

variable "db_password" {
  default = "Admin1234!"   # In production, use a secure secrets manager
}

variable "db_name" {
  default = "tasksdb"
}

variable "cognito_user_pool_name" {
  default = "CS487UserPool"
}

variable "cognito_client_name" {
  default = "CS487UserPoolClient"
}

variable "frontend_bucket_name" {
  description = "Globally unique S3 bucket name for frontend"
  default     = "cs487-frontend-bucket-unique-name-2025"
}
