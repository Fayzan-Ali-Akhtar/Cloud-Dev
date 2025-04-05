output "rds_endpoint" {
  value = aws_db_instance.tododb.address
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.lab_user_pool.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.lab_cluster.name
}

output "frontend_bucket_website_url" {
  value = aws_s3_bucket_website_configuration.frontend_website.website_endpoint
}

output "cloudfront_distribution_domain" {
  value = aws_cloudfront_distribution.frontend_cf.domain_name
}
