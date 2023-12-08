

/****
 *
 * This function is to scrape the affected URL for the following.
 *      - The Title of all Broken Links on Page 
 *      - The URL's of all Broken Links on the Page
 *      - The Page Location of all Broken Links on the Page
 *
 * Proccess:
 * I. Scrapes the Data From the Affected URL
 * II. Stores Data into Arrays and sends the Arrays as a message to the local background.js script.
 *
 * Affected URLs:
 * [canvas_instance]/course/[courseId]/link_validator
 *
 ****/
function scrape() {

    let arrayOfPageUrls = selectHeaderHREFs();

    let arrayOfBrokenLinks = selectLinksHREFs();
    
    let arrayOfLinkTitles = selectAllTitles();

    if (arrayOfPageUrls && arrayOfBrokenLinks && arrayOfLinkTitles){
        chrome.runtime.sendMessage({
          action: "sendArraysToBackground", 
          array1:arrayOfPageUrls, 
          array2:arrayOfBrokenLinks, 
          array3:arrayOfLinkTitles});
    
    } else {
        console.log("Data retrival failed.")
    }
}




/***
 * 
 *  Utility Functions
 * 
 *  selectHeaderHREF
***/

//selects all the page urls on the page and stores it in an array
function selectHeaderHREFs(){

  let PageUrlArray = [];

  let divs = document.querySelectorAll('div.result');

  let linksAmmount = Array.from(divs).map(div => {
      let links = div.querySelectorAll('a'); 
      let count = links.length - 1;

      if (count > 1){
          let headings = document.querySelector('.result h2 > a');
          let link = headings.getAttribute('href');

          for (let i = 0; i <= count - 1; i++){
              PageUrlArray.push(link);
          }      
      }
      else 
      {
          PageUrlArray.push(links[0].getAttribute("href"));
      }
  });

  return PageUrlArray;
};

//selects all of the brokenlinks on the page and stores it in an array
function selectLinksHREFs() {
    // Select all <a> elements that are children of <h2> within .result
    const links = document.querySelectorAll('.result ul > li > a');

    // Map over the NodeList to extract the href attributes
    const hrefs = Array.from(links).map(link => link.getAttribute('href'));

    return hrefs;
}

//selects all of the titles of the Broken links on the page and stores it in an array
function selectAllTitles()
{
  const titles = document.querySelectorAll('.result ul > li > a');
  
  let titlesArray = Array.from(titles).map(title => title.textContent);

  return titlesArray;
}


// calling the Scrape function  
scrape();






