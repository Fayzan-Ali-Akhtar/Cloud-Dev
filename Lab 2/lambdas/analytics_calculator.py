import json
import boto3
import os
import statistics

def handler(event, context):
    s3 = boto3.client('s3')
    sqs = boto3.client('sqs')
    bucket_raw = os.environ['RAW_BUCKET']
    bucket_stats = os.environ['STATS_BUCKET']
    queue_url = os.environ['SQS_QUEUE_URL']
    
    for record in event['Records']:
        message = json.loads(record['body'])
        s3_key = message['s3_key']
        
        # Retrieve CSV file from S3
        response = s3.get_object(Bucket=bucket_raw, Key=s3_key)
        csv_data = response['Body'].read().decode('utf-8')
        
        # Process each quiz entry (e.g., "Quiz1,85,76,90")
        results = {}
        for line in csv_data.strip().split("\n"):
            parts = line.split(',')
            quiz = parts[0]
            scores = list(map(int, parts[1:]))
            results[quiz] = {
                "min": min(scores),
                "max": max(scores),
                "mean": statistics.mean(scores)
            }
        
        # Save computed statistics as a JSON file to the stats bucket
        stats_key = "quiz_stats.json"
        s3.put_object(Bucket=bucket_stats, Key=stats_key, Body=json.dumps(results))
        
        # Send SQS message to trigger the notifier Lambda
        sqs.send_message(QueueUrl=queue_url, MessageBody=json.dumps({"stats_key": stats_key}))
    
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Statistics computed"})
    }
