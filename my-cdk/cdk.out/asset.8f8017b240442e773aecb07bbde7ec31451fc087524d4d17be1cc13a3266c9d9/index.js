const AWS = require('aws-sdk');

const ec2 = new AWS.EC2();
const ssm = new AWS.SSM();

async function launchEC2Instance() {
    try {
        const params = {
            ImageId: 'ami-0395649fbe870727e', 
            InstanceType: 't2.micro', 
            KeyName: 'test-ec2-kp', 
            MinCount: 1,
            MaxCount: 1,
            IamInstanceProfile: {
                Arn: 'arn:aws:iam::339713187924:instance-profile/EC2-role'
            }
        };
        const data = await ec2.runInstances(params).promise();
        const instanceId = data.Instances[0].InstanceId;
        return instanceId;
    } catch (err) {
        console.error("Error launching EC2 instance:", err);
        throw err;
    }
}

// async function getInstancePublicIpAddress(instanceId) {
//     try {
//         const params = {
//             InstanceIds: [instanceId]
//         };
//         const data = await ec2.describeInstances(params).promise();
//         const ipAddress = data.Reservations[0].Instances[0].PublicIpAddress;
//         console.log("Instance Public IP Address:", ipAddress);
//         return ipAddress;
//     } catch (err) {
//         console.error("Error getting instance IP address:", err);
//         throw err;
//     }
// }


async function stopEC2Instance(instanceId) {
    try {
        const params = {
            InstanceIds: [instanceId],
        };
        const data = await ec2.terminateInstances(params).promise();
        console.log("EC2 instance terminated:", data);
    } catch (err) {
        console.error("Error terminating EC2 instance:", err);
    }
}

async function downloadScriptFromS3(instanceId, bucketName, key, localPath, record_id) {
    const executeCommand = `python3 ${localPath} ${record_id}`; 
    const s3Path = `s3://${bucketName}/${key}`;
    const copyCommand = `aws s3 cp ${s3Path} ${localPath}`
    console.log("Execute command: ", executeCommand)
    console.log("Copy command: ", copyCommand)
    try {
        const params = {
            DocumentName: 'AWS-RunShellScript',
            InstanceIds: [instanceId],
            Parameters: {
                'commands': [copyCommand, executeCommand]
            }
        };

        const data = await ssm.sendCommand(params).promise();
        console.log('Command sent to instances:', data.Command.CommandId);
        return data.Command.CommandId;
    } catch (err) {
        console.error('Error sending command:', err);
        throw err;
    }
}

// async function executeScriptOnEC2(localPath, instanceIpAddress, record_id) {
//     exec(`ssh ec2-user@${instanceIpAddress} 'bash -s' < ${localPath} ${record_id}`, (err, stdout, stderr) => {
//         if (err) {
//             console.error("Error executing script:", err);
//             throw err;
//         }
//         console.log("Script executed successfully:", stdout);
//     });
// }


exports.handler = async (event, context) => {
    const bucketName = 'input-bucket-sr-dev';
    const s3Key = 'script.py';
    const localScriptPath = '/tmp/script.py';
    const record_id = event.Records[0].dynamodb.Keys.id.S;
    console.log('Record_id = ', record_id);
    let instanceId = '';
    try {
        instanceId = await launchEC2Instance();
        console.log("EC2 instance launched with ID:, waiting for running state", instanceId);
        await ec2.waitFor('instanceRunning', { InstanceIds: [instanceId] }).promise();
        console.log("Instance state is Running!");
        await downloadScriptFromS3(instanceId, bucketName, s3Key, localScriptPath, record_id);
        console.log("Successfully trigger script on ec2");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await stopEC2Instance(instanceId);
    }
};
