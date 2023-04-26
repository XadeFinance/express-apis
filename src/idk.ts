const contractAbi = require('./contractAbi')
import {ethers} from 'ethers';
async function idk()
{
    console.log(contractAbi)
    try {
        const provider = new ethers.JsonRpcProvider(
          "https://rpc-mumbai.maticvigil.com"
        );
          
        const wallet = new ethers.Wallet(
          "ed",
          provider
        );
      
        let contract = new ethers.Contract(
          "0x27B3a77e22B8A9e3f0e003E73b2245dc6A3DC666",
          contractAbi,
          wallet
        );
      
        let tx = await contract.getTestTokens(
          '0x1a2EAF515a6ca05bfab9bf3d9850ea29e5C7882E',
        );
      
        console.log(tx)
        }
        catch(e)
        {
            console.log(e);
        //   res.status(404).send(e)
        }
}

idk();