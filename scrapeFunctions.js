const homeDir = require('os').homedir();
const {Builder, By,ServiceBuilder} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const ObjectsToCsv = require('objects-to-csv');


module.exports = {
    scrapeBrands:async ()=>{
        await getBrands();
  },
  scrapeSinglePhone: async (inputURL)=>{
    
    function validateURL(urlString) {
      const parsedURL = new URL(urlString);
      return parsedURL.hostname === 'www.gsmarena.com';
    }

    
    if (validateURL(inputURL)) {
      console.log('URL is valid and points to www.gsmarena.com');
      const chromeOptions = new chrome.Options();
      chromeOptions.addArguments('--headless');
    
        const driver = new Builder()
          .forBrowser('chrome')
          .setChromeOptions(chromeOptions)
          .build();
    
        try {
            let phoneInfo = await getPhoneInformation(driver,inputURL);      
            savePhoneData([phoneInfo],'SINGLE-PHONE');
        }
        catch(err) {
          console.log(err);
        }
        finally{
          await driver.quit();
        }

    } else {
      console.log('URL is either invalid or does not point to www.gsmarena.com');
    }

  },

  scrapePhoneLinks:async(url,iterate)=>{
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');

    const driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
    let phoneInfoList=[];
    try{
    const phoneLinks = await getPhoneLinks(driver,url, iterate);

    for (const e of await phoneLinks) {
      let phoneInfo = await getPhoneInformation(driver,e);
      phoneInfoList.push(phoneInfo);
     }
    }finally{
      await driver.quit();
    }
     
  savePhoneData(phoneInfoList,'BRANDS-DATA');
  }

}

function setNoticeText(text){
  
  let alertType =text.toLowerCase().includes('found') || text.toLowerCase().includes('saved')  ?"success": 'primary';
  document.getElementById("show-progress").innerHTML= "<div class='alert alert-"+alertType+"'>"+text+"</div>";
}

async function getBrands(){
  setNoticeText('Getting Brand Information Please Wait .......');            

  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments('--headless');

    const driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    try {
        await driver.get('https://www.gsmarena.com/makers.php3');
        const products = await driver.findElements(By.css('tr'));

        for (let i = 0; i < products.length; i++) {
          const link = await products[i].findElement(By.css('td > a'));
          const href = await link.getAttribute('href');

          const linkText = await link.getText();
          const name = linkText.split('\n')[0];
          const deviceCount = linkText.split('\n')[1];
           

        $('ul.list-group').append("<li class='list-group-item d-flex justify-content-between align-items-center'><a href='#top'><button type='button' class='brand-btn btn btn-secondary' blink='"+href+"'  >"+name+"</button></a><span class='badge bg-primary badge-pill'>"+deviceCount+"</span></li>");
        }
    } finally {
      await driver.quit();
    }
    setNoticeText('Brand Names Found !');
    
}


async function getPhoneLinks(driver,url, iterate) {
  setNoticeText(`Featching Phone Data from ${url}\n Please Wait ......`);
  const secondaryPhoneLinks = [];
  const phoneLinksList = [];

  await driver.get(url);

  const phones = await driver.findElements(By.css('div#review-body.section-body div.makers ul li'));

  for (const phone of phones) {

    const link = await phone.findElement(By.css('a'));
    const phoneLink = await link.getAttribute('href');
    phoneLinksList.push(phoneLink);
  }

  if (iterate) {
    
    setNoticeText('Fetching Pages ......');

    const pages = await driver.findElements(By.css('.nav-pages > a'));

    setNoticeText(`Found ${pages.length} Pages`);

    if (pages.length > 0) {
      for (const page of pages) {
        const link = page;
        secondaryPhoneLinks.push(await link.getAttribute('href'));
      }
    }

    if (secondaryPhoneLinks.length > 0) {
      for (const link of secondaryPhoneLinks) {
        await driver.get(link);

        const phones = await driver.findElements(By.css('div#review-body.section-body div.makers ul li'));

        for (const phone of phones) {
          const link = await phone.findElement(By.css('a'));
          phoneLinksList.push(await link.getAttribute('href'));
        }
      }
    }
  }
  return phoneLinksList;
}


async function getPhoneInformation(driver,phone) {

  setNoticeText(`Getting information from ${phone} \nPlease Wait ....`);
  const phoneDict = {};
  await driver.get(phone);

  const detailTitles = await driver.findElements(By.css("td.ttl"));
  const detailInfo = await driver.findElements(By.css("td.nfo"));
  
  for (let i = 0; i < detailTitles.length; i++) {
    const title = await detailTitles[i].getText();
    const info = await detailInfo[i].getText();
    
    if (title !== '' || info !== '') {
      phoneDict[title] = info;
    }
  }
  return phoneDict;
}

async function savePhoneData(data,fileName){  
  setNoticeText('Saving Data');
  (async () => {
    const csv = new ObjectsToCsv(data);
    await csv.toDisk(`${homeDir}/Desktop/${fileName}.csv`);
    setNoticeText('Saved Data');
  })();
}