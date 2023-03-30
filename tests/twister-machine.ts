import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TwisterMachine } from "../target/types/twister_machine";
import * as spl from "@solana/spl-token";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const print = console.log;
anchor.setProvider(anchor.Provider.env());
const provider = anchor.getProvider();
const payer = (provider.wallet as NodeWallet).payer;
const program = anchor.workspace.TwisterMachine as Program<TwisterMachine>;

// describe("paid with sol - lottery", () => {
//   // Configure the client to use the local cluster.
//   let payerAwardOneATA: anchor.web3.PublicKey = null;
//   let payerAwardTwoATA: anchor.web3.PublicKey = null;
//   let machinePubkey:anchor.web3.PublicKey = null;
//   let payForMint: anchor.web3.PublicKey = null;
//   let userKeypair: anchor.web3.Keypair = null;
//   let userAwardOneATA: anchor.web3.PublicKey = null;
//   let userAwardTwoATA: anchor.web3.PublicKey = null;
//   let userGeneral: anchor.web3.PublicKey = null;
//   let userSpecial: anchor.web3.PublicKey = null;
//   const awardOneId = 0;
//   const awardTwoId = 1;
//   // say this is USDC
//   let awardOneMintKeypair: anchor.web3.Keypair = null;
//   // this is USDT
//   let awardTwoMintKeypair: anchor.web3.Keypair = null;
//   const decimals = 6;
//   let awardOne: anchor.web3.PublicKey = null;
//   let awardTwo: anchor.web3.PublicKey = null;

//   let machineNonce = 0;
//   const machineId = 0;
//   const randSeed = 1660;  // award 1
//   // const randSeed = 1962;  // award 2
//   // const randSeed = 2081;  // fragment 123
//   // const randSeed = 1958;  // fragment 456
//   const defaultLimit = 10;
//   const defaultFragmentId = 0;
//   const price = anchor.web3.LAMPORTS_PER_SOL * 0.1;

//   it("generate account", async () => {
//     await provider.connection.requestAirdrop(
//       payer.publicKey,
//       anchor.web3.LAMPORTS_PER_SOL * 100,
//     );
//     print("request 100 SOL: ", payer.publicKey.toBase58());

//     // find machine pubkey
//     const [machine, nonce] = await anchor.web3.PublicKey.findProgramAddress(
//       [payer.publicKey.toBuffer(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]), Buffer.from("twister")],
//       program.programId,
//     );
//     machinePubkey = machine;
//     machineNonce = nonce;
//     print("machinePubkey:", machinePubkey.toBase58());

//     // award mint
//     awardOneMintKeypair = await anchor.web3.Keypair.generate();
//     print("awardOneMintKeypair: ", awardOneMintKeypair.publicKey.toBase58());
//     awardTwoMintKeypair = await anchor.web3.Keypair.generate();
//     print("awardTwoMintKeypair: ", awardTwoMintKeypair.publicKey.toBase58());

//     await spl.createMint(
//       provider.connection,
//       payer,
//       payer.publicKey,
//       null,
//       decimals,
//       awardOneMintKeypair,
//     );
//     await spl.createMint(
//       provider.connection,
//       payer,
//       payer.publicKey,
//       null,
//       decimals,
//       awardTwoMintKeypair,
//     );

//     // program award token account, do not need to initialize
//     const [award1, nonce1] = await anchor.web3.PublicKey.findProgramAddress(
//       [machinePubkey.toBuffer(), Buffer.from([0, 0, 0, 0])],
//       program.programId,
//     );
//     awardOne = award1;
//     print("awardOne:", awardOne.toBase58());

//     const [award2, nonce2] = await anchor.web3.PublicKey.findProgramAddress(
//       [machinePubkey.toBuffer(), Buffer.from([1, 0, 0, 0])],
//       program.programId,
//     );
//     awardTwo = award2;
//     print("awardTwo:", awardTwo.toBase58());

//     // payer token account for award
//     payerAwardOneATA = await spl.createAssociatedTokenAccount(
//       provider.connection,
//       payer,
//       awardOneMintKeypair.publicKey,
//       payer.publicKey,
//     );
//     print("payerAwardOneATA:", payerAwardOneATA.toBase58());

//     // mint 1000 USDC to payerAwardOneATA
//     // will be divieded into 10 times 1000 USDC
//     await spl.mintTo(
//       provider.connection,
//       payer,
//       awardOneMintKeypair.publicKey,
//       payerAwardOneATA,
//       payer.publicKey,
//       1000 * (10 ** decimals),
//     )

//     payerAwardTwoATA = await spl.createAssociatedTokenAccount(
//       provider.connection,
//       payer,
//       awardTwoMintKeypair.publicKey,
//       payer.publicKey,
//     );
//     print("payerAwardTwoATA:", payerAwardTwoATA.toBase58());

//     // mint 400 USDT to payerAwardTwoATA
//     // will be divided into 20 times 20 USDT
//     await spl.mintTo(
//       provider.connection,
//       payer,
//       awardTwoMintKeypair.publicKey,
//       payerAwardTwoATA,
//       payer.publicKey,
//       400 * (10 ** decimals),
//     );

//     // user and user's token account for award
//     userKeypair = await anchor.web3.Keypair.generate();
//     print("userKeypair:", userKeypair.publicKey.toBase58());

//     await provider.connection.requestAirdrop(
//       userKeypair.publicKey,
//       anchor.web3.LAMPORTS_PER_SOL * 50,
//     );
//     print("request 50 SOL: ", userKeypair.publicKey.toBase58());

//     userAwardOneATA = await spl.createAssociatedTokenAccount(
//       provider.connection,
//       payer,
//       awardOneMintKeypair.publicKey,
//       userKeypair.publicKey,
//     );
//     print("userAwardOneATA:", userAwardOneATA.toBase58());

//     userAwardTwoATA = await spl.createAssociatedTokenAccount(
//       provider.connection,
//       payer,
//       awardTwoMintKeypair.publicKey,
//       userKeypair.publicKey,
//     );
//     print("userAwardTwoATA:", userAwardTwoATA.toBase58());
//   });

//   it("Is initialized!", async () => {
//     // Add your test here.
//     payForMint = spl.NATIVE_MINT;
//     print("mintPubkey:", payForMint.toBase58());

//     const tx = await program.rpc.initializeTwisterMachine(
//       new anchor.BN(machineId),
//       new anchor.BN(machineNonce),
//       new anchor.BN(randSeed),
//       new anchor.BN(price),
//       new anchor.BN(defaultLimit),
//       new anchor.BN(defaultFragmentId),
//       {
//         accounts: {
//           authority: payer.publicKey,
//           beneficiary: payer.publicKey,
//           mint: payForMint,
//           machine: machinePubkey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         },
//         signers: [payer],
//       }
//     );
//     print("initialize twister machine transaction signature", tx);

//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("nonce: ", machineAccount.nonce);
//     print("status: ", machineAccount.status);
//     print("defaultLimit: ", parseInt(machineAccount.defaultLimit.toString()));
//     print("rand_seed: ", parseInt(machineAccount.randSeed.toString()));
//     print("price: ", parseInt(machineAccount.price.toString()));
//     print("beneficiary: ", machineAccount.beneficiary.toBase58());
//     print("mint: ", machineAccount.mint.toBase58());
//     print("authority: ", machineAccount.authority.toBase58());
//     print("filling_fragment_id: ", parseInt(machineAccount.fillingFragmentId.toString()));
//     print("activate: ", new Date(parseInt(machineAccount.activateAt.toString()) * 1000));
//     print("stop_at: ", new Date(parseInt(machineAccount.stopAt.toString()) * 1000));
//   });

//   it("Add awards", async () => {
//     let award = new Award();
//     award.amount = new anchor.BN(100 * (10 ** decimals));
//     award.quota = new anchor.BN(10);
//     award.rateNumerator = new anchor.BN(10);

//     const tx = await program.rpc.addAward(
//       new anchor.BN(awardOneId),
//       award,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//           award: awardOne,
//           token: payerAwardOneATA,
//           mint: awardOneMintKeypair.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           tokenProgram: spl.TOKEN_PROGRAM_ID,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         },
//         signers: [payer],
//       }
//     );
//     print("add award1 transaction signature", tx);

//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("index: ", parseInt(machineAccount.awards.index.toString()));
//     const award1 = machineAccount.awards.awards[0];
//     print("amount: ", parseInt(award1.amount.toString()));
//     print("quota: ", parseInt(award1.quota.toString()));
//     print("rate_numerator: ", parseInt(award1.rateNumerator.toString()));

//     award.amount = new anchor.BN(20 * (10 ** decimals));
//     award.quota = new anchor.BN(20);
//     award.rateNumerator = new anchor.BN(50);

//     const tx2 = await program.rpc.addAward(
//       new anchor.BN(awardTwoId),
//       award,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//           award: awardTwo,
//           token: payerAwardTwoATA,
//           mint: awardTwoMintKeypair.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           tokenProgram: spl.TOKEN_PROGRAM_ID,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         },
//         signers: [payer],
//       }
//     );
//     print("add award2 transaction signature", tx2);

//     machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("index: ", parseInt(machineAccount.awards.index.toString()));
//     const award2 = machineAccount.awards.awards[1];
//     print("amount: ", parseInt(award2.amount.toString()));
//     print("quota: ", parseInt(award2.quota.toString()));
//     print("rate_numerator: ", parseInt(award2.rateNumerator.toString()));
//   });

//   it("update award one", async () => {
//     const tx = await program.rpc.updateAward(
//       awardOneId,
//       100,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//         },
//         signers: [payer]
//       }
//     );

//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("after first time update");
//     print("awardOne amount: ", parseInt(machineAccount.awards.awards[0].amount.toString()));
//     print("awardOne quota: ", parseInt(machineAccount.awards.awards[0].quota.toString()));
//     print("awardOne rateNumerator: ", parseInt(machineAccount.awards.awards[0].rateNumerator.toString()));

//     const tx2 = await program.rpc.updateAward(
//       awardOneId,
//       10,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//         },
//         signers: [payer]
//       }
//     );

//     machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("after second time update");
//     print("awardOne amount: ", parseInt(machineAccount.awards.awards[0].amount.toString()));
//     print("awardOne quota: ", parseInt(machineAccount.awards.awards[0].quota.toString()));
//     print("awardOne rateNumerator: ", parseInt(machineAccount.awards.awards[0].rateNumerator.toString()));
//   });

//   it("add fragment", async () => {
//     let fragment = new Fragment();
//     fragment.id = new anchor.BN(123);
//     fragment.quota = new anchor.BN(100);
//     fragment.limit = new anchor.BN(3);
//     fragment.rateNumerator = new anchor.BN(100);

//     const tx = await program.rpc.addFragment(
//       fragment,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//         },
//         signers: [payer]
//       }
//     );
//     print("add fragment transaction signature", tx);

//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("first add fragments:");
//     for (let i = 0; i < machineAccount.fragments.index; i++) {
//       print("  -------sep-------")
//       print("  index: ", i);
//       print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
//       print("    quota: ", machineAccount.fragments.fragments[i].quota);
//       print("    limit: ", machineAccount.fragments.fragments[i].limit);
//       print("    rate_numerator: ", machineAccount.fragments.fragments[i].rateNumerator);
//     }

//     fragment.id = new anchor.BN(456);
//     fragment.quota = new anchor.BN(200);
//     fragment.limit = new anchor.BN(5);
//     fragment.rateNumerator = new anchor.BN(200);
    
//     const tx2 = await program.rpc.addFragment(
//       fragment,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//         },
//         signers: [payer]
//       }
//     );
//     print("add fragment transaction signature", tx2);

//     machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("second add fragments:");
//     for (let i = 0; i < machineAccount.fragments.index; i++) {
//       print("  -------sep-------")
//       print("  index: ", i);
//       print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
//       print("    quota: ", machineAccount.fragments.fragments[i].quota);
//       print("    limit: ", machineAccount.fragments.fragments[i].limit);
//       print("    rate_numerator: ", machineAccount.fragments.fragments[i].rateNumerator);
//     }
//   });

//   it("activated", async () => {
//     const now = new Date().getTime();
//     const deadline = new Date().getTime() + 10 * 1000;
//     const tx = await program.rpc.activatedTwisterMachine(
//       new anchor.BN(now / 1000),
//       new anchor.BN(deadline / 1000),
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//           clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//         },
//         signers: [payer],
//       }
//     );
//     print("activate twister machine transaction signature", tx);
    
//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("status: ", machineAccount.status);
//     print("activate: ", new Date(parseInt(machineAccount.activateAt.toString()) * 1000));
//     print("stop_at: ", new Date(parseInt(machineAccount.stopAt.toString()) * 1000));
//     print("fragment index: ", parseInt(machineAccount.fragments.index.toString()));
//     print("fragment id: ", parseInt(machineAccount.fragments.fragments[0].id.toString()));
//     print("fragment quota: ", parseInt(machineAccount.fragments.fragments[0].quota.toString()));
//     print("fragment limit: ", parseInt(machineAccount.fragments.fragments[0].limit.toString()));
//   });

//   it("create fragment account", async () => {
//     const [general, n1] = await anchor.web3.PublicKey.findProgramAddress(
//       [userKeypair.publicKey.toBuffer(), Buffer.from("general")],
//       program.programId,
//     );
//     userGeneral = general;
//     print("general:", general.toBase58());
//     const [special, n2] = await anchor.web3.PublicKey.findProgramAddress(
//       [machinePubkey.toBuffer(), userKeypair.publicKey.toBuffer(), Buffer.from("special")],
//       program.programId,
//     );
//     userSpecial = special;
//     print("special:", special.toBase58());

//     const tx = await program.rpc.createGeneralAccount(
//       {
//         accounts: {
//           authority: userKeypair.publicKey,
//           user: userKeypair.publicKey,
//           general,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         },
//         signers: [userKeypair],
//       }
//     );
//     print("create general account transaction signature", tx);

//     const tx2 = await program.rpc.createSpecialAccount(
//       {
//         accounts: {
//           authority: userKeypair.publicKey,
//           machine: machinePubkey,
//           user: userKeypair.publicKey,
//           special,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         },
//         signers: [userKeypair],
//       }
//     );
//     print("create special account transaction signature", tx2);

//     const specialAccount = await program.account.specialAccount.fetch(special);
//     print("special account: ", specialAccount.authority.toBase58());
//     for (let i = 0; i < specialAccount.fragments.index; i++) {
//       print("  -------sep-------")
//       print("  index: ", i);
//       print("    id: ", parseInt(specialAccount.fragments.fragments[i].id.toString()));
//       print("    quota: ", specialAccount.fragments.fragments[i].quota);
//     }
//   });

//   it("lottery", async () => {
//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("beforce awards:");
//     print("  machine randSeed: ", parseInt(machineAccount.randSeed.toString()));
//     for (let i = 0; i < machineAccount.awards.index; i++) {
//       print("  -------sep-------")
//       print("  index: ", i);
//       print("    amount: ", parseInt(machineAccount.awards.awards[i].amount.toString()));
//       print("    quota: ", machineAccount.awards.awards[i].quota);
//       print("    rateNumerator: ", machineAccount.awards.awards[i].rateNumerator);
//     }
//     print("beforce fragments:");
//     for (let i = 0; i < machineAccount.fragments.index; i++) {
//       print("  -------sep-------")
//       print("  index: ", i);
//       print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
//       print("    quota: ", machineAccount.fragments.fragments[i].quota);
//       print("    limit: ", machineAccount.fragments.fragments[i].limit);
//       print("    rate_numerator: ", machineAccount.fragments.fragments[i].rateNumerator);
//     }
//     let awardOneToken = await spl.getAccount(provider.connection, awardOne);
//     let awardTwoToken = await spl.getAccount(provider.connection, awardTwo);
//     let userAwardOneATAToken = await spl.getAccount(provider.connection, userAwardOneATA);
//     let userAwardTwoATAToken = await spl.getAccount(provider.connection, userAwardTwoATA);
//     print("program award one: ", parseInt(awardOneToken.amount.toString()));
//     print("program award two: ", parseInt(awardTwoToken.amount.toString()));
//     print("user award one: ", parseInt(userAwardOneATAToken.amount.toString()));
//     print("user award two: ", parseInt(userAwardTwoATAToken.amount.toString()));

//     const tx = await program.rpc.lottery(
//       { paid: {}},
//       {
//         accounts: {
//           authority: userKeypair.publicKey,
//           payable: userKeypair.publicKey,
//           beneficiary: payer.publicKey,
//           machine: machinePubkey,
//           general: userGeneral,
//           special: userSpecial,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           tokenProgram: spl.TOKEN_PROGRAM_ID,
//           clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//         },
//         remainingAccounts: [
//           {pubkey: awardOne, isSigner: false, isWritable: true},
//           {pubkey: awardTwo, isSigner: false, isWritable: true},
//           {pubkey: userAwardOneATA, isSigner: false, isWritable: true},
//           {pubkey: userAwardTwoATA, isSigner: false, isWritable: true},
//         ],
//         signers: [userKeypair]
//       }
//     );
//     print("lottery transaction signature", tx);

//     machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("after awards:");
//     print("  machine randSeed: ", parseInt(machineAccount.randSeed.toString()));
//     for (let i = 0; i < machineAccount.awards.index; i++) {
//       print("  -------sep-------")
//       print("  index: ", i);
//       print("    amount: ", parseInt(machineAccount.awards.awards[i].amount.toString()));
//       print("    quota: ", machineAccount.awards.awards[i].quota);
//       print("    rateNumerator: ", machineAccount.awards.awards[i].rateNumerator);
//     }
//     print("after fragments:");
//     for (let i = 0; i < machineAccount.fragments.index; i++) {
//       print("  -------sep-------")
//       print("  index: ", i);
//       print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
//       print("    quota: ", machineAccount.fragments.fragments[i].quota);
//       print("    limit: ", machineAccount.fragments.fragments[i].limit);
//       print("    rate_numerator: ", machineAccount.fragments.fragments[i].rateNumerator);
//     }
//     awardOneToken = await spl.getAccount(provider.connection, awardOne);
//     awardTwoToken = await spl.getAccount(provider.connection, awardTwo);
//     userAwardOneATAToken = await spl.getAccount(provider.connection, userAwardOneATA);
//     userAwardTwoATAToken = await spl.getAccount(provider.connection, userAwardTwoATA);
//     print("program award one: ", parseInt(awardOneToken.amount.toString()));
//     print("program award two: ", parseInt(awardTwoToken.amount.toString()));
//     print("user award one: ", parseInt(userAwardOneATAToken.amount.toString()));
//     print("user award two: ", parseInt(userAwardTwoATAToken.amount.toString()));
//   });
// });

function Fragment() {
  this.id;
  this.quota;
  this.limit;
  this.rateNumerator
}

// describe("paid with sol - simple lottery", () => {
//   // Configure the client to use the local cluster.
//   let payerAwardOneATA: anchor.web3.PublicKey = null;
//   let payerAwardTwoATA: anchor.web3.PublicKey = null;
//   let machinePubkey:anchor.web3.PublicKey = null;
//   let payForMint: anchor.web3.PublicKey = null;
//   let userKeypair: anchor.web3.Keypair = null;
//   let userAwardOneATA: anchor.web3.PublicKey = null;
//   let userAwardTwoATA: anchor.web3.PublicKey = null;
//   let userGeneral: anchor.web3.PublicKey = null;

//   const awardOneId = 0;
//   const awardTwoId = 1;
//   // say this is USDC
//   let awardOneMintKeypair: anchor.web3.Keypair = null;
//   // this is USDT
//   let awardTwoMintKeypair: anchor.web3.Keypair = null;
//   const decimals = 6;
//   let awardOne: anchor.web3.PublicKey = null;
//   let awardTwo: anchor.web3.PublicKey = null;

//   let machineNonce = 0;
//   const machineId = 0;
//   const randSeed = 1660;  // award 1
//    const randSeed = 1962;  // award 2
//   const defaultLimit = 10;
//   const defaultFragmentId = 0;
//   const price = anchor.web3.LAMPORTS_PER_SOL * 0.1;

//   it("generate account", async () => {

//     await provider.connection.requestAirdrop(
//       payer.publicKey,
//       anchor.web3.LAMPORTS_PER_SOL * 100,
//     );
//     print("request 100 SOL: ", payer.publicKey.toBase58());

//     // find machine pubkey
//     const [machine, nonce] = await anchor.web3.PublicKey.findProgramAddress(
//       [payer.publicKey.toBuffer(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]), Buffer.from("twister")],
//       program.programId,
//     );
//     machinePubkey = machine;
//     machineNonce = nonce;
//     print("machinePubkey:", machinePubkey.toBase58());

//     // award mint
//     awardOneMintKeypair = anchor.web3.Keypair.generate();
//     print("awardOneMintKeypair: ", awardOneMintKeypair.publicKey.toBase58());
//     awardTwoMintKeypair = anchor.web3.Keypair.generate();
//     print("awardTwoMintKeypair: ", awardTwoMintKeypair.publicKey.toBase58());

//     await spl.createMint(
//       provider.connection,
//       payer,
//       payer.publicKey,
//       null,
//       decimals,
//       awardOneMintKeypair,
//     );
//     await spl.createMint(
//       provider.connection,
//       payer,
//       payer.publicKey,
//       null,
//       decimals,
//       awardTwoMintKeypair,
//     );

//     // program award token account, do not need to initialize
//     const [award1, nonce1] = await anchor.web3.PublicKey.findProgramAddress(
//       [machinePubkey.toBuffer(), Buffer.from([0, 0, 0, 0])],
//       program.programId,
//     );
//     awardOne = award1;
//     print("awardOne:", awardOne.toBase58());

//     const [award2, nonce2] = await anchor.web3.PublicKey.findProgramAddress(
//       [machinePubkey.toBuffer(), Buffer.from([1, 0, 0, 0])],
//       program.programId,
//     );
//     awardTwo = award2;
//     print("awardTwo:", awardTwo.toBase58());

//     // payer token account for award
//     payerAwardOneATA = await spl.createAssociatedTokenAccount(
//       provider.connection,
//       payer,
//       awardOneMintKeypair.publicKey,
//       payer.publicKey,
//     );
//     print("payerAwardOneATA:", payerAwardOneATA.toBase58());

//     // mint 1000 USDC to payerAwardOneATA
//     // will be divieded into 10 times 1000 USDC
//     await spl.mintTo(
//       provider.connection,
//       payer,
//       awardOneMintKeypair.publicKey,
//       payerAwardOneATA,
//       payer.publicKey,
//       1000 * (10 ** decimals),
//     )

//     payerAwardTwoATA = await spl.createAssociatedTokenAccount(
//       provider.connection,
//       payer,
//       awardTwoMintKeypair.publicKey,
//       payer.publicKey,
//     );
//     print("payerAwardTwoATA:", payerAwardTwoATA.toBase58());

//     // mint 400 USDT to payerAwardTwoATA
//     // will be divided into 20 times 20 USDT
//     await spl.mintTo(
//       provider.connection,
//       payer,
//       awardTwoMintKeypair.publicKey,
//       payerAwardTwoATA,
//       payer.publicKey,
//       400 * (10 ** decimals),
//     );

//     // user and user's token account for award
//     userKeypair = anchor.web3.Keypair.generate();
//     print("userKeypair:", userKeypair.publicKey.toBase58());

//     await provider.connection.requestAirdrop(
//       userKeypair.publicKey,
//       anchor.web3.LAMPORTS_PER_SOL * 50,
//     );
//     print("request 50 SOL: ", userKeypair.publicKey.toBase58());

//     userAwardOneATA = await spl.createAssociatedTokenAccount(
//       provider.connection,
//       payer,
//       awardOneMintKeypair.publicKey,
//       userKeypair.publicKey,
//     );
//     print("userAwardOneATA:", userAwardOneATA.toBase58());

//     userAwardTwoATA = await spl.createAssociatedTokenAccount(
//       provider.connection,
//       payer,
//       awardTwoMintKeypair.publicKey,
//       userKeypair.publicKey,
//     );
//     print("userAwardTwoATA:", userAwardTwoATA.toBase58());
//   });

//   it("Is initialized!", async () => {
//     payForMint = spl.NATIVE_MINT;
//     print("mintPubkey:", payForMint.toBase58());
//     // Add your test here.
//     const tx = await program.rpc.initializeTwisterMachine(
//       new anchor.BN(machineId),
//       new anchor.BN(machineNonce),
//       new anchor.BN(randSeed),
//       new anchor.BN(price),
//       new anchor.BN(defaultLimit),
//       new anchor.BN(defaultFragmentId),
//       {
//         accounts: {
//           authority: payer.publicKey,
//           beneficiary: payer.publicKey,
//           mint: payForMint,
//           machine: machinePubkey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         },
//         signers: [payer],
//       },
//     );
//     print("initialize twister machine transaction signature", tx);

//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("nonce: ", machineAccount.nonce);
//     print("status: ", machineAccount.status);
//     print("default_limit: ", parseInt(machineAccount.defaultLimit.toString()));
//     print("rand_seed: ", parseInt(machineAccount.randSeed.toString()));
//     print("price: ", parseInt(machineAccount.price.toString()));
//     print("beneficiary: ", machineAccount.beneficiary.toBase58());
//     print("mint: ", machineAccount.mint.toBase58());
//     print("authority: ", machineAccount.authority.toBase58());
//     print("filling_fragment_id: ", parseInt(machineAccount.fillingFragmentId.toString()));
//     print("activate: ", new Date(parseInt(machineAccount.activateAt.toString())));
//     print("stop_at: ", new Date(parseInt(machineAccount.stopAt.toString())));
//   });

//   it("Add awards", async () => {
//     let award = new Award();
//     award.amount = new anchor.BN(100 * (10 ** decimals));
//     award.quota = new anchor.BN(10);
//     award.rateNumerator = new anchor.BN(10);

//     const tx = await program.rpc.addAward(
//       new anchor.BN(awardOneId),
//       award,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//           award: awardOne,
//           token: payerAwardOneATA,
//           mint: awardOneMintKeypair.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           tokenProgram: spl.TOKEN_PROGRAM_ID,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         },
//         signers: [payer],
//       }
//     );
//     print("add award1 transaction signature", tx);

//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("index: ", parseInt(machineAccount.awards.index.toString()));
//     const award1 = machineAccount.awards.awards[0];
//     print("amount: ", parseInt(award1.amount.toString()));
//     print("quota: ", parseInt(award1.quota.toString()));
//     print("rate_numerator: ", parseInt(award1.rateNumerator.toString()));

//     award.amount = new anchor.BN(20 * (10 ** decimals));
//     award.quota = new anchor.BN(20);
//     award.rateNumerator = new anchor.BN(50);

//     const tx2 = await program.rpc.addAward(
//       new anchor.BN(awardTwoId),
//       award,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//           award: awardTwo,
//           token: payerAwardTwoATA,
//           mint: awardTwoMintKeypair.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           tokenProgram: spl.TOKEN_PROGRAM_ID,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         },
//         signers: [payer],
//       }
//     );
//     print("add award2 transaction signature", tx2);

//     machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("index: ", parseInt(machineAccount.awards.index.toString()));
//     const award2 = machineAccount.awards.awards[1];
//     print("amount: ", parseInt(award2.amount.toString()));
//     print("quota: ", parseInt(award2.quota.toString()));
//     print("rate_numerator: ", parseInt(award2.rateNumerator.toString()));
//   });

//   it("update award one", async () => {
//     const tx = await program.rpc.updateAward(
//       awardOneId,
//       100,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//         },
//         signers: [payer]
//       }
//     );

//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("after first time update");
//     print("awardOne amount: ", parseInt(machineAccount.awards.awards[0].amount.toString()));
//     print("awardOne quota: ", parseInt(machineAccount.awards.awards[0].quota.toString()));
//     print("awardOne rateNumerator: ", parseInt(machineAccount.awards.awards[0].rateNumerator.toString()));

//     const tx2 = await program.rpc.updateAward(
//       awardOneId,
//       10,
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//         },
//         signers: [payer]
//       }
//     );

//     machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("after second time update");
//     print("awardOne amount: ", parseInt(machineAccount.awards.awards[0].amount.toString()));
//     print("awardOne quota: ", parseInt(machineAccount.awards.awards[0].quota.toString()));
//     print("awardOne rateNumerator: ", parseInt(machineAccount.awards.awards[0].rateNumerator.toString()));
//   });

//   it("activated", async () => {
//     const now = new Date().getTime();
//     const deadline = new Date().getTime() + 30 * 1000;
//     const tx = await program.rpc.activatedTwisterMachine(
//       new anchor.BN(now / 1000),
//       new anchor.BN(deadline / 1000),
//       {
//         accounts: {
//           authority: payer.publicKey,
//           machine: machinePubkey,
//           clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//         },
//         signers: [payer],
//       }
//     );
//     print("activate twister machine transaction signature", tx);

//     await sleep(1000);
//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("status: ", machineAccount.status);
//     print("activate_at: ", new Date(parseInt(machineAccount.activateAt.toString())));
//     print("stop_at: ", new Date(parseInt(machineAccount.stopAt.toString())));
//     print("fragment index: ", parseInt(machineAccount.fragments.index.toString()));
//     print("fragment id: ", parseInt(machineAccount.fragments.fragments[0].id.toString()));
//     print("fragment quota: ", parseInt(machineAccount.fragments.fragments[0].quota.toString()));
//     print("fragment limit: ", parseInt(machineAccount.fragments.fragments[0].limit.toString()));
//   });

//   it("create fragment account", async () => {
//     const [general, n1] = await anchor.web3.PublicKey.findProgramAddress(
//       [userKeypair.publicKey.toBuffer(), Buffer.from("general")],
//       program.programId,
//     );
//     userGeneral = general;
//     print("general:", general.toBase58());

//     const tx = await program.rpc.createGeneralAccount(
//       {
//         accounts: {
//           authority: userKeypair.publicKey,
//           user: userKeypair.publicKey,
//           general,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         },
//         signers: [userKeypair],
//       }
//     );
//     print("create general account transaction signature", tx);

//   });

//   it("simple lottery", async () => {
//     let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("beforce awards:");
//     print("  machine randSeed: ", parseInt(machineAccount.randSeed.toString()));
//     for (let i = 0; i < machineAccount.awards.index; i++) {
//       print("  -------sep-------")
//       print("  index: ", i);
//       print("    amount: ", parseInt(machineAccount.awards.awards[i].amount.toString()));
//       print("    quota: ", machineAccount.awards.awards[i].quota);
//       print("    rateNumerator: ", machineAccount.awards.awards[i].rateNumerator);
//     }
//     let awardOneToken = await spl.getAccount(provider.connection, awardOne);
//     let awardTwoToken = await spl.getAccount(provider.connection, awardTwo);
//     let userAwardOneATAToken = await spl.getAccount(provider.connection, userAwardOneATA);
//     let userAwardTwoATAToken = await spl.getAccount(provider.connection, userAwardTwoATA);
//     print("program award one: ", parseInt(awardOneToken.amount.toString()));
//     print("program award two: ", parseInt(awardTwoToken.amount.toString()));
//     print("user award one: ", parseInt(userAwardOneATAToken.amount.toString()));
//     print("user award two: ", parseInt(userAwardTwoATAToken.amount.toString()));
//     let generalData = await program.account.generalAccount.fetch(userGeneral);
//     print("fragments: ", generalData.amount);

//     const tx = await program.rpc.simpleLottery(
//       { paid: {}},
//       {
//         accounts: {
//           authority: userKeypair.publicKey,
//           payable: userKeypair.publicKey,
//           beneficiary: payer.publicKey,
//           machine: machinePubkey,
//           general: userGeneral,
//           systemProgram: anchor.web3.SystemProgram.programId,
//           tokenProgram: spl.TOKEN_PROGRAM_ID,
//           clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
//         },
//         remainingAccounts: [
//           {pubkey: awardOne, isSigner: false, isWritable: true},
//           {pubkey: awardTwo, isSigner: false, isWritable: true},
//           {pubkey: userAwardOneATA, isSigner: false, isWritable: true},
//           {pubkey: userAwardTwoATA, isSigner: false, isWritable: true},
//         ],
//         signers: [userKeypair]
//       }
//     );
//     print("lottery transaction signature", tx);

//     machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
//     print("after awards:");
//     print("  machine randSeed: ", parseInt(machineAccount.randSeed.toString()));
//     for (let i = 0; i < machineAccount.awards.index; i++) {
//       print("  -------sep-------")
//       print("  index: ", i);
//       print("    amount: ", parseInt(machineAccount.awards.awards[i].amount.toString()));
//       print("    quota: ", machineAccount.awards.awards[i].quota);
//       print("    rateNumerator: ", machineAccount.awards.awards[i].rateNumerator);
//     }
//     awardOneToken = await spl.getAccount(provider.connection, awardOne);
//     awardTwoToken = await spl.getAccount(provider.connection, awardTwo);
//     userAwardOneATAToken = await spl.getAccount(provider.connection, userAwardOneATA);
//     userAwardTwoATAToken = await spl.getAccount(provider.connection, userAwardTwoATA);
//     print("program award one: ", parseInt(awardOneToken.amount.toString()));
//     print("program award two: ", parseInt(awardTwoToken.amount.toString()));
//     print("user award one: ", parseInt(userAwardOneATAToken.amount.toString()));
//     print("user award two: ", parseInt(userAwardTwoATAToken.amount.toString()));
//     generalData = await program.account.generalAccount.fetch(userGeneral);
//     print("fragments: ", generalData.amount);
//   });
// });

function Award() {
  this.amount;
  this.quota;
  this.rateNumerator;
}


describe("paid with token - lottery", () => {
  // Configure the client to use the local cluster.

  let payerAwardOneATA: anchor.web3.PublicKey = null;
  let payerAwardTwoATA: anchor.web3.PublicKey = null;
  let machinePubkey:anchor.web3.PublicKey = null;
  let payForMint: anchor.web3.PublicKey = null;
  let userKeypair: anchor.web3.Keypair = null;
  let userAwardOneATA: anchor.web3.PublicKey = null;
  let userAwardTwoATA: anchor.web3.PublicKey = null;
  let userGeneral: anchor.web3.PublicKey = null;
  let userSpecial: anchor.web3.PublicKey = null;
  const awardOneId = 0;
  const awardTwoId = 1;
  // say this is USDC
  let awardOneMintKeypair: anchor.web3.Keypair = null;
  // this is USDT
  let awardTwoMintKeypair: anchor.web3.Keypair = null;
  const decimals = 6;
  let awardOne: anchor.web3.PublicKey = null;
  let awardTwo: anchor.web3.PublicKey = null;

  let machineNonce = 0;
  const machineId = 1;
  const randSeed = 1660;  // award 1
  // const randSeed = 1962;  // award 2
  // const randSeed = 2081;  // fragment 123
  // const randSeed = 1958;  // fragment 456
  const defaultLimit = 10;
  const defaultFragmentId = 0;
  const price = 10 * (10 ** decimals);

  it("generate account", async () => {
    await provider.connection.requestAirdrop(
      payer.publicKey,
      anchor.web3.LAMPORTS_PER_SOL * 100,
    );
    print("request 100 SOL: ", payer.publicKey.toBase58());

    // find machine pubkey
    const [machine, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [payer.publicKey.toBuffer(), Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]), Buffer.from("twister")],
      program.programId,
    );
    machinePubkey = machine;
    machineNonce = nonce;
    print("machinePubkey:", machinePubkey.toBase58());

    // award mint
    awardOneMintKeypair = anchor.web3.Keypair.generate();
    print("awardOneMintKeypair: ", awardOneMintKeypair.publicKey.toBase58());
    awardTwoMintKeypair = anchor.web3.Keypair.generate();
    print("awardTwoMintKeypair: ", awardTwoMintKeypair.publicKey.toBase58());

    await spl.createMint(
      provider.connection,
      payer,
      payer.publicKey,
      null,
      decimals,
      awardOneMintKeypair,
    );
    await spl.createMint(
      provider.connection,
      payer,
      payer.publicKey,
      null,
      decimals,
      awardTwoMintKeypair,
    );

    // program award token account, do not need to initialize
    const [award1, nonce1] = await anchor.web3.PublicKey.findProgramAddress(
      [machinePubkey.toBuffer(), Buffer.from([0, 0, 0, 0])],
      program.programId,
    );
    awardOne = award1;
    print("awardOne:", awardOne.toBase58());

    const [award2, nonce2] = await anchor.web3.PublicKey.findProgramAddress(
      [machinePubkey.toBuffer(), Buffer.from([1, 0, 0, 0])],
      program.programId,
    );
    awardTwo = award2;
    print("awardTwo:", awardTwo.toBase58());

    // payer token account for award
    payerAwardOneATA = await spl.createAssociatedTokenAccount(
      provider.connection,
      payer,
      awardOneMintKeypair.publicKey,
      payer.publicKey,
    );
    print("payerAwardOneATA:", payerAwardOneATA.toBase58());

    // mint 1000 USDC to payerAwardOneATA
    // will be divieded into 10 times 1000 USDC
    await spl.mintTo(
      provider.connection,
      payer,
      awardOneMintKeypair.publicKey,
      payerAwardOneATA,
      payer.publicKey,
      1000 * (10 ** decimals),
    );

    payerAwardTwoATA = await spl.createAssociatedTokenAccount(
      provider.connection,
      payer,
      awardTwoMintKeypair.publicKey,
      payer.publicKey,
    );
    print("payerAwardTwoATA:", payerAwardTwoATA.toBase58());

    // mint 400 USDT to payerAwardTwoATA
    // will be divided into 20 times 20 USDT
    await spl.mintTo(
      provider.connection,
      payer,
      awardTwoMintKeypair.publicKey,
      payerAwardTwoATA,
      payer.publicKey,
      400 * (10 ** decimals),
    );

    // user and user's token account for award
    userKeypair = anchor.web3.Keypair.generate();
    print("userKeypair:", userKeypair.publicKey.toBase58());

    await provider.connection.requestAirdrop(
      userKeypair.publicKey,
      anchor.web3.LAMPORTS_PER_SOL * 10,
    );
    print("request 10 SOL: ", userKeypair.publicKey.toBase58());

    userAwardOneATA = await spl.createAssociatedTokenAccount(
      provider.connection,
      payer,
      awardOneMintKeypair.publicKey,
      userKeypair.publicKey,
    );
    print("userAwardOneATA:", userAwardOneATA.toBase58());

    await spl.mintTo(
      provider.connection,
      payer,
      awardOneMintKeypair.publicKey,
      userAwardOneATA,
      payer.publicKey,
      50 * (10 ** decimals),
    );
    print("mint 50 USDC to userAwardOneATA:", userAwardOneATA.toBase58());

    userAwardTwoATA = await spl.createAssociatedTokenAccount(
      provider.connection,
      payer,
      awardTwoMintKeypair.publicKey,
      userKeypair.publicKey,
    );
    print("userAwardTwoATA:", userAwardTwoATA.toBase58());
  });

  it("Is initialized!", async () => {
    // Add your test here.
    payForMint = awardOneMintKeypair.publicKey;
    print("mintPubkey:", payForMint.toBase58());

    const tx = await program.rpc.initializeTwisterMachine(
      new anchor.BN(machineId),
      new anchor.BN(machineNonce),
      new anchor.BN(randSeed),
      new anchor.BN(price),
      new anchor.BN(defaultLimit),
      new anchor.BN(defaultFragmentId),
      {
        accounts: {
          authority: payer.publicKey,
          beneficiary: payer.publicKey,
          mint: payForMint,
          machine: machinePubkey,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [payer],
      }
    );
    print("initialize twister machine transaction signature", tx);

    let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("nonce: ", machineAccount.nonce);
    print("status: ", machineAccount.status);
    print("rand_seed: ", parseInt(machineAccount.randSeed.toString()));
    print("price: ", parseInt(machineAccount.price.toString()));
    print("beneficiary: ", machineAccount.beneficiary.toBase58());
    print("mint: ", machineAccount.mint.toBase58());
    print("authority: ", machineAccount.authority.toBase58());
    print("filling_fragment_id: ", parseInt(machineAccount.fillingFragmentId.toString()));
    print("activate: ", new Date(parseInt(machineAccount.activateAt.toString()) * 1000));
    print("stop_at: ", new Date(parseInt(machineAccount.stopAt.toString()) * 1000));
  });

  it("Add awards", async () => {
    let award = new Award();
    award.amount = new anchor.BN(100 * (10 ** decimals));
    award.quota = new anchor.BN(10);
    award.rateNumerator = new anchor.BN(10);

    const tx = await program.rpc.addAward(
      new anchor.BN(awardOneId),
      award,
      {
        accounts: {
          authority: payer.publicKey,
          machine: machinePubkey,
          award: awardOne,
          token: payerAwardOneATA,
          mint: awardOneMintKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [payer],
      }
    );
    print("add award1 transaction signature", tx);

    let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("index: ", parseInt(machineAccount.awards.index.toString()));
    const award1 = machineAccount.awards.awards[0];
    print("amount: ", parseInt(award1.amount.toString()));
    print("quota: ", parseInt(award1.quota.toString()));
    print("rate_numerator: ", parseInt(award1.rateNumerator.toString()));

    award.amount = new anchor.BN(20 * (10 ** decimals));
    award.quota = new anchor.BN(20);
    award.rateNumerator = new anchor.BN(50);

    const tx2 = await program.rpc.addAward(
      new anchor.BN(awardTwoId),
      award,
      {
        accounts: {
          authority: payer.publicKey,
          machine: machinePubkey,
          award: awardTwo,
          token: payerAwardTwoATA,
          mint: awardTwoMintKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [payer],
      }
    );
    print("add award2 transaction signature", tx2);

    machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("index: ", parseInt(machineAccount.awards.index.toString()));
    const award2 = machineAccount.awards.awards[1];
    print("amount: ", parseInt(award2.amount.toString()));
    print("quota: ", parseInt(award2.quota.toString()));
    print("rate_numerator: ", parseInt(award2.rateNumerator.toString()));
  });

  it("withdraw award two", async () => {
    let awardTwoAccount = await spl.getAccount(provider.connection, awardTwo);
    let payerAwardTwoAccount = await spl.getAccount(provider.connection, payerAwardTwoATA);
    print(`award: ${awardTwoAccount.amount.toString()}, payer: ${payerAwardTwoAccount.amount.toString()}`);
    const tx = await program.rpc.withdraw(
      awardTwoId,
      {
        accounts: {
          authority: payer.publicKey,
          machine: machinePubkey,
          award: awardTwo,
          token: payerAwardTwoATA,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        },
        signers: [payer],
      }
    );

    awardTwoAccount = await spl.getAccount(provider.connection, awardTwo);
    payerAwardTwoAccount = await spl.getAccount(provider.connection, payerAwardTwoATA);
    print(`award: ${awardTwoAccount.amount.toString()}, payer: ${payerAwardTwoAccount.amount.toString()}`);
  });

  it("add fragment", async() => {
    let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("before fragment: ");
    for (let i = 0; i < machineAccount.fragments.index; i++) {
      print("  ---------sep---------");
      print("  index: ", i);
      print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
      print("    quota: ", parseInt(machineAccount.fragments.fragments[i].quota.toString()));
      print("    limit: ", parseInt(machineAccount.fragments.fragments[i].limit.toString()));
      print("    rateNumerator", parseInt(machineAccount.fragments.fragments[i].rateNumerator.toString()));
    }
    let fragment = new Fragment();
    fragment.id = new anchor.BN(123);
    fragment.quota = new anchor.BN(100);
    fragment.limit = new anchor.BN(5);
    fragment.rateNumerator = new anchor.BN(1000);

    const tx = await program.rpc.addFragment(
      fragment,
      {
        accounts: {
          authority: payer.publicKey,
          machine: machinePubkey,
        },
        signers: [payer],
      }
    );
    print("add fragment transaction signature", tx);

    machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("after fragment: ");
    for (let i = 0; i < machineAccount.fragments.index; i++) {
      print("  ---------sep---------");
      print("  index: ", i);
      print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
      print("    quota: ", parseInt(machineAccount.fragments.fragments[i].quota.toString()));
      print("    limit: ", parseInt(machineAccount.fragments.fragments[i].limit.toString()));
      print("    rateNumerator", parseInt(machineAccount.fragments.fragments[i].rateNumerator.toString()));
    }
  });

  it("update award one", async () => {
    const tx = await program.rpc.updateAward(
      awardOneId,
      100,
      {
        accounts: {
          authority: payer.publicKey,
          machine: machinePubkey,
        },
        signers: [payer]
      }
    );

    let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("after first time update");
    print("awardOne amount: ", parseInt(machineAccount.awards.awards[0].amount.toString()));
    print("awardOne quota: ", parseInt(machineAccount.awards.awards[0].quota.toString()));
    print("awardOne rateNumerator: ", parseInt(machineAccount.awards.awards[0].rateNumerator.toString()));

    const tx2 = await program.rpc.updateAward(
      awardOneId,
      10,
      {
        accounts: {
          authority: payer.publicKey,
          machine: machinePubkey,
        },
        signers: [payer]
      }
    );

    machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("after second time update");
    print("awardOne amount: ", parseInt(machineAccount.awards.awards[0].amount.toString()));
    print("awardOne quota: ", parseInt(machineAccount.awards.awards[0].quota.toString()));
    print("awardOne rateNumerator: ", parseInt(machineAccount.awards.awards[0].rateNumerator.toString()));
  });

  it("activated", async () => {
    const now = new Date().getTime();
    const deadline = new Date().getTime() + 10 * 1000;
    const tx = await program.rpc.activatedTwisterMachine(
      new anchor.BN(now / 1000),
      new anchor.BN(deadline / 1000),
      {
        accounts: {
          authority: payer.publicKey,
          machine: machinePubkey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        },
        signers: [payer],
      }
    );
    print("activate twister machine transaction signature", tx);
    
    let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("status: ", machineAccount.status);
    print("activate_at: ", new Date(parseInt(machineAccount.activateAt.toString()) * 1000));
    print("stop_at: ", new Date(parseInt(machineAccount.stopAt.toString()) * 1000));
    print("fragment index: ", parseInt(machineAccount.fragments.index.toString()));
    print("fragment id: ", parseInt(machineAccount.fragments.fragments[0].id.toString()));
    print("fragment quota: ", parseInt(machineAccount.fragments.fragments[0].quota.toString()));
    print("fragment limit: ", parseInt(machineAccount.fragments.fragments[0].limit.toString()));
    print("fragment rate_numerator: ", parseInt(machineAccount.fragments.fragments[0].rateNumerator.toString()));
  });

  it("create fragment account", async () => {
    const [general, n1] = await anchor.web3.PublicKey.findProgramAddress(
      [userKeypair.publicKey.toBuffer(), Buffer.from("general")],
      program.programId,
    );
    userGeneral = general;
    print("general:", general.toBase58());
    const [special, n2] = await anchor.web3.PublicKey.findProgramAddress(
      [machinePubkey.toBuffer(), userKeypair.publicKey.toBuffer(), Buffer.from("special")],
      program.programId,
    );
    userSpecial = special;
    print("special:", special.toBase58());

    const tx = await program.rpc.createGeneralAccount(
      {
        accounts: {
          authority: userKeypair.publicKey,
          user: userKeypair.publicKey,
          general,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [userKeypair],
      }
    );
    print("create general account transaction signature", tx);

    const tx2 = await program.rpc.createSpecialAccount(
      {
        accounts: {
          authority: userKeypair.publicKey,
          machine: machinePubkey,
          user: userKeypair.publicKey,
          special,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [userKeypair],
      }
    );
    print("create special account transaction signature", tx2);
  });

  it("lottery with paid", async () => {
    let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("beforce awards:");
    print("  machine randSeed: ", parseInt(machineAccount.randSeed.toString()));
    for (let i = 0; i < machineAccount.awards.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    amount: ", parseInt(machineAccount.awards.awards[i].amount.toString()));
      print("    quota: ", machineAccount.awards.awards[i].quota);
      print("    rateNumerator: ", machineAccount.awards.awards[i].rateNumerator);
    }
    print("beforce fragments:");
    for (let i = 0; i < machineAccount.fragments.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
      print("    quota: ", machineAccount.fragments.fragments[i].quota);
      print("    limit: ", machineAccount.fragments.fragments[i].limit);
    }
    let awardOneToken = await spl.getAccount(provider.connection, awardOne);
    let awardTwoToken = await spl.getAccount(provider.connection, awardTwo);
    let userAwardOneATAToken = await spl.getAccount(provider.connection, userAwardOneATA);
    let userAwardTwoATAToken = await spl.getAccount(provider.connection, userAwardTwoATA);
    let payerAwardOneATAToken = await spl.getAccount(provider.connection, payerAwardOneATA);
    let payerAwardTwoATAToken = await spl.getAccount(provider.connection, payerAwardTwoATA);
    print("program award one: ", parseInt(awardOneToken.amount.toString()));
    print("program award two: ", parseInt(awardTwoToken.amount.toString()));
    print("user award one: ", parseInt(userAwardOneATAToken.amount.toString()));
    print("user award two: ", parseInt(userAwardTwoATAToken.amount.toString()));
    print("payer award one: ", parseInt(payerAwardOneATAToken.amount.toString()));
    print("payer award two: ", parseInt(payerAwardTwoATAToken.amount.toString()));
    let generalAccount = await program.account.generalAccount.fetch(userGeneral);
    print("user fragment quota: ", parseInt(generalAccount.amount.toString()));

    const tx = await program.rpc.lottery(
      { paid: {}},
      {
        accounts: {
          authority: userKeypair.publicKey,
          payable: userAwardOneATA,
          beneficiary: payerAwardOneATA,
          machine: machinePubkey,
          general: userGeneral,
          special: userSpecial,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        },
        remainingAccounts: [
          {pubkey: awardOne, isSigner: false, isWritable: true},
          {pubkey: awardTwo, isSigner: false, isWritable: true},
          {pubkey: userAwardOneATA, isSigner: false, isWritable: true},
          {pubkey: userAwardTwoATA, isSigner: false, isWritable: true},
        ],
        signers: [userKeypair]
      }
    );
    print("lottery transaction signature", tx);

    machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("after awards:");
    print("  machine randSeed: ", parseInt(machineAccount.randSeed.toString()));
    for (let i = 0; i < machineAccount.awards.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    amount: ", parseInt(machineAccount.awards.awards[i].amount.toString()));
      print("    quota: ", machineAccount.awards.awards[i].quota);
      print("    rateNumerator: ", machineAccount.awards.awards[i].rateNumerator);
    }
    print("after fragments:");
    for (let i = 0; i < machineAccount.fragments.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
      print("    quota: ", machineAccount.fragments.fragments[i].quota);
      print("    limit: ", machineAccount.fragments.fragments[i].limit);
    }
    awardOneToken = await spl.getAccount(provider.connection, awardOne);
    awardTwoToken = await spl.getAccount(provider.connection, awardTwo);
    userAwardOneATAToken = await spl.getAccount(provider.connection, userAwardOneATA);
    userAwardTwoATAToken = await spl.getAccount(provider.connection, userAwardTwoATA);
    payerAwardOneATAToken = await spl.getAccount(provider.connection, payerAwardOneATA);
    payerAwardTwoATAToken = await spl.getAccount(provider.connection, payerAwardTwoATA);
    print("program award one: ", parseInt(awardOneToken.amount.toString()));
    print("program award two: ", parseInt(awardTwoToken.amount.toString()));
    print("user award one: ", parseInt(userAwardOneATAToken.amount.toString()));
    print("user award two: ", parseInt(userAwardTwoATAToken.amount.toString()));
    print("payer award one: ", parseInt(payerAwardOneATAToken.amount.toString()));
    print("payer award two: ", parseInt(payerAwardTwoATAToken.amount.toString()));
    generalAccount = await program.account.generalAccount.fetch(userGeneral);
    print("user fragment quota: ", parseInt(generalAccount.amount.toString()));
  });

  it("airdrop fragment", async () => {
    let generalData = await program.account.generalAccount.fetch(userGeneral);
    print("before airdrop: ");
    print("  amount: ", parseInt(generalData.amount.toString()));

    const tx = await program.rpc.airdropFragment(
      10,
      {
        accounts: {
          authority: payer.publicKey,
          general: userGeneral,
          user: userKeypair.publicKey,
        },
        signers: [payer]
      }
    );
    print("airdrop transaction signature", tx);

    generalData = await program.account.generalAccount.fetch(userGeneral);
    print("after airdrop: ");
    print("  amount: ", parseInt(generalData.amount.toString()));

    let specialData = await program.account.specialAccount.fetch(userSpecial);
    print("before airdrop: ");
    for (let i = 0; i < specialData.fragments.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    id: ", parseInt(specialData.fragments.fragments[i].id.toString()));
      print("    quota: ", specialData.fragments.fragments[i].quota);
    }

    const tx2 = await program.rpc.airdropSpecialFragment(
      new anchor.BN(123),
      new anchor.BN(5),
      {
        accounts: {
          authority: payer.publicKey,
          machine: machinePubkey,
          special: userSpecial,
          user: userKeypair.publicKey,
        },
        signers: [payer]
      }
    );
    print("airdrop transaction signature", tx2);

    specialData = await program.account.specialAccount.fetch(userSpecial);
    print("after airdrop: ");
    for (let i = 0; i < specialData.fragments.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    id: ", parseInt(specialData.fragments.fragments[i].id.toString()));
      print("    quota: ", specialData.fragments.fragments[i].quota);
    }
  });

  it("lottery with fragment", async () => {
    let machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("beforce awards:");
    print("  machine randSeed: ", parseInt(machineAccount.randSeed.toString()));
    for (let i = 0; i < machineAccount.awards.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    amount: ", parseInt(machineAccount.awards.awards[i].amount.toString()));
      print("    quota: ", machineAccount.awards.awards[i].quota);
      print("    rateNumerator: ", machineAccount.awards.awards[i].rateNumerator);
    }
    print("beforce fragments:");
    for (let i = 0; i < machineAccount.fragments.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
      print("    quota: ", parseInt(machineAccount.fragments.fragments[i].quota.toString()));
      print("    limit: ", parseInt(machineAccount.fragments.fragments[i].limit));
      print("    rate_numerator: ", parseInt(machineAccount.fragments.fragments[i].rateNumerator.toString()));
    }
    let awardOneToken = await spl.getAccount(provider.connection, awardOne);
    let awardTwoToken = await spl.getAccount(provider.connection, awardTwo);
    let userAwardOneATAToken = await spl.getAccount(provider.connection, userAwardOneATA);
    let userAwardTwoATAToken = await spl.getAccount(provider.connection, userAwardTwoATA);
    let payerAwardOneATAToken = await spl.getAccount(provider.connection, payerAwardOneATA);
    let payerAwardTwoATAToken = await spl.getAccount(provider.connection, payerAwardTwoATA);
    print("program award one: ", parseInt(awardOneToken.amount.toString()));
    print("program award two: ", parseInt(awardTwoToken.amount.toString()));
    print("user award one: ", parseInt(userAwardOneATAToken.amount.toString()));
    print("user award two: ", parseInt(userAwardTwoATAToken.amount.toString()));
    print("payer award one: ", parseInt(payerAwardOneATAToken.amount.toString()));
    print("payer award two: ", parseInt(payerAwardTwoATAToken.amount.toString()));
    let generalAccount = await program.account.generalAccount.fetch(userGeneral);
    print("user fragment quota: ", parseInt(generalAccount.amount.toString()));
    let specialAccount = await program.account.specialAccount.fetch(userSpecial);
    print("user special fragment quota: ");
    for (let i = 0; i < specialAccount.fragments.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    id: ", parseInt(specialAccount.fragments.fragments[i].id.toString()));
      print("    quota: ", parseInt(specialAccount.fragments.fragments[i].quota.toString()));
    }

    const tx = await program.rpc.lottery(
      { fragment: { id: new anchor.BN(0) }},
      {
        accounts: {
          authority: userKeypair.publicKey,
          payable: userAwardOneATA,
          beneficiary: payerAwardOneATA,
          machine: machinePubkey,
          general: userGeneral,
          special: userSpecial,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        },
        remainingAccounts: [
          {pubkey: awardOne, isSigner: false, isWritable: true},
          {pubkey: awardTwo, isSigner: false, isWritable: true},
          {pubkey: userAwardOneATA, isSigner: false, isWritable: true},
          {pubkey: userAwardTwoATA, isSigner: false, isWritable: true},
        ],
        signers: [userKeypair]
      }
    );
    print("lottery transaction signature", tx);

    machineAccount = await program.account.twisterMachine.fetch(machinePubkey);
    print("after awards:");
    print("  machine randSeed: ", parseInt(machineAccount.randSeed.toString()));
    for (let i = 0; i < machineAccount.awards.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    amount: ", parseInt(machineAccount.awards.awards[i].amount.toString()));
      print("    quota: ", machineAccount.awards.awards[i].quota);
      print("    rateNumerator: ", machineAccount.awards.awards[i].rateNumerator);
    }
    print("after fragments:");
    for (let i = 0; i < machineAccount.fragments.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    id: ", parseInt(machineAccount.fragments.fragments[i].id.toString()));
      print("    quota: ", parseInt(machineAccount.fragments.fragments[i].quota.toString()));
      print("    limit: ", parseInt(machineAccount.fragments.fragments[i].limit));
      print("    rate_numerator: ", parseInt(machineAccount.fragments.fragments[i].rateNumerator.toString()));
    }
    awardOneToken = await spl.getAccount(provider.connection, awardOne);
    awardTwoToken = await spl.getAccount(provider.connection, awardTwo);
    userAwardOneATAToken = await spl.getAccount(provider.connection, userAwardOneATA);
    userAwardTwoATAToken = await spl.getAccount(provider.connection, userAwardTwoATA);
    payerAwardOneATAToken = await spl.getAccount(provider.connection, payerAwardOneATA);
    payerAwardTwoATAToken = await spl.getAccount(provider.connection, payerAwardTwoATA);
    print("program award one: ", parseInt(awardOneToken.amount.toString()));
    print("program award two: ", parseInt(awardTwoToken.amount.toString()));
    print("user award one: ", parseInt(userAwardOneATAToken.amount.toString()));
    print("user award two: ", parseInt(userAwardTwoATAToken.amount.toString()));
    print("payer award one: ", parseInt(payerAwardOneATAToken.amount.toString()));
    print("payer award two: ", parseInt(payerAwardTwoATAToken.amount.toString()));
    generalAccount = await program.account.generalAccount.fetch(userGeneral);
    print("user fragment quota: ", parseInt(generalAccount.amount.toString()));
    specialAccount = await program.account.specialAccount.fetch(userSpecial);
    print("user special fragment quota: ");
    for (let i = 0; i < specialAccount.fragments.index; i++) {
      print("  -------sep-------")
      print("  index: ", i);
      print("    id: ", parseInt(specialAccount.fragments.fragments[i].id.toString()));
      print("    quota: ", specialAccount.fragments.fragments[i].quota);
    }
  });
});


function sleep(ms: number) {
  print("sleeping for ", ms / 1000, " seconds");
  return new Promise(resolve => setTimeout(resolve, ms));
}