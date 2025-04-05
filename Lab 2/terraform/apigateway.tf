resource "aws_api_gateway_rest_api" "quiz_api" {
  name        = "QuizAPI"
  description = "API for receiving CSV quiz data"
}

resource "aws_api_gateway_resource" "data_resource" {
  rest_api_id = aws_api_gateway_rest_api.quiz_api.id
  parent_id   = aws_api_gateway_rest_api.quiz_api.root_resource_id
  path_part   = "data"
}

resource "aws_api_gateway_method" "post_method" {
  rest_api_id   = aws_api_gateway_rest_api.quiz_api.id
  resource_id   = aws_api_gateway_resource.data_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.quiz_api.id
  resource_id             = aws_api_gateway_resource.data_resource.id
  http_method             = aws_api_gateway_method.post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.request_receiver.invoke_arn
}

resource "aws_lambda_permission" "apigw_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.request_receiver.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.quiz_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.quiz_api.id
  stage_name  = "prod"

  depends_on = [
    aws_api_gateway_method.post_method,
    aws_api_gateway_integration.lambda_integration
  ]
}


output "api_invoke_url" {
  value = "${aws_api_gateway_deployment.api_deployment.invoke_url}/data"
}
