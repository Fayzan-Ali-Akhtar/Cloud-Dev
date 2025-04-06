variable "frontend_bucket_name" {
  description = "The name of the S3 bucket to host the frontend."
  type        = string
  default     = "lab3-frontend-961341510224"
}

variable "environment" {
  description = "The deployment environment."
  type        = string
  default     = "dev"
}
