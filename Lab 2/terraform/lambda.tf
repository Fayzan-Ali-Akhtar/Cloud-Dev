resource "aws_lambda_function" "request_receiver" {
  function_name = "request_receiver_lambda"
  filename      = "../lambdas/request_receiver.zip"
  handler       = "request_receiver.handler"
  runtime       = "python3.8"
  role          = aws_iam_role.lambda_role.arn
  environment {
    variables = {
      RAW_BUCKET    = aws_s3_bucket.raw_data_bucket.bucket
      SQS_QUEUE_URL = aws_sqs_queue.queue1.url
    }
  }
}

resource "aws_lambda_function" "analytics_calculator" {
  function_name = "analytics_calculator_lambda"
  filename      = "../lambdas/analytics_calculator.zip"
  handler       = "analytics_calculator.handler"
  runtime       = "python3.8"
  role          = aws_iam_role.lambda_role.arn
  environment {
    variables = {
      RAW_BUCKET    = aws_s3_bucket.raw_data_bucket.bucket
      STATS_BUCKET  = aws_s3_bucket.stats_bucket.bucket
      SQS_QUEUE_URL = aws_sqs_queue.queue2.url
    }
  }
}

resource "aws_lambda_function" "result_notifier" {
  function_name = "result_notifier_lambda"
  filename      = "../lambdas/result_notifier.zip"
  handler       = "result_notifier.handler"
  runtime       = "python3.8"
  role          = aws_iam_role.lambda_role.arn
  environment {
    variables = {
      STATS_BUCKET  = aws_s3_bucket.stats_bucket.bucket
      SNS_TOPIC_ARN = aws_sns_topic.quiz_stats_topic.arn
    }
  }
}
