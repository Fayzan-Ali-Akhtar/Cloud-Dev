provider "aws" {
  region = "us-east-1"
}

# S3 Bucket for Frontend Hosting
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.frontend_bucket_name

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  tags = {
    Name        = "FrontendBucket"
    Environment = var.environment
  }
}

# S3 Bucket Public Access Block - allow public policies on this bucket
resource "aws_s3_bucket_public_access_block" "frontend_bucket_public_access" {
  bucket                  = aws_s3_bucket.frontend_bucket.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Policy to allow public read access
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      }
    ]
  })
}

# Create an Origin Access Identity for CloudFront (optional if you want to restrict direct bucket access)
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for Frontend S3 Bucket"
}

# CloudFront Distribution for Frontend
resource "aws_cloudfront_distribution" "frontend_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend_bucket.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront Distribution for Frontend"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.frontend_bucket.id}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "FrontendCloudFront"
    Environment = var.environment
  }
}

# Outputs
output "s3_bucket_website_url" {
  description = "URL to access the static website directly via S3"
  value       = aws_s3_bucket.frontend_bucket.website_endpoint
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name (use this URL for production)"
  value       = aws_cloudfront_distribution.frontend_distribution.domain_name
}
