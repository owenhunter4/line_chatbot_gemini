const { onRequest } = require("firebase-functions/v2/https");
const line = require("./utils/line");
const gemini = require("./utils/gemini");
const stock = require("./stock");
const dataconnect = require("./utils/dataconnect");

exports.webhook = onRequest({ memory: "4GiB", timeoutSeconds: 540, },async (req, res) => {
  if (req.method === "POST") {
    const events = req.body.events;
    for (const event of events) {
      console.log("event.source.userId ==> " + event.source.userId);
      if (event.type === 'follow' || event.type === 'unfollow') {
        await dataconnect.memberAdd(event);
      }
      switch (event.type) {
        case "message":

          if (event.message.type === "text") {
            // const msg = await gemini.textOnly(event.message.text);
            if (event.message.text.indexOf("#") >= 0) {
              const stockname = event.message.text.replace("#", "");
              const [imageBinary, imgUrl, imgUrlNews, imgUrlNews2] = await stock.getStockImageBinaryV2(stockname);
              const msg = await gemini.multimodal(imageBinary, "อธิบายกราฟของหุ้นตัวนี้ ตามเทคนิค ให้หน่อย และบอกข้อมูลของ Volumn, RSI, MACD");
              await line.reply(event.replyToken, [

                {
                  "type": "flex",
                  "altText": "Monthly Report",
                  "contents": {
                    "type": "bubble",
                    "size": "giga",
                    "hero": {
                      "type": "image",
                      "url": imgUrl,
                      "size": "full",
                      "aspectRatio": "20:13",
                      "aspectMode": "fit",
                      "action": {
                        "type": "uri",
                        "uri": imgUrl
                      }
                    }
                  }
                },
                { type: "text", text: msg },

                {
                  "type": "flex",
                  "altText": "Monthly Report",
                  "contents": {
                    "type": "bubble",
                    "size": "giga",
                    "hero": {
                      "type": "image",
                      "url": imgUrlNews2,
                      "size": "full",
                      "aspectRatio": "20:13",
                      "aspectMode": "fit",
                      "action": {
                        "type": "uri",
                        "uri": imgUrlNews2
                      }
                    }
                  }
                },
                {
                  "type": "flex",
                  "altText": "Monthly Report",
                  "contents": {
                    "type": "bubble",
                    "size": "giga",
                    "hero": {
                      "type": "image",
                      "url": imgUrlNews,
                      "size": "full",
                      "aspectRatio": "20:13",
                      "aspectMode": "fit",
                      "action": {
                        "type": "uri",
                        "uri": imgUrlNews
                      }
                    }
                  }
                }]);

              const dataHist = {
                userId: event.source.userId,
                stockname: stockname,
                imgUrlGraph: imgUrl,
                imgUrlNews: imgUrlNews,
                imgUrlNews2: imgUrlNews2,
                time: new Date()
              };
              await dataconnect.addHistory(dataHist);
            }
            else if (event.message.text.indexOf(">") >= 0) {
              const stockname = event.message.text.replace(">", "");
              const [imageBinary, imgUrl, imgUrlNews, imgUrlNews2] = await stock.getStockImageBinaryV2(stockname);
              const msg = await gemini.multimodal(imageBinary, "อธิบายกราฟของหุ้นตัวนี้ ตามเทคนิค ให้หน่อย");
              const memb = await dataconnect.memberGetActive();
              if (memb.length > 0) {
                await line.multicast(memb, [
                  { type: "text", text: stockname },
                  {
                    type: "image",
                    originalContentUrl: imgUrl,
                    previewImageUrl: imgUrl
                  },
                  { type: "text", text: msg },
                  {
                    type: "image",
                    originalContentUrl: imgUrlNews2,
                    previewImageUrl: imgUrlNews2
                  },
                  {
                    type: "image",
                    originalContentUrl: imgUrlNews,
                    previewImageUrl: imgUrlNews
                  }]);
              }
            }
            else {
              const msg = await gemini.chat(event.message.text);
              await line.reply(event.replyToken, [{ type: "text", text: msg }]);
            }
            return res.end();
          }

          if (event.message.type === "image") {
            const imageBinary = await line.getImageBinary(event.message.id);
            const msg = await gemini.multimodal(imageBinary, "Please help describe this picture.");
            await line.reply(event.replyToken, [{ type: "text", text: msg }]);
            return res.end();
          }

          break;
      }
    }
  }

  return res.send(req.method);
});