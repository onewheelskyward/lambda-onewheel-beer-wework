const aws = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const superagent = require('superagent');
const util = require('util');

exports.handler = function(event, context) {
    console.log('Received event params:', JSON.stringify(event.queryStringParameters, null, 2));

    dynamo.scan({ TableName: 'WeWork' }, function (err, result) {
        console.log("Get result: " + JSON.stringify(result));
        result.Items.forEach(function (beer) {
            superagent
                .post(event.queryStringParameters.response_url)
                .send({ response_type: 'in_channel', text: beer.location + ": " + beer.beer})
                .set('Content-type', 'application/json')
                .end(function(err, res) {
                    console.log("Posted successfully!");
                    context.succeed({
                        statusCode: 200,
                        headers: {},
                        body: ""
                    });
                });
        })
    });
};
