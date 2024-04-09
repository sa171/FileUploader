import boto3
import sys
import tempfile
import os

region_name = 'us-west-2'
dynamodb = boto3.resource('dynamodb', region_name)
s3_client = boto3.client('s3', region_name)

def fetch_record_from_dynamodb(table_name, record_id):
    table = dynamodb.Table(table_name)
    response = table.get_item(
        Key={'id': record_id}
    )
    return response.get('Item')

def download_file_from_s3(bucket_name, s3_key):
    temp_dir = tempfile.gettempdir()
    local_file_path = os.path.join(temp_dir, os.path.basename(s3_key))
    s3_client.download_file(bucket_name, s3_key, local_file_path)
    return local_file_path

def append_text_to_file(file_path, text):
    with open(file_path, 'a') as file:
        file.write(text)

def upload_file_to_s3(bucket_name, local_file_path, s3_key):
    res = s3_client.upload_file(local_file_path, bucket_name, s3_key)

def update_record_in_dynamodb(table_name, record_id, new_s3_url):
    table = dynamodb.Table(table_name)
    table.update_item(
        Key={'id': record_id},
        UpdateExpression='SET s3_url = :url',
        ExpressionAttributeValues={':url': new_s3_url}
    )

def main(record_id):
    table_name = 'FileTable'
    input_bucket_name = 'input-bucket-sr-dev'
    output_bucket_name = 'output-bucket-sr-dev'

    record = fetch_record_from_dynamodb(table_name, record_id)
    print("Record = ",record)
    s3_key = record['url'].split('/')[-1]
    local_file_path = download_file_from_s3(input_bucket_name, s3_key)

    append_text_to_file(local_file_path, record['text'])

    upload_file_to_s3(output_bucket_name, local_file_path, record_id)

    new_s3_url = f'https://{output_bucket_name}.s3.amazonaws.com/{record_id}'
    print("New url = ", new_s3_url)
    update_record_in_dynamodb(table_name, record_id, new_s3_url)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Missing argument <record_id>")
        sys.exit(1)
    record_id = sys.argv[1]
    main(record_id)
