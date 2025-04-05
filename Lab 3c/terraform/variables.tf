variable "backend_image" {
  description = "Backend container image URI for ECS Fargate"
  type        = string
}

variable "db_username" {
  description = "Database admin username"
  default     = "dbadmin"
}

variable "db_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the database"
  default     = "tododb"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project = "Lab3"
    Owner   = "YourName"
  }
}
