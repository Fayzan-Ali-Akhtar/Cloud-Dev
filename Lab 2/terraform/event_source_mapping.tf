resource "aws_lambda_event_source_mapping" "sqs_to_analytics" {
  event_source_arn = aws_sqs_queue.queue1.arn
  function_name    = aws_lambda_function.analytics_calculator.arn
  batch_size       = 1
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "sqs_to_notifier" {
  event_source_arn = aws_sqs_queue.queue2.arn
  function_name    = aws_lambda_function.result_notifier.arn
  batch_size       = 1
  enabled          = true
}
