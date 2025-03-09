provider "aws" {
  region = "us-east-1"
}

terraform {
  required_version = ">= 1.0.0"
}

# S3 buckets raw data
resource "aws_s3_bucket" "raw_data_bucket" {
  bucket = "lab-2-raw-data-bucket"  
  tags = {
    Name        = "Raw Data Bucket"
    Environment = "Lab2"
  }
}

# S3 bucket computed statistics
resource "aws_s3_bucket" "stats_bucket" {
  bucket = "lab-2-stats-bucket"  
  tags = {
    Name        = "Statistics Bucket"
    Environment = "Lab2"
  }
}
