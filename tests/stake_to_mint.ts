import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakeToMint } from "../target/types/stake_to_mint";

describe("stake_to_mint", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.StakeToMint as Program<StakeToMint>;

  it("Say hello!", async () => {
    await program.methods
      .sayHello()
      .rpc();

    console.log("Ayush's first program ran!");
  });
});
