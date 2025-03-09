resource "aws_sns_topic" "quiz_stats_topic" {
  name = "quizStatsTopic"
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.quiz_stats_topic.arn
  protocol  = "email"
  endpoint  = "fayzan585@gmail.com"  
}
