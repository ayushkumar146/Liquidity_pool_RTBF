import type { FC } from "react";
import React, { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import idlJson from "../idl.json"; // Your deployed IDL

const idl: Idl = idlJson as Idl;
const programID = new PublicKey("BootCCPwrDw4VQorf7UCibk1HSjbWRDRDTWizRPiCyb");

console.log("Program ID:", programID.toBase58());

/* --------- ORIGINAL SayHello COMPONENT --------- */
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

      // Create program object
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

/* ------------------ STAKING UI ------------------ */
export const StakeUI: FC = () => {
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const { connection } = useConnection();

  // const [userTokenMint, setUserTokenMint] = useState<string>("");   // <-- ADD THIS
  const [userTokenAccount, setUserTokenAccount] = useState<string>("");
  const [stakingTokenAccount, setStakingTokenAccount] = useState<string>("");
  const [liabilityMint, setLiabilityMint] = useState<string>("");
  const [userLiabilityAccount, setUserLiabilityAccount] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);

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

  const callStakeTokens = async () => {
    if (!connected) {
      alert("Connect wallet first");
      return;
    }

    if (
      !userTokenAccount ||
      !stakingTokenAccount ||
      !liabilityMint ||
      !userLiabilityAccount ||
      !amount
    ) {
      alert("Fill all staking fields");
      return;
    }

    setBusy(true);

    try {
      console.log("=== Starting stake transaction ===");
      console.log("Raw inputs:", {
        userTokenAccount,

        stakingTokenAccount,
        liabilityMint,
        userLiabilityAccount,
        amount
      });

      // Parse inputs
      const userTokenPub = new PublicKey(userTokenAccount);
      // const userMintPubkey = new PublicKey(userTokenMint); // Use direct mint input
      const stakingTokenPub = new PublicKey(stakingTokenAccount);
      const liabilityMintPub = new PublicKey(liabilityMint);
      const userLiabilityPub = new PublicKey(userLiabilityAccount);
      
      console.log("Parsed pubkeys successfully");

      // Derive liability PDA - same as your Rust code
      const [liabilityPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("liability")],
        programID
      );

      console.log("Liability PDA:", liabilityPda.toBase58(), "bump:", bump);

      // Check if PDA already exists (optional - for logging only)
      const accountInfo = await connection.getAccountInfo(liabilityPda);
      console.log("PDA exists:", accountInfo !== null);
      console.log("PDA will be", accountInfo ? "reused" : "initialized");

      // Use the directly provided mint instead of extracting it
      // console.log("User token mint:", userMintPubkey.toBase58());

      // Anchor provider
      const anchorWallet = getAnchorWallet();
      const provider = new AnchorProvider(
        connection, 
        anchorWallet, 
        AnchorProvider.defaultOptions()
      );
      
      // Create program with 2 arguments
      const program = new Program(idl, provider);

      // Convert amount to BN (u64)
      // Validate amount first
      console.log("Amount value:", amount, "Type:", typeof amount);
      
      if (!amount || amount.trim() === "") {
        alert("Please enter an amount");
        setBusy(false);
        return;
      }

      const numAmount = Number(amount.trim());
      if (isNaN(numAmount) || numAmount <= 0) {
        alert("Please enter a valid positive number for amount");
        setBusy(false);
        return;
      }

      console.log("Creating BN from:", amount.trim());
      const amountBn = new BN(amount.trim());
      console.log("BN created successfully:", amountBn.toString());

      // Call stake_tokens with the NEW account structure
      const tx = await program.methods
        .stakeTokens(amountBn)
        .accounts({
          user: anchorWallet.publicKey,
          userTokenAccount: userTokenPub,
          // userTokenMint: userMintPubkey,  // NEW: Required for transfer_checked
          stakingTokenAccount: stakingTokenPub,
          liabilityAccount: liabilityPda,
          liabilityMint: liabilityMintPub,
          userLiabilityAccount: userLiabilityPub,
          mintAuthority: liabilityPda, // PDA is the mint authority
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("stake_tokens tx:", tx);
      alert("Staking tx sent: " + tx);
    } catch (err: any) {
      console.error("Error staking:", err);
      alert("Stake error: " + (err?.message ?? String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 16, padding: 8, borderTop: "1px solid #ddd" }}>
      <h3>Stake Tokens UI</h3>

      <div style={{ marginBottom: 12, padding: 8, backgroundColor: "#f0f0f0", borderRadius: 4 }}>
        <strong>Setup Required:</strong>
        <ol style={{ margin: "8px 0", paddingLeft: 20, fontSize: "14px" }}>
          <li>Create a liability token mint with PDA as mint authority</li>
          <li>Create associated token accounts for all required tokens</li>
          <li>Ensure the liability mint's mint authority is the PDA: <code style={{ fontSize: "12px", backgroundColor: "#fff", padding: "2px 4px" }}>liability PDA</code></li>
        </ol>
        <div style={{ fontSize: "12px", marginTop: 8 }}>
          <strong>Liability PDA:</strong> <code style={{ backgroundColor: "#fff", padding: "2px 4px" }}>
            {connected && PublicKey.findProgramAddressSync([Buffer.from("liability")], programID)[0].toBase58()}
          </code>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
        <label>
          User token account (source)
          <input
            value={userTokenAccount}
            onChange={(e) => setUserTokenAccount(e.target.value)}
            placeholder="Your token account pubkey"
            style={{ width: "100%" }}
          />
        </label>

        {/* <label>
          User token mint (the mint of the staking token)
          <input
            value={userTokenMint}
            onChange={(e) => setUserTokenMint(e.target.value)}
            placeholder="Staking token mint address (e.g., 8D5pnS3GTWKfRfcvVfNpuUYjoFv88B2M7jEpYKvwBaEF)"
            style={{ width: "100%" }}
          />
        </label> */}

        <label>
          Staking token account (vault)
          <input
            value={stakingTokenAccount}
            onChange={(e) => setStakingTokenAccount(e.target.value)}
            placeholder="Vault token account pubkey"
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Liability mint
          <input
            value={liabilityMint}
            onChange={(e) => setLiabilityMint(e.target.value)}
            placeholder="Liability mint pubkey"
            style={{ width: "100%" }}
          />
        </label>

        <label>
          User liability token account
          <input
            value={userLiabilityAccount}
            onChange={(e) => setUserLiabilityAccount(e.target.value)}
            placeholder="User liability token account pubkey"
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Amount (raw token units, u64)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 1000"
            style={{ width: 240 }}
          />
        </label>

        <div>
          <button onClick={callStakeTokens} disabled={!connected || busy}>
            {busy ? "Staking..." : "Stake Tokens"}
          </button>
          <button 
            onClick={async () => {
              try {
                const anchorWallet = getAnchorWallet();
                const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
                const program = new Program(idl, provider);

                const userTokenPub = new PublicKey(userTokenAccount);
                const userTokenAccountInfo = await connection.getParsedAccountInfo(userTokenPub);
                const parsedData = (userTokenAccountInfo.value?.data as any)?.parsed;
                const userMintPubkey = new PublicKey(parsedData.info.mint);
                
                const userMintAccountInfo = await connection.getAccountInfo(userMintPubkey);
                const tokenProgramId = userMintAccountInfo.owner;

                const tx = await program.methods
                  .testAccounts()
                  .accounts({
                    user: anchorWallet.publicKey,
                    userTokenAccount: userTokenPub,
                    userTokenMint: userMintPubkey,
                    stakingTokenAccount: new PublicKey(stakingTokenAccount),
                    liabilityMint: new PublicKey(liabilityMint),
                    userLiabilityAccount: new PublicKey(userLiabilityAccount),
                    tokenProgram: tokenProgramId,
                  })
                  .rpc();

                console.log("Test accounts tx:", tx);
                alert("Test passed! tx: " + tx);
              } catch (err: any) {
                console.error("Test accounts error:", err);
                alert("Test failed: " + err.message);
              }
            }}
            disabled={!connected}
            style={{ marginLeft: 8 }}
          >
            Test Accounts First
          </button>
        </div>
      </div>
    </div>
  );
};