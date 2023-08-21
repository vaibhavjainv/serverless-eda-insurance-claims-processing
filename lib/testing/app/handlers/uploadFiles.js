import * as axios from "axios";


exports.handler = async (event) => {
   
   console.log("event: " + JSON.stringify(event));

   //download https://github.com/aws-samples/serverless-eda-insurance-claims-processing/blob/main/react-claims/src/DL/dl_MA.jpg using axios
   const image = await axios.get("https://github.com/aws-samples/serverless-eda-insurance-claims-processing/blob/main/react-claims/src/DL/dl_MA.jpg", {
      responseType: "stream",
   })

   console.log("image: " + (image));

  }

