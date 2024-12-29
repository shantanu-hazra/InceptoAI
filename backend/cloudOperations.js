require('dotenv').config();
const {Upload}=require("./cloudConfig.js");
const fs=require("fs").promises;

async function handleUpload(filepath) {
  try {
    const filedata = await fs.readFile(filepath); // Read the file asynchronously
    const filename = Date.now();
    const pathname = `inceptoResults/${filename}.json`;

    const downloadUrl = await Upload(filedata, pathname)
      .then(downloadUrl => {
        return { url: downloadUrl };
      })
      .catch(error => {
        console.error("Upload Error:", error);
        return { error: error };
      });

    return downloadUrl;
  } catch (err) {
    console.error("File Read Error:", err);
    return { error: err };
  }
}

module.exports={handleUpload};