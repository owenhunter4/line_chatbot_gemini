const { onRequest } = require("firebase-functions/v2/https");
const line = require("./utils/line");
const gemini = require("./utils/gemini");
const stock = require("./stock");

exports.webhook = onRequest(async (req, res) => {
  if (req.method === "POST") {
    const events = req.body.events;
    for (const event of events) {
      console.log("event.source.userId ==> "+event.source.userId);
      switch (event.type) {
        case "message":

          if (event.message.type === "text") {
            // const msg = await gemini.textOnly(event.message.text);
            if (event.message.text.indexOf("#") >= 0) {
              const stockname = event.message.text.replace("#", "");
              const [imageBinary,imgUrl,imgUrlNews, imgUrlNews2] = await stock.getStockImageBinaryV2(stockname);
              const msg = await gemini.multimodal(imageBinary,"อธิบายกราฟของหุ้นตัวนี้ ตามเทคนิค ให้หน่อย");
              await line.reply(event.replyToken, [{
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
            else if (event.message.text.indexOf(">") >= 0) {
              const stockname = event.message.text.replace(">", "");
              const [imageBinary,imgUrl,imgUrlNews, imgUrlNews2] = await stock.getStockImageBinaryV2(stockname);
              const msg = await gemini.multimodal(imageBinary,"อธิบายกราฟของหุ้นตัวนี้ ตามเทคนิค ให้หน่อย");
              await line.multicast(["Udae3cf4851a4764c2e0b160ce72145c6","Ude9e37d09f1f738d153a55f6e28e7623"], [{
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
            else {
              const msg = await gemini.chat(event.message.text);
              await line.reply(event.replyToken, [{ type: "text", text: msg }]);
            }
            return res.end();
          }

          if (event.message.type === "image") {
            const imageBinary = await line.getImageBinary(event.message.id);
            const msg = await gemini.multimodal(imageBinary,"Please help describe this picture.");
            await line.reply(event.replyToken, [{ type: "text", text: msg }]);
            return res.end();
          }

          break;
      }
    }
  }

  return res.send(req.method);
});