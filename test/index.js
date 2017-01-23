const aws = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const superagent = require('superagent');
const queryString = require('querystring');

exports.handler = function(event, context) {
    console.log('Received event: ', JSON.stringify(event, null, 2));
    var postBody = queryString.parse(event.body);
    console.log(postBody);
    const tableName = 'WeBeer';
    var validLocations = ['1n', '1s', '2n', '2s', '3n'];

    var params = {
        TableName: tableName,
        IndexName: 'wework-index',
        KeyConditionExpression: 'wework = :wework',
        ExpressionAttributeValues: {
            ':wework': 'customhouse'
        }
    };
    // Standard usage- return list.
    console.log(params);
    dynamo.query(params, function (err, result) {
    // docClient.get(params, function (err, result) {
        if (err) {
            console.log(err);
            superagent
                .post(postBody.response_url)
                .send({response_type: 'in_channel', text: err})
                .set('Content-type', 'application/json')
                .end(function (err, res) {
                    console.log("Posted successfully!");
                    context.succeed({
                        statusCode: 200,
                        headers: {},
                        body: ""
                    });
                });
        }
        console.log("Get result: " + JSON.stringify(result));
        var arrayCount = 0;
        var responseString = "";

        console.log(result.Count);
        result.Items.forEach(function (beer) {
            responseString += beer.location + ": " + beer.beer + "\n";
            arrayCount++;

            console.log("arrayCount: " + arrayCount + ", result.Count: " + result.Count);
            if (arrayCount == result.Count) {
                console.log("Creating response! string: " + responseString);
                superagent
                    .post(postBody.response_url)
                    .send({response_type: 'in_channel', text: responseString})
                    .set('Content-type', 'application/json')
                    .end(function (err, res) {
                        console.log("Posted successfully!");
                        context.succeed({
                            statusCode: 200,
                            headers: {},
                            body: ""
                        });
                    });
            }
        })
    });

};
