import axios from "axios";

exports.handler = async (event) => {
  console.log("event: " + JSON.stringify(event));

  const getDLImgResp = await axios.get(
    event.dlImageSrcURL,
    {
      responseType: "arraybuffer",
    }
  );

  const getCarImgResp = await axios.get(
    event.carImageSrcURL,
    {
      responseType: "arraybuffer",
    }
  );

  await axios.put(event.driversLicenseImageUrl, getDLImgResp.data);
  await axios.put(event.carImageUrl, getCarImgResp.data);
  
  // const resp = {uploadDLResp: uploadDLResp.statusText, uploadCarResp: uploadCarResp.statusText }
  
  // return {cognitoIdentityId: event.cognitoIdentityId};
  
};
