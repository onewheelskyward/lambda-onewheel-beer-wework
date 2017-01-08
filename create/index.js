const aws = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const superagent = require('superagent');

exports.handler = function(event, context) {
    console.log('Received event: ', JSON.stringify(event, null, 2));

    // var postBody = querystring.parse(event.body);

    var input = event.queryStringParameters;

    console.log('Input found: "' + input.text + '"');

    if (!input.text) {
        superagent
            .post(input.response_url)
            .send({ response_type: 'in_channel', text: 'Try setting a beer like this: \'/webeeradd 1fn Wassail Winter Ale\''})
            .set('Content-type', 'application/json')
            .end(function(err, res) {
                console.log("Posted successfully!");
                context.succeed({
                    statusCode: 200,
                    headers: {},
                    body: ""
                });
            });
    } else {

        var beerArray = input.text.split(' ');

        console.log('beerArray: ' + JSON.stringify(beerArray));
        var beerFloor = beerArray[0].toLowerCase();
        console.log('beerFloor: ' + JSON.stringify(beerFloor));
        var beerString = beerArray.slice(1, beerArray.length).join(' ');
        console.log('beerString: ' + JSON.stringify(beerString));

        var validLocations = ['1fn', '1fs', '2fn', '2fs', '3fn'];

        console.log("Checking " + beerFloor + " against " + JSON.stringify(validLocations));
        var len = validLocations.length;
        while(len--) {
            if (beerFloor.indexOf(validLocations[len]) != -1) {
                var params = {
                    Item: {
                        /* required */
                        location: beerFloor,
                        beer: beerString
                    },
                    TableName: 'WeWork' /* required */
                };

                console.log("Placing item in dynamo: " + JSON.stringify(params));

                dynamo.putItem(params, function (err, data) {
                    if (err) {
                        console.error("Unable to add item. Error JSON: ", JSON.stringify(err, null, 2));
                        context.fail();
                    } else {
                        console.log("Item added.");
                        superagent
                            .post(input.response_url)
                            .send({response_type: 'in_channel', text: beerString + ' added to ' + beerFloor})
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

        // We didn't find the floor specified.
        // superagent
        //     .post(input.response_url)
        //     .send({
        //         response_type: 'in_channel',
        //         text: "'" + beerFloor + "' is not an allowed location, try one of these: " + validLocations.join(', ')
        //     })
        //     .set('Content-type', 'application/json')
        //     .end(function (err, res) {
        //         console.log("Posted successfully!");
        //         context.succeed({
        //             statusCode: 200,
        //             headers: {},
        //             body: ""
        //         });
        //     });

    }
};
