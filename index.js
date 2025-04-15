const Arweave = require("arweave");
const fs = require("fs").promises;

// Initialize Arweave client for local testing
const arweave = Arweave.init({
  host: "localhost",
  port: 1984,
  protocol: "http",
});

// Path to the file to upload (e.g., an image)
const filePath = "./file1.png"; 

async function storeFile() {
  try {
    // Generate a test wallet
    const wallet = await arweave.wallets.generate();

    // Fund the wallet with test AR (only needed for some setups, arlocal often skips this)
    await fetch(
      "http://localhost:1984/mint/" +
        (await arweave.wallets.jwkToAddress(wallet)) +
        "/1000000000000"
    );

    // Read file to upload
    const data = await fs.readFile(filePath);

    // Create transaction
    const transaction = await arweave.createTransaction({ data }, wallet);

    // Add content type tag (e.g., for an image)
    transaction.addTag("Content-Type", "image/jpeg"); // Adjust based on file type

    // Sign transaction
    await arweave.transactions.sign(transaction, wallet);

    // Submit transaction
    const response = await arweave.transactions.post(transaction);
    if (response.status === 200) {
      console.log(
        `File uploaded successfully! Transaction ID: ${transaction.id}`
      );
      console.log(`Local URL: http://localhost:1984/${transaction.id}`);
    } else {
      console.error("Upload failed:", response.statusText);
    }

    return transaction.id;
  } catch (error) {
    console.error("Error storing file:", error);
  }
}

async function retrieveFile(txId) {
  try {
    // Fetch transaction data
    const data = await arweave.transactions.getData(txId, { decode: true });
    console.log("Retrieved file size:", data.length, "bytes");

    // Save the retrieved file
    await fs.writeFile("./retrieved_file.jpg", Buffer.from(data));
    console.log("File saved as retrieved_file.jpg");
  } catch (error) {
    console.error("Error retrieving file:", error);
  }
}

async function main() {
  // Store the file
  const txId = await storeFile();

  // Retrieve the file (no delay needed for arlocal, as it's instant)
  if (txId) {
    await retrieveFile(txId);
  }
}

main();
