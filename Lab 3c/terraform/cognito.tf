resource "aws_cognito_user_pool" "lab_user_pool" {
  name = "lab-user-pool"
  tags = var.tags
}

resource "aws_cognito_user_pool_client" "lab_user_pool_client" {
  name         = "lab-user-pool-client"
  user_pool_id = aws_cognito_user_pool.lab_user_pool.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  generate_secret = true
}

resource "aws_cognito_user_group" "simple_users" {
  user_pool_id = aws_cognito_user_pool.lab_user_pool.id
  name         = "SimpleUsers"
  description  = "Users who can view, add, and delete their own tasks"
  precedence   = 1
}

resource "aws_cognito_user_group" "admins" {
  user_pool_id = aws_cognito_user_pool.lab_user_pool.id
  name         = "Admins"
  description  = "Admins who can view, update, and delete tasks from all users"
  precedence   = 0
}
