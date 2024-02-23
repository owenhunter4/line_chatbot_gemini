const axios = require("axios");
const fs = require("fs");
//const fetch = require('node-fetch');


const getStockImageBinary = async (stockname) => {
    console.log("stockname === > " + stockname);
    const imgUrl = await getStockImageUrl(stockname);
    console.log("imgUrl === > " + imgUrl);
    const originalImage = await axios({
        method: 'get',
        maxBodyLength: Infinity,
        url: imgUrl,
        headers: {},
        responseType: "arraybuffer"
    })

    return [originalImage.data,imgUrl];
}

const getStockImageUrl = async (stockname) => {
    let data = JSON.stringify({
        "format": "png",
        "full_page": true,
        "url": "https://th.tradingview.com/chart/?symbol=SET%3A"+stockname, 
        "wait_until": "requestsfinished",
        "auto_crop": true
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.urlbox.io/v1/render/sync',
        headers: {
            'Authorization': 'Bearer 55b9ae3927084440a7e61706660736ee',
            'Content-Type': 'application/json'
        },
        data: data
    };

    const renderUrl  = await axios.request(config)
        .then((response) => response.data.renderUrl)
        .catch((error) => {
            console.log(error);
        });
        return renderUrl;
}



module.exports = { getStockImageBinary };