







//gets the broken links that we previously stored in the local storage
//uses the populateData function
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get(['brokenLinksPageUrls', 'brokenLinksURLS', 'brokenLinksTitles'], function(result) {
    populateData(result.brokenLinksTitles, result.brokenLinksPageUrls, result.brokenLinksURLS)
  });
});



//takes all of the arrays as a parameter and cleans them up and stores each of them to 
//a new array 
//also contains all of the button funcionality
function populateData(Titles1, PageUrlArray1, BrokenLinkArray1) {


  /***Cleans Array of Titles***/

  let externalink ="Links to an external site."
  let Titles = Titles1.map(title => {
    if (title.includes(externalink)){
      return title.replace(/\n\s*\n\nLinks to an external site\./g, '',"");
    }
    return title;
  })
/**************************************************************************/
  
  /***Cleans Array of Page Urls***/

  // prefix that is needed to be added to the page url
  let prefix = "https://byui.instructure.com";
  
  //adds the prefix to all of the page url
  let PageUrlArray = PageUrlArray1.map(url => prefix + url);

  /**************************************************************************/

  /***Cleans Array of Broken links***/

  let prefix2 = "https://byui.instructure.com/" ;

  // urls with these prases require the prefix to be added maunualy
  let phrase1 = "$CANVAS_COURSE_REFERENCE$";
  let phrase2 = "/courses";
  let phrase3 = "$CANVAS_OBJECT_REFERENCE$";
  let phrase4 = "media_objects_iframe";

 
  //maunual fix if the phrases are included in the link
  let BrokenLinkArray = BrokenLinkArray1.map(url => {
    if (url.includes(phrase1) || url.includes(phrase2) || url.includes(phrase3) || url.includes(phrase4) ){
      return prefix2 + url;
    }
    return url;
  });
  /***********************************************************************************************************/


  //elements of all of the text areas
  let titlesTextArea = document.getElementById("link_text");
  let linkTextTextarea = document.getElementById("page_urls");
  let brokenLinkTextArea = document.getElementById("broken_links")

  //turns all the arrays to a string
  titlesTextArea.value = Titles.join('\n');
  linkTextTextarea.value = PageUrlArray.join('\n');
  brokenLinkTextArea.value = BrokenLinkArray.join('\n');


  /*** Copy Titles Button ***/
  let copyTitlesButton = document.getElementById("copyLinkTextButton");

  function CopyTitles(){
    titlesTextArea.select();
    navigator.clipboard.writeText(titlesTextArea.value);
  }

  copyTitlesButton.addEventListener('click', CopyTitles);
  /**************************************************************************/



  /*** Copy Page urls Button ***/
  let copyPageUrlsButton = document.getElementById("copyPageUrlsButton");

  function copyPageUrls(){
    linkTextTextarea.select();
    navigator.clipboard.writeText(linkTextTextarea.value);
  }

  copyPageUrlsButton.addEventListener('click', copyPageUrls);
  /**************************************************************************/


  /***Copy Links Button***/
  let copyBrokenLinksButton = document.getElementById("copyBrokenLinksButton");

  function copyBrokenLinks(){
    brokenLinkTextArea.select();
    navigator.clipboard.writeText(brokenLinkTextArea.value);
  }

  copyBrokenLinksButton.addEventListener('click', copyBrokenLinks);
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


  