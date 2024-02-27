const axios = require("axios");
const fs = require("fs");
const puppeteer = require('puppeteer');
const { Storage } = require('@google-cloud/storage');
//const fetch = require('node-fetch');


const GOOGLE_CLOUD_PROJECT_ID = "linegemini-4523d";
const BUCKET_NAME = "gs://linegemini-4523d.appspot.com";


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

    return [originalImage.data, imgUrl];
}

const getStockImageUrl = async (stockname) => {
    let data = JSON.stringify({
        "format": "png",
        "full_page": true,
        "url": "https://th.tradingview.com/chart/?symbol=SET%3A" + stockname,
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

    const renderUrl = await axios.request(config)
        .then((response) => response.data.renderUrl)
        .catch((error) => {
            console.log(error);
        });
    return renderUrl;
}





//---------------------------------------------------------


const getStockImageBinaryV2 = async (stockname) => {
    console.log("stockname === > " + stockname);
    const imgBuffer = await scrnShot(stockname);
    const imgUrl = await urlImage(imgBuffer, new Date().toString() + "--" + stockname);
    console.log("imgUrl === > " + imgUrl);
    const originalImage = await axios({
        method: 'get',
        maxBodyLength: Infinity,
        url: imgUrl,
        headers: {},
        responseType: "arraybuffer"
    })

    return [originalImage.data, imgUrl];
}


const scrnShot = async (stockname) => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto("https://th.tradingview.com/chart/?symbol=SET%3A" + stockname, { waitUntil: 'networkidle2' });

    const buffer = await page.screenshot();

    await page.close();
    await browser.close();

    return buffer;
}

const urlImage = async (buffer, filename) => {
    const storage = new Storage({
        projectId: GOOGLE_CLOUD_PROJECT_ID,
    });

    const bucket = storage.bucket(BUCKET_NAME);

    const file = bucket.file(filename);
    await uploadBufferImage(file, buffer, filename);

    await file.makePublic();

    const urlImg = `https://${BUCKET_NAME}.storage.googleapis.com/${filename}`;

    console.log("urlImg === >" + urlImg);

    return urlImg;
}

const uploadBufferImage = async (file, buffer, filename) => {
    return new Promise((resolve) => {
        file.save(buffer, { destination: filename }, () => {
            resolve();
        });
    })
}



module.exports = { getStockImageBinary,getStockImageBinaryV2 };