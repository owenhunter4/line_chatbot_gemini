const axios = require("axios");
const fs = require("fs");


const getStockImageBinary = async (stockname) => {
    const url = "http://siamchart.com/stock-chart/"+stockname+"/"
    const originalImage = await axios({
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.urlbox.io/v1/HhunEdJ7nqtUjVnn/png?full_page=true&url=${encodeURIComponent(url)}&wait_until=requestsfinished`,
        headers: {},
        responseType: "arraybuffer"
      })
      return originalImage.data;
}



module.exports = { getStockImageBinary};