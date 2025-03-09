import json
import boto3
import os

def handler(event, context):
    s3 = boto3.client('s3')
    sns = boto3.client('sns')
    bucket_stats = os.environ['STATS_BUCKET']
    topic_arn = os.environ['SNS_TOPIC_ARN']
    
    for record in event['Records']:
        message = json.loads(record['body'])
        stats_key = message['stats_key']
        
        # Retrieve statistics file from S3
        response = s3.get_object(Bucket=bucket_stats, Key=stats_key)
        stats_report = response['Body'].read().decode('utf-8')
        
        # Publish the report to the SNS topic (which sends an email)
        sns.publish(
            TopicArn=topic_arn,
            Subject="Quiz Statistics Report",
            Message=stats_report
        )
    
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Notification sent"})
    }
