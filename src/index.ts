import express from "express";
import axios from 'axios';

var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccount.json");

const bodyParser = require('body-parser');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),

});



const mongoose = require('mongoose')

const DeviceTokenSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  deviceToken: { type: String, required: true, unique: true },
});

const User = mongoose.model('devicetoken', DeviceTokenSchema);

import { getRequiredEnvVar, setDefaultEnvVar } from "./envHelpers";
import {
  addAlchemyContextToRequest,
  validateAlchemySignature,
  AlchemyWebhookEvent,
} from "./webhooksUtil";

async function main(): Promise<void> {
  const app = express();
  mongoose.connect("mongodb://127.0.0.1:27017/devicetokens", {
    useNewUrlParser: true,
})
setDefaultEnvVar("DATABASE_URL", "mongodb://127.0.0.1:27017/devicetokens");

const db = mongoose.connection
db.on('error', (error: any) => console.error(error))
db.once('open', () => console.log('Connected to mongoose'))
  setDefaultEnvVar("PORT", "3000");
  setDefaultEnvVar("HOST", "127.0.0.1");
  setDefaultEnvVar("SIGNING_KEY", "whsec_O8iFY5eJDnTuNxUF9KxesVkW");

  const port = Number(getRequiredEnvVar("PORT"));
  const host = getRequiredEnvVar("HOST");
  const signingKey = getRequiredEnvVar("SIGNING_KEY");
  // Middleware needed to validate the alchemy signature
  app.use(
    express.json({
      verify: addAlchemyContextToRequest,
    })
  );
  app.use(validateAlchemySignature(signingKey));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  // Register handler for Alchemy Notify webhook events
  // TODO: update to your own webhook path
  app.post("/webhook", async (req, res) => {
    try {
    const webhookEvent = req.body;
    // Do stuff with with webhook event here!
    console.log(`Processing webhook event id: ${webhookEvent.id}`);
    const { fromAddress } = webhookEvent.event.activity[0];
    console.log(fromAddress)
    const fromUser = await User.findOne({walletAddress:fromAddress})
    
    const response = await axios.get(`https://api-testnet.polygonscan.com/api?module=account&action=tokentx&contractaddress=0xA3C957f5119eF3304c69dBB61d878798B3F239D9&address=${fromAddress}&page=1&offset=1&sort=desc&apikey=26UDEN3Z37KX5V7PS9UMGHU11WAJ38RZ57`)
    const toAddress = response.data.result[0].to
    const toUser = await User.findOne({walletAddress:toAddress})
    // fetch('https://api-testnet.polygonscan.com/api?module=account&action=tokentx&contractaddress=0xA3C957f5119eF3304c69dBB61d878798B3F239D9&address=0x1a2EAF515a6ca05bfab9bf3d9850ea29e5C7882E&page=1&offset=1&sort=desc&apikey=26UDEN3Z37KX5V7PS9UMGHU11WAJ38RZ57')
      console.log(fromUser + " " + toUser)
    // Be sure to respond with 200 when you successfully process the event
    if(fromUser)
    {
      console.log('how did we get here')
    const message = {
      notification: {
        title: 'New Transaction',
        body: `You have sent a new transaction to ${toUser}`
      },
      token: fromUser.deviceToken
    };
    const huh = await admin.messaging().send(message);
    console.log(huh)
  }
    if(toUser)
    {

      console.log(toUser.deviceToken)
    // Be sure to respond with 200 when you successfully process the event
    const message2 = {
      notification: {
        title: 'New Transaction',
        body: `You have received a new transaction to ${fromUser}`
      },
      token: toUser.deviceToken
    };
    const huh2 = await admin.messaging().send(message2);
    
    console.log(huh2)
  }
    res.send("Alchemy Notify is the best!");
 } 
catch(e)
{
  console.log(e)
  res.send("error in try block")
}});
  app.post('/registerDevice', async (req:any, res:any) => {
    try {
      const { walletAddress, deviceToken } = req.body; 
      const existingUser = await User.findOne({ walletAddress });
      if (existingUser) { 
        existingUser.deviceToken = deviceToken; 
        await existingUser.save();
        return res.status(201).json({ message: 'Device token altered' });
      }
      else {
        const user = new User({
          walletAddress, deviceToken
        });
        await user.save();
        return res.status(201).json({ message: 'Device token registered' });
      }
      
    }
    catch(e) {
      return res.status(400).json({message: e})
    }
  })

  app.get('/serverside', async (req:any, res:any) => {
    try {
      // Set the topic to send the notification to
const topic = 'random';
const { title, body } = req.query
// Construct the notification message
const message = {
  topic: topic,
  notification: {
    title: title,
    body: body,
  },
};

// Send the notification to the topic
admin.messaging().send(message)
  .then((response:any) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error:any) => {
    console.error('Error sending message:', error);
  });
  return res.status(201).json({ message: 'The job is done' });

    }
    catch(e)
    {
      return res.status(400).json({message: e})
    }
  })
  // Listen to Alchemy Notify webhook events
  app.listen(port, host, () => {
    console.log(`Example Alchemy Notify app listening at ${host}:${port}`);
  });


}

main();
