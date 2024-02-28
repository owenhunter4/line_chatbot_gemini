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
    const imgBuffer = await scrnShot(stockname, "graph");
    const imgBufferNews = await scrnShot(stockname, "news");
    const imgBufferNews2 = await scrnShot(stockname, "news2");
    const dName = new Date().getTime();
    const imgUrl = await urlImage(imgBuffer, dName + "/graph--" + stockname);
    const imgUrlNews = await urlImage(imgBufferNews, dName + "/news--" + stockname);
    const imgUrlNews2 = await urlImage(imgBufferNews2, dName + "/news2--" + stockname);
    console.log("imgUrl === > " + imgUrl);
    console.log("imgUrlNews === > " + imgUrlNews);
    console.log("imgUrlNews2 === > " + imgUrlNews2);
    // const originalImage = await axios({
    //     method: 'get',
    //     maxBodyLength: Infinity,
    //     url: imgUrl,
    //     headers: {},
    //     responseType: "arraybuffer"
    // })

    //return [originalImage.data, imgUrl];
    return [imgBuffer, imgUrl, imgUrlNews, imgUrlNews2];
}


const scrnShot = async (stockname, content) => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    // await page.setViewport({
    //     width: 1920,
    //     height: 1080,
    //     deviceScaleFactor: 1,
    // });
    switch (content) {
        case "graph":
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });
            await page.goto("https://th.tradingview.com/chart/?symbol=SET%3A" + stockname, { waitUntil: 'networkidle2' });
            break;
        case "news":
            await page.setViewport({
                width: 1024,
                height: 1100,
                deviceScaleFactor: 1,
            });
            await page.goto("https://www.infoquest.co.th/?s=" + stockname, { waitUntil: 'networkidle2' });
            break;
        case "news2":
            await page.setViewport({
                width: 1440,
                height: 1500,
                deviceScaleFactor: 1,
            });
            await page.goto("https://www.kaohoon.com/?s=" + stockname, { waitUntil: 'networkidle2' });
            break;

        default:
            await page.goto("https://www.google.com/search?q=" + stockname, { waitUntil: 'networkidle2' });
            break;


    }

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

    const urlImg = await uploadBufferImage(file, buffer, filename);;

    console.log("urlImg === >" + urlImg);

    return urlImg;
}

const uploadBufferImage = async (file, buffer, filename) => {
    return new Promise((resolve) => {
        const gTime = new Date().getTime();
        const cache_file_options = {
            metadata: {
                destination: filename,
                contentType: "image/jpeg",
                resumable: false,
                cacheControl: 'no-cache',
                metadata: {
                    firebaseStorageDownloadTokens: gTime,
                }
            }
        };
        file.save(buffer, cache_file_options, () => {
            const downLoadPath =
                "https://firebasestorage.googleapis.com/v0/b/linegemini-4523d.appspot.com/o/";

            const imageUrl =
                downLoadPath +
                encodeURIComponent(filename) +
                "?alt=media&token=" +
                gTime;
            resolve(imageUrl);
        });
    })
}



module.exports = { getStockImageBinary, getStockImageBinaryV2 };