import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakeToMint } from "../target/types/stake_to_mint";

describe("stake_to_mint", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.StakeToMint as Program<StakeToMint>;

  it("Runs say_hello and logs messages", async () => {
    // Call the say_hello instruction
    const tx = await program.methods.sayHello().rpc();

    console.log("Transaction signature:", tx);

    // Fetch transaction logs to verify msg! outputs
    const confirmedTx = await provider.connection.getTransaction(tx, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    console.log("Program logs:");
    confirmedTx?.meta?.logMessages?.forEach((log) => console.log(log));
  });
});
