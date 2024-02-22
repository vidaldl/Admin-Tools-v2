
//gets the broken links that we previously stored in the local storage
//uses the populateData function
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get(['brokenLinksPageUrls', 'brokenLinksURLS', 'brokenLinksTitles'], function(result) {
    populateData(result.brokenLinksTitles, result.brokenLinksPageUrls, result.brokenLinksURLS),
    populateReasons(result.brokenLinksURLS)
  });
});



//takes all of the arrays as a parameter and cleans them up and stores each of them to 
//a new array 
//also contains all of the button funcionality
function populateData(Titles1, PageUrlArray1, BrokenLinkArray1) {
 
 /**************************************************************************/ 
/***Cleans Array of Titles***/
  let externalink ="Links to an external site."
  let Titles = Titles1.map(title => {
    if (title.includes(externalink)){
      return title.replace(/\n\s*\n\nLinks to an external site\./g, '',"");
    }
    return title;
  })
/**************************************************************************/
 

/***********************************************************/
/***Cleans Array of Page Urls***/
  // prefix that is needed to be added to the page url
  let prefix = "https://byui.instructure.com";
  
  //adds the prefix to all of the page url
  let PageUrlArray = PageUrlArray1.map(url => prefix + url);
/***********************************************************/


/***********************************************************************************************************/
/***Cleans Array of Broken links***/
  let prefix2 = "https://byui.instructure.com/" ;

  // urls with these prases require the prefix to be added maunualy
  let phrase1 = "$CANVAS_COURSE_REFERENCE$";
  let phrase2 = "/courses";
  let phrase3 = "$CANVAS_OBJECT_REFERENCE$";
  let phrase4 = "media_objects_iframe";
  let phrase5 = "%24CANVAS_OBJECT_REFERENCE%24"

 
  //maunual fix if the phrases are included in the link
  let BrokenLinkArray = BrokenLinkArray1.map(url => {
    if (url.includes(phrase1) || url.includes(phrase2) || url.includes(phrase3) || url.includes(phrase4) || url.includes(phrase5)){
      return prefix2 + url;
    }
    return url;
  });
/***********************************************************************************************************/


/****************************************************************/
/***Text areas***/
  //elements of all of the text areas
  let titlesTextArea = document.getElementById("link_text");
  let linkTextTextarea = document.getElementById("page_urls");
  let brokenLinkTextArea = document.getElementById("broken_links");
 

  //turns all the arrays to a string
  titlesTextArea.value = Titles.join('\n');
  linkTextTextarea.value = PageUrlArray.join('\n');
  brokenLinkTextArea.value = BrokenLinkArray.join('\n');
  
/****************************************************************/


/**************************************************************************/
/*** Copy Titles Button ***/
  let copyTitlesButton = document.getElementById("copyLinkTextButton");

  function CopyTitles(){
    titlesTextArea.select();
    navigator.clipboard.writeText(titlesTextArea.value);
  }

  copyTitlesButton.addEventListener('click', CopyTitles);
/**************************************************************************/


/**************************************************************************/
/*** Copy Page urls Button ***/
  let copyPageUrlsButton = document.getElementById("copyPageUrlsButton");

  function copyPageUrls(){
    linkTextTextarea.select();
    navigator.clipboard.writeText(linkTextTextarea.value);
  }

  copyPageUrlsButton.addEventListener('click', copyPageUrls);
/**************************************************************************/


/**************************************************************************/
/***Copy Links Button***/
  let copyBrokenLinksButton = document.getElementById("copyBrokenLinksButton");

  function copyBrokenLinks(){
    brokenLinkTextArea.select();
    navigator.clipboard.writeText(brokenLinkTextArea.value);
  }

  copyBrokenLinksButton.addEventListener('click', copyBrokenLinks);
/**************************************************************************/


/**************************************************************************/
/***Copies all of the links at once Button ***/
  let copyAllButton = document.getElementById("copyAllButton");

  function CopyAll(){
    let titleText = titlesTextArea.value;
    let linkText = linkTextTextarea.value;
    let brokenLinkText = brokenLinkTextArea.value;

    let titles = titleText.split('\n');
    let links = linkText.split('\n');
    let brokenLinks = brokenLinkText.split('\n');
    let combinedText = '';

    let rows = titles.length;

    for (let i = 0; i < rows; i++){
      combinedText += `${(titles[i])}\t${(links[i])}\t${brokenLinks[i]}\n`;
    }

    navigator.clipboard.writeText(combinedText);
  }

  copyAllButton.addEventListener("click", CopyAll);
/**************************************************************************/


// optional setting
  //clear all button
  // let clearAllButton = document.querySelector("#clearAllButton");

  // function ClearAll(){
  //   titlesTextArea.value = "";
  //   linkTextTextarea.value = "";
  //   brokenLinkTextArea.value= "";

    
  // }

  // clearAllButton.addEventListener("click", ClearAll);
}







function populateReasons(BrokenLinkArray2){
  
  /***Cleans Array of Broken links***/
  let prefix2 = "https://byui.instructure.com/" ;

  // urls with these prases require the prefix to be added maunualy
  let phrase1 = "$CANVAS_COURSE_REFERENCE$";
  let phrase2 = "/courses";
  let phrase3 = "$CANVAS_OBJECT_REFERENCE$";
  let phrase4 = "media_objects_iframe";
  let phrase5 = "%24CANVAS_OBJECT_REFERENCE%24"

  //Retreives a cleaned array of Broken links
  let BrokenLinkArrayForReasons = BrokenLinkArray2.map(url => {
    if (url.includes(phrase1) || url.includes(phrase2) || url.includes(phrase3) || url.includes(phrase4) || url.includes(phrase5) ){
      return prefix2 + url;
    }
    return url;
  });


  chrome.storage.local.get(['currentUrl'], function(result) {
    if (result.currentUrl) {
        let storedCurrentUrl = result.currentUrl;
        console.log("Retrieved URL from Chrome.storage.local", storedCurrentUrl);

        // Use storedCurrentUrl as the course URL to get the main course ID
        const mainCourseID = getMainCourseId(storedCurrentUrl);

        // Assuming BrokenLinkArrayForReasons is already defined and populated
        // Process the links stored in BrokenLinkArrayForReasons
        processUrls(BrokenLinkArrayForReasons, mainCourseID);
    }
});

// Function to extract the main course ID from a URL
const getMainCourseId = (url) => {
    let parts = url.split("/");
    return parts[4]; // Adjust index based on URL structure
};

// Function to get the course ID from a URL, if applicable
function getCoursesId(url) {
    let parts = url.split("/");
    if (url.includes("byui.instructure") && !url.includes("REFERENCE$")) {
        return parts[5]; // Adjust index based on URL structure
    } else {
        return null;
    }
}

// Function to fetch the status code of a given URL
async function fetchStatusCode(url) {
    try {
        const response = await fetch(url, {mode: 'no-cors'});
        return { url, status: response.status };
    } catch (error) {
        console.log("error fetching", url, error);
        return { url, status: "Error", error: error };
    }
}

// Function to process each URL in the given array and log relevant information
async function processUrls(urls, mainCourseID) {
    const fetchPromises = urls.map(url => fetchStatusCode(url));
    const results = await Promise.all(fetchPromises);
    let arrayOfReasons = [];

    results.forEach(result => {
        const coursesId = getCoursesId(result.url);

        if (coursesId !== null) {
            if (coursesId != mainCourseID) {
                console.log("URL:", result.url, "Course ID:", coursesId, "Status Code:", result.status, "Possible Reason: External Course Content");
                arrayOfReasons.push("Possible Reason: External Course Content");
            } else {
                console.log("URL:", result.url, "Course ID:", coursesId, "Status Code:", result.status, "Possible Reason: Broken Link");
                arrayOfReasons.push("Possible Reason: Broken Link");
            }
        } else {
            if (result.status === 200 && !result.url.includes("byui.instructure")) {
                console.log("URL:", result.url, "Course ID:", coursesId, "Status Code:", result.status, "Possible Reason: False Positive");
                arrayOfReasons.push("Possible Reason: False Positive");
            } else if (result.status === 404) {
                console.log("URL:", result.url, "Course ID:", coursesId, "Status Code:", result.status, "Possible Reason: Page Not Found");
                arrayOfReasons.push("Possible Reason: Page Not Found");
            } else {
                console.log("URL:", result.url, "Status Code:", result.status, "Possible Reason: Broken Link");
                arrayOfReasons.push("Possible Reason: Broken Link");
            }
        }

    });

    console.log(arrayOfReasons);
  /****************************************************************/
  /*** Reasons Text areas***/

    let reasonsTextArea = document.getElementById("broken_reason");
    reasonsTextArea.value =  arrayOfReasons.join('\n');
  /****************************************************************/



  /****************************************************************/
  /*** Reasons Text Copy Button***/
    
    let reasonsCopyButton = document.getElementById("copyBrokenReasonsButton");

    function copyReasons(){
      reasonsTextArea.select();
      navigator.clipboard.writeText(reasonsTextArea.value);
    }

    reasonsCopyButton.addEventListener('click',copyReasons);

  /****************************************************************/
}
}

  





  