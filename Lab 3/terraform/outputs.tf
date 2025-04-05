output "backend_service_endpoint" {
  value = aws_ecs_service.backend_service.id
}

output "frontend_url" {
  value = aws_cloudfront_distribution.frontend_cf.domain_name
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.user_pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.user_pool_client.id
}
