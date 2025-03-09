resource "aws_sqs_queue" "queue1" {
  name = "quiz_queue1"
}

resource "aws_sqs_queue" "queue2" {
  name = "quiz_queue2"
}