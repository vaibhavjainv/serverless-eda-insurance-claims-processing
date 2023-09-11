import axios from "axios";

exports.handler = async (event) => {
  console.log("event: " + JSON.stringify(event));

  const getDLImgResp = await axios.get(
    event.dlImageSrcURL,
    {
      responseType: "arraybuffer",
    }
  );

  console.log("DL Image Response: " + getDLImgResp.data);
  console.log("event.dlImageSrcURL: " + event.dlImageSrcURL);


  const getCarImgResp = await axios.get(
    event.carImageSrcURL,
    {
      responseType: "arraybuffer",
    }
  );

  console.log("Car Image Response: " + getCarImgResp.data);
  console.log("event.carImageSrcURL: " + event.carImageSrcURL);

  const uploadDLResp = await axios.put(event.driversLicenseImageUrl, getDLImgResp.data);
  const uploadCarResp = await axios.put(event.carImageUrl, getCarImgResp.data);
  
  const resp = {uploadDLResp: uploadDLResp.statusText, uploadCarResp: uploadCarResp.statusText }
  
  return resp;
  
};
