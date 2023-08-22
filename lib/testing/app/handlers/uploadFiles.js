import axios from "axios";

exports.handler = async (event) => {
  console.log("event: " + JSON.stringify(event));

  const getImgResp = await axios.get(
    "https://github.com/aws-samples/serverless-eda-insurance-claims-processing/blob/main/react-claims/src/DL/dl_MA.jpg?raw=true",
    {
      responseType: "arraybuffer",
    }
  );

  const uploadResp = await axios.put(event.driversLicenseImageUrl, getImgResp.data);
  console.log("uploadResp: ", uploadResp.data);
};
