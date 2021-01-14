const AWS = require('aws-sdk');
const moment = require('moment');
var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: "us-east-1" })
AWS.config.update({ region: 'us-east-1' });

exports.main = async (event) => {
    let eventLogPromises = null;
    let blockedUserPromises = null;
    let blockedUserTables = [];
    try {
        eventLogPromises = event.Records.map(async record => {
            const { body } = record;
            var msgObj = JSON.parse(body);
            var params = {
                TableName: "pwdOssEventLogTable",
                Item: {
                    "key": msgObj.key,
                    "colleague_user_name": msgObj.colleague_user_name,
                    "user_name": msgObj.user_name,
                    "event_ts": msgObj.event_ts,
                    "event": msgObj.event
                }
            };
            if(msgObj.event === 'COLLEAGUE_VERIFICATION_COMPLETED') {
                let expireTTL = moment().add(5, 'minutes')
                const epocSeconds = Math.ceil(expireTTL.valueOf()/1000);
                blockedUserTables.push({
                    "blocked_user_name": msgObj.user_name,
                    "blocked_event": "COLLEAGUE_VERIFICATION",
                    "ttl": epocSeconds                  
                });
            }
            console.log("Adding a new item...", JSON.stringify(params));
            return docClient.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item:", JSON.stringify(data, null, 2));
                }
            }).promise();
        });
        blockedUserPromises = blockedUserTables.map(async record => {
            var blockedParams = {
                TableName: "pwdOssBlockedUserEventTable",
                Item: record
            };
            console.log("Adding a new in blocked Users item...", JSON.stringify(blockedParams));
            return docClient.put(blockedParams, function (err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item:", JSON.stringify(data, null, 2));
                }
            }).promise();
        });
    } catch (errObj) {
        console.error('Error ', errObj);
    }
    try {
        let result = await Promise.all(eventLogPromises);
        result = await Promise.all(blockedUserPromises);
        console.log('Done', JSON.stringify(result));
        return result;
    } catch (e) {
        console.error(e);
        console.log('Error', e);
        return e;
    }
};
