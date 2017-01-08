const aws = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const superagent = require('superagent');
const util = require('util');
const queryString = require('querystring');

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));
    var postBody = queryString.parse(event.body);
    console.log(postBody);

    dynamo.scan({ TableName: 'WeWork' }, function (err, result) {
        console.log("Get result: " + JSON.stringify(result));
        result.Items.forEach(function (beer) {
            superagent
                .post(postBody.response_url)
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
