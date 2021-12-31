import React, { useEffect, useState } from 'react';
import like from './assets/like.svg';
import dislike from './assets/dislike.svg';
import coin from './assets/coin.svg';
import './App.css';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import kp from './keypair.json'


// Constants
const TWITTER_HANDLE = 'adi1yabharadwaj';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;
// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)
// let baseAccount = Keypair.generate();
// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);
// Set our network to devnet.
const network = clusterApiUrl('devnet');
// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const TEST_GIFS = [
  'https://www.icegif.com/wp-content/uploads/icegif-1625.gif',
  'https://im.indiatimes.in/media/content/2019/Sep/blinking_guy_meme_1569407297.gif',
  'https://cdn.vox-cdn.com/thumbor/IeXiGi58sdd0ARvhKsWWVnng1yw=/800x0/filters:no_upscale()/cdn.vox-cdn.com/uploads/chorus_asset/file/8689071/My5Z2DO.gif',
  'https://cdn.vox-cdn.com/thumbor/QW9Vl8MPGhJhp67r0PuftAuWcxs=/800x0/filters:no_upscale()/cdn.vox-cdn.com/uploads/chorus_asset/file/8687957/tenor.gif',
  'https://cdn.vox-cdn.com/thumbor/lnif9KihwIQtAjlzkCN4WMimKck=/800x0/filters:no_upscale()/cdn.vox-cdn.com/uploads/chorus_asset/file/8689467/gatsby.gif',
  'https://cdn.vox-cdn.com/thumbor/dqGNV0fvUzp8m1ElStnCNjirPsQ=/800x0/filters:no_upscale()/cdn.vox-cdn.com/uploads/chorus_asset/file/8689409/fellowkids.gif'
]



const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("Here is the Account", baseAccount);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account)
      setGifList(account.gifList)

    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }


  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect();
          console.log('Connected with public key:', response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
          console.log("Wallet address is ", walletAddress);
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with public key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("no link given");
      return;
    } 
    setInputValue('');
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("gif successfully sent to program", inputValue);
      await getGifList();
    } catch (error) {
      console.log("error sending gif:", error);
    }
  };
  

  const increment = async (button, gifLink) => {
    console.log("Inside increment");
    try {
      console.log("Here");
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      // send txn to solana blockchain();
      await program.rpc.upvoteGif(gifLink,
        {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });

      await getGifList();
    } catch (error) {
      console.log("Failed to upvote gif: ", gifLink, error);
    }
  };

  const decrement = async(button, gifLink) => {
    console.log("Inside decrement");
  }

  const tipSol = async(toAddress) => {
    var provider = getProvider();
    var connection = new Connection(network, opts.preflightCommitment);
    // var senderWallet = new web3.PublicKey(provider.wallet.publicKey);
    console.log("here is the sender address {} & reciever address {}", provider.wallet.publicKey, toAddress);
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: toAddress,
        lamports: 100000,
      }),
    );

    transaction.feePayer = await provider.wallet.publicKey;
    let blockhashObj = await connection.getRecentBlockhash();
    transaction.recentBlockhash = await blockhashObj.blockhash;

    if (transaction) {
      console.log("transaction created successsfully");
    }
    
    let signed = await provider.wallet.signTransaction(transaction);
    let signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);
    
    console.log("here is the signature of the txn: ", signature);
  }

  const renderNotConnectedContainer = () => {
    
    console.log("in here renderNotConnectedContainer");
    return (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );} 

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    console.log("in here renderConnectedContainer");

    if (gifList === null) {
      console.log("in here gifList == null");

      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
        </button>
        </div>
      )
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      console.log("in here gifList is not null");

      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
          </button>
          </form>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <figure>
                <div className="gif-item" key={index}>
                  <img src={item.gifLink} alt={item.gifLink}/>
                </div>
                <div className="button-grid" > 
                  <button className="cta-button upvote-button" onClick={() => increment(this, item.gifLink)}>
                  <img id="like-button" src={like} alt="like"></img>
                    <span> like </span>
                  </button>
                  <button className="cta-button upvote-button" onClick={() => decrement(this, item.gifLink)}> 
                  <img id="dislike-button" src={dislike} alt="dislike"></img>
                    <span> dislike </span>
                  </button>
                  <button id="tip-button" className='cta-button upvote-button' onClick={() => tipSol(item.userAddress)}>
                  <img src={coin} alt="coin"></img>
                    <span> tip </span>
                  </button> 
                  </div>

              </figure>
            ))}
          </div>
        </div>
      )
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);


  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">may-may portal for dank mimirs</p>
          <p className="sub-text">
            View your may-may collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          <div className={walletAddress ? 'authed-container' : 'container'}>
          {walletAddress && renderConnectedContainer()}
          </div>
        </div>
        <div className="footer-container" >
        Made with ❤️ by {TWITTER_LINK}
        </div>
      </div>
    </div>
  );
};

export default App;
