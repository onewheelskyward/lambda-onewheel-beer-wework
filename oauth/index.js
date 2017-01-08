const aws = require('aws-sdk');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const superagent = require('superagent');

exports.handler = function(event, context) {
    console.log('Received event params:', JSON.stringify(event.queryStringParameters, null, 2));

    superagent.get("https://slack.com/api/oauth.access")
        .query({
            code: event.queryStringParameters.code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET
        })
        .end(function (err, res) {
            console.log(JSON.stringify(res.body));
            //{"ok":true,
            // "access_token":"xoxp-64777119111-64768314870-122418094660-37a963b287745a2b1935e0104cedf7bc",
            // "scope":"identify,commands",
            // "user_id":"U1WNL98RL",
            // "team_name":"krepsfam",
            // "team_id":"T1WNV3H39"}
            // { "ok": false, "error": "code_expired" }

            var params = {
                Item: {
                    ok: res.body.ok,
                    access_token: res.body.access_token,
                    scope: res.body.scope,
                    user_id: res.body.user_id,
                    team_name: res.body.team_name,
                    team_id: res.body.team_id
                },
                TableName: 'WeWorkOauth' /* required */
            };

            console.log("Placing item in dynamo: " + JSON.stringify(params));

            dynamo.putItem(params, function (err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON: ", JSON.stringify(err, null, 2));
                    context.fail();
                } else {
                    console.log("Item added.");
                    superagent.get("https://slack.com/api/auth.test")
                        .query({
                            token: res.body.access_token
                        })
                        .end(function (err, res) {
                            console.log(JSON.stringify(res.body));
                            context.succeed({
                                statusCode: 200,
                                headers: {},
                                body: JSON.stringify(res.body)
                            });
                        });
                }
            });
        });
};
