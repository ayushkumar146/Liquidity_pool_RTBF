import type { FC } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";

import idlJson from "../idl.json"; // Your deployed IDL

const idl: Idl = idlJson as Idl;
const programID = new PublicKey("BootCCPwrDw4VQorf7UCibk1HSjbWRDRDTWizRPiCyb");

console.log("Program ID:", programID.toBase58());

const SayHello: FC = () => {
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const { connection } = useConnection();

  // Helper: adapt wallet for Anchor
  const getAnchorWallet = () => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      throw new Error("Wallet not connected or not supported by Anchor");
    }
    
    return {
      publicKey: publicKey,
      signTransaction: signTransaction,
      signAllTransactions: signAllTransactions,
    };
  };

  const callSayHello = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      alert("Connect your wallet first!");
      return;
    }

    try {
      // Wrap wallet for Anchor
      const anchorWallet = getAnchorWallet();

      // Create Anchor provider
      const provider = new AnchorProvider(
        connection,
        anchorWallet,
        AnchorProvider.defaultOptions()
      );

      // Create program object - use 2-argument constructor
      // The IDL already contains the program address
      const program = new Program(idl, provider);

      // Call the say_hello RPC
      const tx = await program.methods.sayHello().rpc();

      console.log("Transaction signature:", tx);
      alert("Transaction sent: " + tx);
    } catch (err: any) {
      console.error("Error calling say_hello:", err);
      alert("Error: " + err.message);
    }
  };

  return (
    <div>
      {!connected ? (
        <button disabled>Connect wallet from top-right</button>
      ) : (
        <button onClick={callSayHello}>Call say_hello()</button>
      )}
    </div>
  );
};

export default SayHello;