import { copyAllBrokenLinks } from './scripts/copyAllBrokenLinks/copyAllBrokenLinksBackground.js';



 //imported from backgroundScripts so we can keep the background.js file looking clean
 copyAllBrokenLinks();

 // hears the message from the ContentSctipt and collects the arrays
 // It then stores the arrays to the local storage
 // It then opens a popup
 chrome.runtime.onMessage.addListener(function (request) {
 if (request.action === "sendArraysToBackground") {
   console.log("Page Url Array received in the background");
   let PageUrls = request.array1;
   let BrokenLinks = request.array2;
   let Titles = request.array3;


     chrome.storage.local.set({
         brokenLinksPageUrls: PageUrls,
         brokenLinksURLS: BrokenLinks,
         brokenLinksTitles: Titles
     }, function() {
         chrome.windows.create({
             type: 'popup',
             url: './scripts/copyAllBrokenLinks/copyAllBrokenLinksPopup.html',
             width: 630,
             height: 325
         });
     });

 }
 });
