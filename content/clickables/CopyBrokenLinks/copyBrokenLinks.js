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

  let brokenLinkLocations = selectBrokenLinkLocation();

  if (
    arrayOfPageUrls &&
    arrayOfBrokenLinks &&
    arrayOfLinkTitles &&
    courseName &&
    brokenLinkLocations

  ) {
    const popupURL = chrome.runtime.getURL('content/clickables/CopyBrokenLinks/copyAllBrokenLinksPopup.html');
    chrome.storage.local.set({
        brokenLinksPageUrls: arrayOfPageUrls,
        brokenLinksURLS: arrayOfBrokenLinks,
        brokenLinksTitles: arrayOfLinkTitles,
        courseName:courseName,
        brokenLinksLocations: brokenLinkLocations,
        currentUrl: window.location.href
    }).then(() => {
        // Send a message to the background script to open the popup
        chrome.runtime.sendMessage({
            action: "showBrokenLinksPopup"
        });
        
    });
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

function selectCourseName() {
  let courseNameObj = document.getElementsByClassName("ellipsible");
  let fullCourseName = courseNameObj[1].innerText;
  console.log("Full Course Name: ", fullCourseName);
  function getCourseName(fullCourseName) {
    const typeBlock = " (Block)";
    const regex = /\b\w+\s\d+\w?\b/;
    if (fullCourseName.includes("Block")) {
      const match = fullCourseName.match(regex);
      const courseName = match[0] + typeBlock;
      return courseName;
    }
    const match = fullCourseName.match(regex);
    return match ? match[0]: fullCourseName;
  }

  let courseName = getCourseName(fullCourseName);

  return courseName;
}







function selectBrokenLinkLocation() {
  const locations = [];

  const divObjs = {};

  const div = document.querySelectorAll("div.result");

  div.forEach((node, index) => {
    const brokenLinks = [];
    const brokenLinksText = [];
    const page = node.querySelector("h2").innerText;
    const pageLink = node.querySelector("h2 a").href;

    const links = node.querySelectorAll("ul > li > a");

    links.forEach((link) => {
      brokenLinks.push(link.href);
      brokenLinksText.push(link.innerText);
    });

    divObjs[index] = {
      Page: page,
      "Page Link": pageLink,
      "Broken Link Text": brokenLinksText,
      "Broken Link URL": brokenLinks,
    };
  });

  console.log(divObjs);

  Object.values(divObjs).forEach((div) => {
    const amountOfLinks = div["Broken Link Text"].length;
    console.log(amountOfLinks);
    if (div["Page"].includes("Syllabus")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Syllabus");
      }
    } else if (div["Page"].includes("Course Homepage")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Course Homepage");
      }
    } else if (div["Page"].includes("Instructor Resource")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Instructor Resources");
      }
    } else if (div["Page"].includes("Textbook Information")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Textbook Information");
      }
    } else if (div["Page"].includes("Teaching Notes")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Teaching Notes");
      }
    } else if (div["Page"].includes("Student Resources")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Student Resources");
      }
    } else if (div["Page"].includes("W01")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 01");
      }
    } else if (div["Page"].includes("W02")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 02");
      }
    } else if (div["Page"].includes("W03")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 03");
      }
    } else if (div["Page"].includes("W04")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 04");
      }
    } else if (div["Page"].includes("W05")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 05");
      }
    } else if (div["Page"].includes("W06")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 06");
      }
    } else if (div["Page"].includes("W07")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 07");
      }
    } else if (div["Page"].includes("W08")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 08");
      }
    } else if (div["Page"].includes("W09")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 09");
      }
    } else if (div["Page"].includes("W10")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 10");
      }
    } else if (div["Page"].includes("W11")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 12");
      }
    } else if (div["Page"].includes("W12")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 12");
      }
    } else if (div["Page"].includes("W13")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 13");
      }
    } else if (div["Page"].includes("W14")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Week 14");
      }
    } else if (div["Page Link"].includes("pages")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Pages");
      }
    } else if (div["Page Link"].includes("quizzes")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Question Bank");
      }
    } else if (div["Page Link"].includes("question_banks")) {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Unfiled QB");
      }
    } else {
      for (i = 0; i < amountOfLinks; i++) {
        locations.push("Other");
      }
    }
  });

  return locations;
}









function selectHeaderHREFs() {
  let PageUrlArray = [];

  let divs = document.querySelectorAll("div.result");

  let linksAmmount = Array.from(divs).map((div) => {
    let links = div.querySelectorAll("a");
    console.log("Links",links)  
    let count = links.length - 1;
    console.log("Count",count)

    if (count > 1) {
      let headings = links[0];
      console.log("Headings",headings)  
      let link = headings.href
      console.log("Link",link)  

      for (let i = 0; i <= count - 1; i++) {
        PageUrlArray.push(link);
      }
    } else {
      PageUrlArray.push(links[0].href);
    }
  });

  return PageUrlArray;
}

function selectLinksHREFs() {
  // Select all <a> elements that are children of <h2> within .result
  const links = document.querySelectorAll(".result ul > li > a");

  // Map over the NodeList to extract the href attributes
  const hrefs = Array.from(links).map((link) => link.getAttribute("href"));

  return hrefs;
}

function selectAllTitles() {
  const titles = document.querySelectorAll(".result ul > li > a");

  let titlesArray = Array.from(titles).map((title) => title.textContent);

  return titlesArray;
}
