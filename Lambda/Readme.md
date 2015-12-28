#Setup

1. npm install
2. Incase of issues with file version, cross check with those in shrinkwrap file.
3. Zip the contents of the folder and upload it as Lambda function.

#Note
1. This function expects a S3 put event notification.
2. It will download the image from S3, resize the image and upload back to S3
