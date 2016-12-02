// 'use strict';

console.log('Loading function');
const aws = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const superagent = require('superagent');
const util = require('util');

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var input = event.queryStringParameters.text;

    if (!input.trim()) {
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
    } else {
        var beerArray = input.split(' ');

        var beerFloor = beerArray[0].toLowerCase();
        var beerString = beerArray.slice(1, beerArray.length).join(' ');

        var validLocations = ['1fn', '1fs', '2fn', '2fs', '3fn'];

        if (validLocations.filter(function(location) { if (location == beerFloor) { return true; }})) {
            var params = {
                Item: { /* required */
                    location: beerFloor,
                    beer: beerString
                },
                TableName: 'WeWork' /* required */
            };

            console.log("Placing item in dynamo: " + JSON.stringify(params));

            dynamo.putItem(params, function(err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON: ", JSON.stringify(err, null, 2));
                    context.fail();
                } else {
                    console.log("Item added.");
                    superagent
                        .post(event.queryStringParameters.response_url)
                        .send({ response_type: 'in_channel', text: beerString + ' added to ' + beerFloor })
                        .set('Content-type', 'application/json')
                        .end(function(err, res) {
                            console.log("Posted successfully!");
                            context.succeed({
                                statusCode: 200,
                                headers: {},
                                body: ""
                            });
                        });
                }
            });
        }

    }
};
