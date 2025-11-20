// SayHello.tsx (original code unchanged, then appended stake UI)

import type { FC } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";

import idlJson from "../idl.json"; // Your deployed IDL

const idl: Idl = idlJson as Idl;
const programID = new PublicKey("BootCCPwrDw4VQorf7UCibk1HSjbWRDRDTWizRPiCyb");

console.log("Program ID:", programID.toBase58());

/* --------- YOUR ORIGINAL SayHello COMPONENT (VERBATIM) --------- */
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
/* --------- END original component (untouched) --------- */

export default SayHello;

/* ------------------ APPEND: STAKING UI + CALL ------------------ */

import React, { useState } from "react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

/**
 * StakingUI component - append this to any page or render it below SayHello.
 * This uses the same getAnchorWallet / provider pattern as your original.
 *
 * Fields required:
 * - userTokenAccount: user's source token account (SPL token ATA)
 * - stakingTokenAccount: the vault / pool token account (SPL token account)
 * - liabilityMint: the mint pubkey for liability tokens (SPL Mint)
 * - userLiabilityAccount: user's token account for receiving liability tokens (ATA for liabilityMint)
 * - amount: number of tokens (uint64) to stake
 *
 * NOTE: The liability PDA in your Rust uses seeds [b"liability"], so we derive it here.
 */
export const StakeUI: FC = () => {
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const { connection } = useConnection();

  const [userTokenAccount, setUserTokenAccount] = useState<string>("");
  const [stakingTokenAccount, setStakingTokenAccount] = useState<string>("");
  const [liabilityMint, setLiabilityMint] = useState<string>("");
  const [userLiabilityAccount, setUserLiabilityAccount] = useState<string>("");
  const [amount, setAmount] = useState<string>(""); // take decimal/whole as string
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
      // parse inputs
      const userTokenPub = new PublicKey(userTokenAccount);
      const stakingTokenPub = new PublicKey(stakingTokenAccount);
      const liabilityMintPub = new PublicKey(liabilityMint);
      const userLiabilityPub = new PublicKey(userLiabilityAccount);

      // derive liability PDA (same seed used in your Rust: [b"liability"])
     const [liabilityPda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("liability")],
  programID
);

      console.log("liabilityPda", liabilityPda.toBase58(), "bump", bump);

      // Anchor provider
      const anchorWallet = getAnchorWallet();
      const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
      const program = new Program(idl, provider);

      // convert amount to BN (u64)
      // NOTE: this assumes 'amount' is smallest unit (e.g. raw token amount).
      // If user-entered decimals, convert accordingly before calling.
      const amountBn = new BN(amount.toString());

      // call stake_tokens
      const tx = await program.methods
        .stakeTokens(amountBn)
        .accounts({
          user: anchorWallet.publicKey,
          userTokenAccount: userTokenPub,
          stakingTokenAccount: stakingTokenPub,
          liabilityAccount: liabilityPda,
          liabilityMint: liabilityMintPub,
          userLiabilityAccount: userLiabilityPub,
          mintAuthority: liabilityPda, // your Rust expects the PDA here
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: new PublicKey("SysvarRent111111111111111111111111111111111"),

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
      <h3>Stake tokens (UI added)</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
        <label>
          User token account (source)
          <input
            value={userTokenAccount}
            onChange={(e) => setUserTokenAccount(e.target.value)}
            placeholder="Eg: <your token account pubkey>"
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Staking token account (vault)
          <input
            value={stakingTokenAccount}
            onChange={(e) => setStakingTokenAccount(e.target.value)}
            placeholder="Eg: <vault token account pubkey>"
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Liability mint (the mint for liability tokens)
          <input
            value={liabilityMint}
            onChange={(e) => setLiabilityMint(e.target.value)}
            placeholder="Eg: <liability mint pubkey>"
            style={{ width: "100%" }}
          />
        </label>

        <label>
          User liability token account (destination for minted liability tokens)
          <input
            value={userLiabilityAccount}
            onChange={(e) => setUserLiabilityAccount(e.target.value)}
            placeholder="Eg: <user liability token account pubkey>"
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Amount (raw token units, u64)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Eg: 1000 (raw amount in smallest units)"
            style={{ width: 240 }}
          />
        </label>

        <div>
          <button onClick={callStakeTokens} disabled={!connected || busy}>
            {busy ? "Staking..." : "Stake tokens (call stake_tokens)"}
          </button>
        </div>
      </div>
    </div>
  );
};
