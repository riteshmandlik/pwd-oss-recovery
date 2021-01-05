const AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: "us-east-1" })
AWS.config.update({ region: 'us-east-1' });

exports.main = async (event) => {
        const { messageId, body } = event;
        try {
            var msgObj = JSON.parse(body);
            var params = {
                TableName: "pwdUsernameColleagueUsernameLogTable",
                Item: {
                    "key": msgObj.key,
                    "colleague_user_name": msgObj.colleague_user_name,
                    "user_name": msgObj.user_name,
                    "requested_ts": msgObj.requested_ts,
                    "status": msgObj.status
                }
            };
            console.log("Adding a new item...");
            docClient.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item:", JSON.stringify(data, null, 2));
                }
            });

        } catch (err) {
            console.error('NoId', err);
        }
        return 'Complete'
};
