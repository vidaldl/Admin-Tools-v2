





//console.log("contextMenu.js loaded");

//gets the broken links that we previously stored in the local storage
//uses the populateData function
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get(['brokenLinksPageUrls', 'brokenLinksURLS', 'brokenLinksTitles'], function(result) {
    console.log(result)
    populateData(result.brokenLinksTitles, result.brokenLinksPageUrls, result.brokenLinksURLS)

    // Use the data as needed
  });
});



//takes all of the arrays as a parameter and cleans them up and stores each of them to 
//a new array 
//also contains all of the button funcionality
function populateData(Titles1, PageUrlArray1, BrokenLinkArray1) {

  console.log("recieved message from the background to the contextMenu.js");

  console.log(Titles1);
  console.log(PageUrlArray1);
  console.log(BrokenLinkArray1);


  let externalink ="Links to an external site."
  let Titles = Titles1.map(title => {
    if (title.includes(externalink)){
      return title.replace(/\n\s*\n\nLinks to an external site\./g, '',"");
    }
    return title;
  })


  //Adds the the prefix to all of the Page Urls
  let prefix = "https://byui.instructure.com";
  let prefix2 = "https://byui.instructure.com/" ;

  let PageUrlArray = PageUrlArray1.map(url => prefix + url);


  let phrase1 = "$CANVAS_COURSE_REFERENCE$";
  let phrase2 = "/courses";
  let phrase3 = "$CANVAS_OBJECT_REFERENCE$";
  let phrase4 = "media_objects_iframe";


  let BrokenLinkArray = BrokenLinkArray1.map(url => {
    if (url.includes(phrase1) || url.includes(phrase2) || url.includes(phrase3) || url.includes(phrase4) ){
      return prefix2 + url;
    }
    return url;
  });

  console.log("This the Broken Link Array in contextMenu.js", BrokenLinkArray);// Replace 'yourArray' with the actual variable name
  console.log("this is the array inside the contextMenu.js", PageUrlArray);
  console.log("This is the titles Array in the context Menu.js ", Titles);



  //elements of all of the text areas
  let titlesTextArea = document.getElementById("link_text");
  let linkTextTextarea = document.getElementById("page_urls");
  let brokenLinkTextArea = document.getElementById("broken_links")

  //turns all the arrays to a string
  titlesTextArea.value = Titles.join('\n');
  linkTextTextarea.value = PageUrlArray.join('\n');
  brokenLinkTextArea.value = BrokenLinkArray.join('\n');


  //Copy Titles Button
  let copyTitlesButton = document.getElementById("copyLinkTextButton");

  function CopyTitles(){
    titlesTextArea.select();
    navigator.clipboard.writeText(titlesTextArea.value);
  }

  copyTitlesButton.addEventListener('click', CopyTitles);



  //Copy Page urls Button
  let copyPageUrlsButton = document.getElementById("copyPageUrlsButton");

  function copyPageUrls(){
    linkTextTextarea.select();
    navigator.clipboard.writeText(linkTextTextarea.value);
  }

  copyPageUrlsButton.addEventListener('click', copyPageUrls);


  //Copy Links Button
  let copyBrokenLinksButton = document.getElementById("copyBrokenLinksButton");

  function copyBrokenLinks(){
    brokenLinkTextArea.select();
    navigator.clipboard.writeText(brokenLinkTextArea.value);
  }

  copyBrokenLinksButton.addEventListener('click', copyBrokenLinks);



  //Copies all of the links at once
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


  