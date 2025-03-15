const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
const querystring = require("querystring");

dotenv.config();

let platformUrl = `https://${process.env.APP_DOMAIN}/booking?viewdate=${getNextDate()}`; 

if (
  process.env.VERIFICATION_VALUE === undefined ||
  process.env.APPLICATION_VALUE === undefined ||
  process.env.APP_DOMAIN === undefined
) {
  console.log("Please set the environment variables!");
  process.exit(1); // Exit the process if environment variables are not set
}

const COOKIES = [
  {
    name: "X-Skedda-RequestVerificationCookie",
    value: process.env.VERIFICATION_VALUE,
    domain: process.env.APP_DOMAIN,
  },
  {
    name: "X-Skedda-ApplicationCookie",
    value: process.env.APPLICATION_VALUE,
    domain: process.env.APP_DOMAIN,
  },
];

(async () => {
  console.log("Starting the script...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  if (
    process.env.VERIFICATION_VALUE === undefined ||
    process.env.APPLICATION_VALUE === undefined ||
    process.env.APP_DOMAIN === undefined
  ) {
    console.error("Please set the environment variables");
    await browser.close();
    return;
  }

  // Set auth cookies
  await page.setCookie(...COOKIES);

  // Open the platform URL
  await page.goto(platformUrl, { waitUntil: "networkidle2" });

  // Wait for the green circle marking the available time slot
  await page.waitForSelector("svg.fa-circle", { visible: true });

  // Find the green circle
  const greenCircle = await page.$("svg.fa-circle");

  if (greenCircle) {
    console.log("Green circle found, clicking...");
    await greenCircle.click();
  } else {
    console.error("Green circle not found!");
    await browser.close();
    return;
  }

  // Click on the Book button
  const bookButton = await page.waitForSelector(
    "button.btn.btn-success.w-100.mb-std"
  );
  await bookButton.click();
  console.log("Clicked on the Book button.");

  // Wait for the modal to appear
  await page.waitForSelector(".modal.show");
  // Find the modal container
  const modalContainer = await page.$(".modal.show .container-fluid");
  if (!modalContainer) {
    console.error("Container-fluid not found!");
    await browser.close();
    return;
  }

  // Get the updated URL
  let updatedUrl = page.url();

  // Extract the nbend parameter from the updated URL
  let nbend = getQueryParam(updatedUrl, "nbend");
  const newNbend = `${nbend.split("T")[0]}T18:00:00`; // Set the new time to 18:00

  updatedUrl = setQueryParam(updatedUrl, "nbend", newNbend);
  console.log("Updated URL with new nbend parameter:", updatedUrl);

  // Load the updated URL
  await page.goto(updatedUrl, { waitUntil: "networkidle2" });

  //  Click the final button to confirm the booking
  const finalButton = await page.waitForSelector(
    ".modal.show button.btn.btn-success"
  );
  await finalButton.click();
  console.log("Clicked on the final button to confirm the booking.");

  // Wait for the confirmation message

  const flashMessage = await page.waitForSelector(".flash-message");
  if (!flashMessage) {
    console.error("Flash message not found!");
    await browser.close();
    return;
  }

  console.log("Booking confirmed");
  await browser.close();
})();

// Function to get query parameter value by name
function getQueryParam(url, param) {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get(param) || "";
}

// Function to set query parameter value by name
function setQueryParam(url, param, value) {
  const urlObj = new URL(url);
  urlObj.searchParams.set(param, value);
  return urlObj.toString();
}

function getNextDate() {
  // Set date to Now + 7 days
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split("T")[0];
}
