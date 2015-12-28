console.log('Loading function');
// dependencies

var AWS = require('aws-sdk');
var async = require('async');
var gm = require('gm').subClass({ imageMagick: true });
var util = require('util');


// get reference to S3 client
var s3 = new AWS.S3();

exports.handler = function(event, context) {
    // Read options from the event.
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey = event.Records[0].s3.object.key;
	var destBucket = "dest";
	var destKey = srcKey;

    var _800px = {
        width: 800,
		destBucket : destBucket,
        dstnKey: destKey,
        destinationPath: "large"
    };

    var _500px = {
        width: 500,
        destBucket : destBucket,
        dstnKey: destKey,
        destinationPath: "medium"
    };

    var _200px = {
        width: 200,
        destBucket : destBucket,
        dstnKey: destKey,
        destinationPath: "small"
    };

    var _45px = {
        width: 45,
        destBucket : destBucket,
        dstnKey: destKey,
        destinationPath: "thumbnail"
    };

    //var _sizesArray = [_800px, _500px, _200px, _45px];
    var _sizesArray = [_45px];

    var len = _sizesArray.length;

    console.log(len);
    console.log(srcBucket);
    console.log(srcKey);

    // Infer the image type.
    var typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.error('unable to infer image type for key ' + srcKey);
        return;
    }
    var imageType = typeMatch[1];
    if (imageType != "jpg" && imageType != "png") {
        console.log('skipping non-image ' + srcKey);
        return;
    }

    // Download the image from S3, transform, and upload to same S3 bucket but different folders.
    async.waterfall([
            function download(next) {
                // Download the image from S3 into a buffer.

                s3.getObject({
                        Bucket: srcBucket,
                        Key: srcKey
                    },
                    next);
            },

            function transform(response, next) {


                for (var i = 0; i<len; i++) {

                    // Transform the image buffer in memory.
                    gm(response.Body, srcKey)
                        .resize(_sizesArray[i].width)
                        .toBuffer(imageType, function(err, buffer) {
                            if (err) {
                                next(err);

                            } else {
                                next(null, response.ContentType, buffer);
                            }
                        });
                }
            },

            function upload(contentType, data, next) {

                for (var i = 0; i<len; i++) {

                    // Stream the transformed image to a different folder.
                    s3.putObject({
                            Bucket: destBucket,
                            Key: _sizesArray[i].destinationPath + "/" + _sizesArray[i].dstnKey,
                            Body: data,
                            ContentType: contentType
                        },
                        next);
                }
            }

        ], function (err) {
            if (err) {
                console.error(
                    '---->Unable to resize ' + srcBucket + '/' + srcKey +
                    ' and upload to ' + srcBucket + '/dst' +
                    ' due to an error: ' + err
                );
            } else {
                console.log(
                    '---->Successfully resized ' + srcBucket +
                    ' and uploaded to' + srcBucket + "/dst"
                );
            }

            context.done();
        }
    );
};