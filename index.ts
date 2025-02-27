const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
dotenv.config();

const platformUrl = `https://${process.env.DOMAIN}/booking?viewmapid=ef141b1ce5ab4970858d03c21568eb2a&viewdate=2025-04-03`; // TODO: change this to auto date

const COOKIES = [
  {
    name: "X-Skedda-RequestVerificationCookie",
    value: process.env.VERIFICATION_VALUE,
    domain: process.env.DOMAIN,
  },
  {
    name: "X-Skedda-ApplicationCookie",
    value: process.env.APPLICATION_VALUE,
    domain: process.env.DOMAIN,
  },
];
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

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
    console.log("Green circle not found!");
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
    console.log("Container-fluid not found!");
    await browser.close();
    return;
  }

  // Get all rows inside the modal container
  const rows = await modalContainer.$$(".row");
  if (rows.length < 2) {
    console.log("Something wrong with the modal rows!");
    await browser.close();
    return;
  }

  // Select the second row which contains the time dropdown
  const secondRow = rows[1];

  // Find all dropdown buttons in the second row
  const dropdowns = await secondRow.$$(".dropdown");
  if (dropdowns.length < 2) {
    console.log("Second dropdown not found!");
    await browser.close();
    return;
  }

  // Let's click on the second dropdown button
  const drop1 = await dropdowns[1];
  const button = await drop1.waitForSelector("button");
  await button.click();
  console.log("Clicked on the second dropdown button.");

  // Wait for the dropdown menu to appear
  await page.waitForSelector(".dropdown-menu");

  // Get all items in the dropdown
  const dropdownItems = await drop1.$$(".dropdown-item");

  // Find the proper time option
  let timeOption = null;
  for (const item of dropdownItems) {
    const text = await page.evaluate((el) => el.textContent.trim(), item);
    if (text.includes("5:00") || text.includes("17:00")) {
      timeOption = button;
      break;
    }
  }

  if (timeOption) {
    // Scroll to the time option
    await timeOption.evaluate((el) => el.scrollIntoView({ block: "center" }));

    // Wait a bit for the scroll to finish
    await new Promise((r) => setTimeout(r, 200));

    // Click the time option
    await page.evaluate((el) => el.click(), timeOption);

    console.log("Value 5:00 PM or 17:00 found and clicked.");
  } else {
    console.log("Value 5:00 PM or 17:00 not found!");
    await browser.close();
    return;
  }

  //  Click the final button to confirm the booking
  const finalButton = await page.waitForSelector(
    ".modal.show button.btn.btn-success"
  );
  await finalButton.click();
  console.log("Clicked on the final button to confirm the booking.");

  // Wait for the confirmation message
  await page.waitForSelector(".alert.alert-success");
  console.log("Booking confirmed!");

  await browser.close();
})();
