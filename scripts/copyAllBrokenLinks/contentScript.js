

//calling the scrape function to start the process
scrape();


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

    let courseName = selectCourseName();

    if (arrayOfPageUrls && arrayOfBrokenLinks && arrayOfLinkTitles && courseName){
        chrome.runtime.sendMessage({
          action: "sendArraysToBackground", 
          array1:arrayOfPageUrls, 
          array2:arrayOfBrokenLinks, 
          array3:arrayOfLinkTitles,
          course:courseName});
    }
}




/***
 * 
 * 
 *  Utility Functions
 * -------------------
 * 
 *  selectHeaderHREF()
 *  Process: 
 *  Stores all of the page urls, from the affected URL, into an Array.
 * 
 *  selectLinksHREFs()
 *  Process:
 *  Stores all of the broken links, from the affected URL, into an Array.
 * 
 *  selectAllTitles()
 *  Process: 
 *  Stores all of broken link titles, from the affected URL, into an Array.
 * 
***/

function selectCourseName(){

    let courseNameObj = document.getElementsByClassName('ellipsible');
    let fullCourseName = courseNameObj[1].innerText
    function getCourseName(fullCourseName){
        const typeBlock = ' (Block)'
        const regex = /\b\w+\s\d+\w?\b/;
        if (fullCourseName.includes('Block')){
            const match = fullCourseName.match(regex);
            const courseName = match[0] + typeBlock;
            return courseName
        }
        const match = fullCourseName.match(regex);
        return match[0];
    }

    let courseName = getCourseName(fullCourseName);

    return courseName;
}




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


function selectLinksHREFs() {
    // Select all <a> elements that are children of <h2> within .result
    const links = document.querySelectorAll('.result ul > li > a');

    // Map over the NodeList to extract the href attributes
    const hrefs = Array.from(links).map(link => link.getAttribute('href'));

    return hrefs;
}


function selectAllTitles()
{
  const titles = document.querySelectorAll('.result ul > li > a');
  
  let titlesArray = Array.from(titles).map(title => title.textContent);

  return titlesArray;
}
