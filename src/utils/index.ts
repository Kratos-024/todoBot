const axios = require("axios");
const fs = require("fs");

const url =
  "https://archive.org/download/whitenights0000dost/whitenights0000dost.pdf";

axios
  .get(url, { responseType: "stream" })
  //@ts-ignore
  .then((response) => {
    const writer = fs.createWriteStream("White_Nights.pdf");
    response.data.pipe(writer);
    writer.on("finish", () => {
      console.log("Download complete!");
    });
  })
  //@ts-ignore
  .catch((error) => {
    console.error("Error downloading the file:", error);
  });
