const aws = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const superagent = require('superagent');
const util = require('util');
const queryString = require('querystring');

const tableName = 'WeBeer';

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));
    var postBody = queryString.parse(event.body);
    console.log(postBody);

    var validLocations = ['1n', '1s', '2n', '2s', '3n'];

    // Standard usage- return list.
    if (!postBody.text) {
        dynamo.scan({ TableName: tableName }, function (err, result) {
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
    } else {
        // Now we have some data to work with.
        var beerArray = postBody.text.split(' ');
        var beerFloor = beerArray[0].toLowerCase();
        var beerString = beerArray.slice(1, beerArray.length).join(' ');

        console.log('beerArray: ' + JSON.stringify(beerArray));
        console.log('beerFloor: ' + JSON.stringify(beerFloor));
        console.log('beerString: ' + JSON.stringify(beerString));

        console.log("Checking " + beerFloor + " against " + JSON.stringify(validLocations));
        var len = validLocations.length;
        while(len--) {
            if (beerFloor.indexOf(validLocations[len]) != -1) {
                var params = {
                    Item: {
                        /* required */
                        id: beerFloor,
                        location: beerFloor,
                        beer: beerString
                    },
                    TableName: tableName /* required */
                };

                console.log("Placing item in dynamo: " + JSON.stringify(params));

                dynamo.putItem(params, function (err, data) {
                    if (err) {
                        console.error("Unable to add item. Error JSON: ", JSON.stringify(err, null, 2));
                        context.fail();
                    } else {
                        console.log("Item added.");
                        superagent
                            .post(postBody.response_url)
                            .send({response_type: 'in_channel', text: "*" + beerFloor + "* keg changed to " + beerString})
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
                });
            }
        }
    }
};
