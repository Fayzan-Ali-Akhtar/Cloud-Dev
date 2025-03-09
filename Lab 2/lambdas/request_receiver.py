import json
import boto3
import os

def handler(event, context):
    s3 = boto3.client('s3')
    sqs = boto3.client('sqs')
    bucket = os.environ['RAW_BUCKET']
    queue_url = os.environ['SQS_QUEUE_URL']
    
    # Parse the JSON payload from the API Gateway request
    body = json.loads(event.get('body', '{}'))
    data = body.get('data', [])
    
    # Create CSV content
    csv_content = "\n".join(data)
    file_key = "raw_data.csv"
    
    # Upload CSV file to the raw-data S3 bucket
    s3.put_object(Bucket=bucket, Key=file_key, Body=csv_content)
    
    # Send SQS message with S3 file key
    message = json.dumps({"s3_key": file_key})
    sqs.send_message(QueueUrl=queue_url, MessageBody=message)
    
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Data received and processed"})
    }
