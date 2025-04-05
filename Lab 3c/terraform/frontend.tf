resource "random_id" "bucket_id" {
  byte_length = 4
}

resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "lab-frontend-bucket-${random_id.bucket_id.hex}"

  tags = merge(var.tags, { Name = "lab-frontend-bucket" })
}

resource "aws_s3_bucket_ownership_controls" "frontend_ownership" {
  bucket = aws_s3_bucket.frontend_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# resource "aws_s3_bucket_policy" "frontend_policy" {
#   bucket = aws_s3_bucket.frontend_bucket.id

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Sid       = "PublicReadGetObject"
#       Effect    = "Allow"
#       Principal = "*"
#       Action    = "s3:GetObject"
#       Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
#     }]
#   })
# }

resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_cloudfront_distribution" "frontend_cf" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend_website.website_endpoint
    origin_id   = "S3-lab-frontend"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-lab-frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = var.tags
}
