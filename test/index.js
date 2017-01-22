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
        // KeyConditionExpression: 'Location = :location',
        // Limit: 1,
        // ScanIndexForward: true   // true = ascending, false = descending
        // ExpressionAttributeValues: {
        //     ':location': location
        // }
    };
    // Standard usage- return list.
    dynamo.scan(params, function (err, result) {
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
