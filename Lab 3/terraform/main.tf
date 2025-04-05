provider "aws" {
  region = var.region
}

provider "docker" {
  # Assumes Docker is running locally
}

locals {
  common_tags = {
    Environment = "dev"
    Project     = "CS487_Lab3"
    Pillars     = "Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability"
  }
}

# -----------------------------
# VPC, Subnets & Networking
# -----------------------------
resource "aws_vpc" "lab3_vpc" {
  cidr_block = var.vpc_cidr
  tags       = merge(local.common_tags, { Name = "Lab3-VPC" })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.lab3_vpc.id
  tags   = merge(local.common_tags, { Name = "Lab3-IGW" })
}

resource "aws_subnet" "public_subnets" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.lab3_vpc.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "Lab3-PublicSubnet-${count.index}" })
}

data "aws_availability_zones" "available" {}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.lab3_vpc.id
  tags   = merge(local.common_tags, { Name = "Lab3-PublicRT" })
}

resource "aws_route" "internet_access" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc" {
  count          = length(aws_subnet.public_subnets)
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# -----------------------------
# AWS Cognito – User Pool, Client & Groups
# -----------------------------
resource "aws_cognito_user_pool" "user_pool" {
  name = var.cognito_user_pool_name
  tags = local.common_tags
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name            = var.cognito_client_name
  user_pool_id    = aws_cognito_user_pool.user_pool.id
  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
  allowed_oauth_flows       = ["code"]
  allowed_oauth_scopes      = ["email", "openid", "profile"]
  callback_urls             = ["https://your-frontend-domain.com/"]  # Change when deploying frontend
  logout_urls               = ["https://your-frontend-domain.com/"]
  allowed_oauth_flows_user_pool_client = true
  tags                      = local.common_tags
}

resource "aws_cognito_user_group" "simple_users" {
  user_pool_id = aws_cognito_user_pool.user_pool.id
  name         = "SimpleUsers"
  precedence   = 1
  tags         = local.common_tags
}

resource "aws_cognito_user_group" "admins" {
  user_pool_id = aws_cognito_user_pool.user_pool.id
  name         = "Admins"
  precedence   = 0
  tags         = local.common_tags
}

# -----------------------------
# AWS RDS – PostgreSQL Instance
# -----------------------------
resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "lab3-db-subnet-group"
  subnet_ids = aws_subnet.public_subnets[*].id
  tags       = local.common_tags
}

resource "aws_db_instance" "tasks_db" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "13"
  instance_class       = "db.t3.micro"
  name                 = var.db_name
  username             = var.db_username
  password             = var.db_password
  db_subnet_group_name = aws_db_subnet_group.db_subnet_group.name
  publicly_accessible  = true
  skip_final_snapshot  = true
  tags                 = local.common_tags
}

# -----------------------------
# ECS – Cluster, ECR, Task Definition & Service for Backend
# -----------------------------
resource "aws_ecs_cluster" "ecs_cluster" {
  name = "Lab3ECSCluster"
  tags = local.common_tags
}

resource "aws_ecr_repository" "backend_repo" {
  name = "lab3-backend"
  tags = local.common_tags
}

# Build and push Docker image using the Docker provider.
# (Assumes your backend Dockerfile is in ../backend relative to terraform folder)
data "aws_caller_identity" "current" {}

resource "docker_image" "backend_image" {
  name         = "${aws_ecr_repository.backend_repo.repository_url}:latest"
  build {
    context    = "../backend"
    dockerfile = "../backend/Dockerfile"
  }
  keep_locally = false
}

# IAM role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "Lab3ECSTaskExecutionRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Security group for ECS tasks and RDS access
resource "aws_security_group" "ecs_sg" {
  name        = "Lab3-ECSSG"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.lab3_vpc.id
  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.common_tags
}

# ECS Task Definition using Fargate
resource "aws_ecs_task_definition" "backend_task" {
  family                   = "Lab3BackendTask"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = docker_image.backend_image.name
    portMappings = [{
      containerPort = 3001,
      protocol      = "tcp"
    }]
    environment = [
      { name = "DB_USER", value = var.db_username },
      { name = "DB_HOST", value = aws_db_instance.tasks_db.address },
      { name = "DB_NAME", value = var.db_name },
      { name = "DB_PASSWORD", value = var.db_password },
      { name = "DB_PORT", value = "5432" },
      { name = "COGNITO_USER_POOL_ID", value = aws_cognito_user_pool.user_pool.id },
      { name = "COGNITO_REGION", value = var.region }
    ]
    logConfiguration = {
      logDriver = "awslogs",
      options = {
        "awslogs-group"         = "/ecs/lab3-backend",
        "awslogs-region"        = var.region,
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
  tags = local.common_tags
}

resource "aws_ecs_service" "backend_service" {
  name            = "Lab3BackendService"
  cluster         = aws_ecs_cluster.ecs_cluster.id
  task_definition = aws_ecs_task_definition.backend_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets         = aws_subnet.public_subnets[*].id
    security_groups = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }
  tags = local.common_tags
}

# -----------------------------
# S3 Bucket & CloudFront for Frontend
# -----------------------------
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.frontend_bucket_name
  acl    = "public-read"
  website {
    index_document = "index.html"
    error_document = "index.html"
  }
  tags = local.common_tags
}

# (Optional) Use a null_resource with local-exec to sync your pre-built frontend
resource "null_resource" "upload_frontend" {
  provisioner "local-exec" {
    command = "aws s3 sync ../frontend/dist s3://${aws_s3_bucket.frontend_bucket.bucket} --delete"
  }
  # Run this after S3 bucket creation
  depends_on = [aws_s3_bucket.frontend_bucket]
}

resource "aws_cloudfront_distribution" "frontend_cf" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend_bucket.bucket}"
  }
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend_bucket.bucket}"
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    viewer_protocol_policy = "redirect-to-https"
  }
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  tags = local.common_tags
}

# -----------------------------
# Database Schema – Run SQL Script via null_resource
# -----------------------------
resource "null_resource" "provision_db_schema" {
  # Requires the db_schema.sql file in this folder.
  provisioner "local-exec" {
    command = <<EOT
      PGPASSWORD=${var.db_password} psql -h ${aws_db_instance.tasks_db.address} -U ${var.db_username} -d ${var.db_name} -f ${path.module}/db_schema.sql
    EOT
  }
  depends_on = [aws_db_instance.tasks_db]
}
