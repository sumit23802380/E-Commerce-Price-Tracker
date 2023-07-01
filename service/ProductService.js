const axios = require("axios");
const cheerio = require("cheerio");
const { getItemByUrl } = require("../repository/ProductRepository");
const Product = require("../model/Product");
const { appErr } = require("../utils/appErr");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

const TrackProduct = async (url, from) => {
  if (isValidUrl(url)) {
    try {
      const product = await getItemByUrl(url);
      console.log(product);
      if (product) {
        product.usersTracking.push(from);
        product.save();
        return `Tracer initialized for user ${from} for Product ${product.name}`;
      } else {
        const response = await fetch(url);
        const body = await response.text();
        const $ = cheerio.load(body);
        console.log($);
        const priceSpan = $(".a-price-whole");
        const productPrice = parseInt(priceSpan.text().replace(",", ""));
        const productTitleElem = $("#productTitle");
        if (!productTitleElem) {
          return "Invalid Product URL, kindly send only the Amazon product URL.";
        }
        const productTitle = $("#productTitle").text().trim();
        if (productPrice && productTitle) {
          const product = await Product.create({
            name: productTitle,
            url,
            prices: [productPrice],
            usersTracking: [from],
          });
          return `Tracer initialize for user ${from} for Product ${product.name}`;
        }
      }
    } catch (error) {
      throw appErr(error.message, 500);
    }
  } else {
    return `Please Send Valid URL`;
  }
};

const trackAndSendReply = async (from, to, url) => {
  const message = await TrackProduct(url, from);
  console.log("message", message);
  console.log("user number is", from);
  await client.messages.create({
    body: message,
    from: to,
    to: from,
  });
};

module.exports = { TrackProduct, trackAndSendReply };
