terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.94.1"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "2.15.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

provider "docker" {
  alias = "ecr"
  host  = "npipe:////./pipe/docker_engine" 
  registry_auth {
    address  = aws_ecr_repository.node_app.repository_url
    username = "AWS"
    password = base64decode(data.aws_ecr_authorization_token.auth.authorization_token)
  }
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project = "Lab3"
    Owner   = "YourName"
  }
}

variable "backend_image" {
  description = "The final Docker image URI for your Node.js app in ECR"
  type        = string
  default     = ""  # This value will be set by the output below
}

resource "aws_ecr_repository" "node_app" {
  name = "my-node-app"
  tags = var.tags
}

data "aws_ecr_authorization_token" "auth" {}

resource "docker_image" "node_app_image" {
  provider = docker.ecr
  name     = "${aws_ecr_repository.node_app.repository_url}:latest"
  build {
    // In this configuration, the build context is the parent folder (the backend folder)
    // and we assume your Dockerfile is located there.
    path       = "${path.module}/.."      // Points to the backend folder
    dockerfile = "Dockerfile"             // Use "Dockerfile" as it is in the build context
    remove     = true
  }
}

output "backend_image_uri" {
  description = "The Docker image URI that was pushed to ECR"
  value       = docker_image.node_app_image.name
}
