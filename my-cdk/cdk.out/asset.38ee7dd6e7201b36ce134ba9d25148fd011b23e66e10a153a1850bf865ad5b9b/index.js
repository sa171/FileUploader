const AWS = require('aws-sdk');
const { exec } = require('child_process');

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();

async function launchEC2Instance() {
    try {
        const params = {
            ImageId: 'ami-0395649fbe870727e', 
            InstanceType: 't2.micro', 
            KeyName: 'test-ec2-kp', 
            MinCount: 1,
            MaxCount: 1
        };
        const data = await ec2.runInstances(params).promise();
        const instanceId = data.Instances[0].InstanceId;
        console.log("EC2 instance launched with ID:, waiting for running state", instanceId);
        await ec2.waitFor('instanceRunning', { InstanceIds: [instanceId] }).promise();
        console.log("Instance state is Running!");
        return instanceId;
    } catch (err) {
        console.error("Error launching EC2 instance:", err);
        throw err;
    }
}

async function startEC2Instance(instanceId) {
    try {
        const params = {
            InstanceIds: [instanceId],
            DryRun: false
        };
        const data = await ec2.startInstances(params).promise();
        console.log("EC2 instance started:", data);
    } catch (err) {
        console.error("Error starting EC2 instance:", err);
        throw err;
    }
}

async function stopEC2Instance(instanceId) {
    try {
        const params = {
            InstanceIds: [instanceId],
            DryRun: false
        };
        const data = await ec2.stopInstances(params).promise();
        console.log("EC2 instance stopped:", data);
    } catch (err) {
        console.error("Error stopping EC2 instance:", err);
        throw err;
    }
}

async function downloadScriptFromS3(bucketName, key, localPath) {
    try {
        const params = {
            Bucket: bucketName,
            Key: key
        };
        await s3.getObject(params).promise()
            .createReadStream()
            .pipe(require('fs').createWriteStream(localPath));
        console.log("Script downloaded from S3");
    } catch (err) {
        console.error("Error downloading script from S3:", err);
        throw err;
    }
}

async function runScript(localPath, record_id) {
    try {
        exec('python3 ' + localPath + ' ' + record_id, (err, stdout, stderr) => {
            if (err) {
                console.error("Error running script:", err);
                throw err;
            }
            console.log("Script executed successfully:", stdout);
        });
    } catch (err) {
        console.error("Error running script:", err);
        throw err;
    }
}

exports.handler = async (event, context) => {
    const bucketName = 'input-bucket-sr-dev';
    const s3Key = 'script.py';
    const localScriptPath = '/tmp/script.py';
    const record_id = event.Records[0].dynamodb.Keys.id.S;
    console.log('Record_id = ', record_id);
    try {
        const instanceId = await launchEC2Instance();
        await startEC2Instance(instanceId);

        await downloadScriptFromS3(bucketName, s3Key, localScriptPath);
        
        await runScript(localScriptPath, record_id );
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await stopEC2Instance(instanceId);
    }
};
