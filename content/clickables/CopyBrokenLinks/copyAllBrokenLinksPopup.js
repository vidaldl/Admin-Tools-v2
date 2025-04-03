//gets the broken links that we previously stored in the local storage
//uses the populateData function
document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(
    [
      "brokenLinksPageUrls",
      "brokenLinksURLS",
      "brokenLinksTitles",
      "currentUrl",
    ],
    function (result) {
      const array = result.brokenLinksTitles;
      const length = array.length;
      populateData(
        result.brokenLinksTitles,
        result.brokenLinksPageUrls,
        result.brokenLinksURLS,
        result.currentUrl
      ),
      populateReasons(result.brokenLinksURLS);
      populateCourseNames(length);
      populateLocations();
    }
  );
});

//takes all of the arrays as a parameter and cleans them up and stores each of them to
//a new array
//also contains all of the button funcionality
function populateData(Titles1, PageUrlArray1, BrokenLinkArray1, CurrentUrl) {
  /**************************************************************************/
  /***Cleans Array of Titles***/
  let externalink = "Links to an external site.";
  let Titles = Titles1.map((title) => {
    if (title.includes(externalink)) {
      return title.replace(/\n\s*\n\nLinks to an external site\./g, "", "");
    }
    return title;
  });
  /**************************************************************************/

  /***********************************************************/
  /***Cleans Array of Page Urls***/
  // prefix that is needed to be added to the page url
  let prefix = "https://byui.instructure.com";

  //adds the prefix to all of the page url
  let PageUrlArray = PageUrlArray1.map((url) => url);
  /***********************************************************/

  /***********************************************************************************************************/
  /***Cleans Array of Broken links***/
  const getMainCourseIdForBrokenLinks = (url) => {
    let parts = url.split("/");
    return parts[4]; // Adjust index based on URL structure
  };

  let currentId = getMainCourseIdForBrokenLinks(CurrentUrl);
  console.log(currentId);

  let prefix2 = "https://byui.instructure.com/";
  let prefix3 = `https://byui.instructure.com/courses/${currentId}/`;

  // urls with these prases require the prefix to be added maunualy
  let phrase1 = "$CANVAS_COURSE_REFERENCE$";
  let phrase2 = "/courses";
  let phrase3 = "$CANVAS_OBJECT_REFERENCE$";
  let phrase4 = "media_objects_iframe";
  let phrase5 = "%24CANVAS_OBJECT_REFERENCE%24";

  //maunual fix if the phrases are included in the link
  let BrokenLinkArray = BrokenLinkArray1.map((url) => {
    if (
      url.includes(phrase1) ||
      url.includes(phrase2) ||
      url.includes(phrase3) ||
      url.includes(phrase4)
    ) {
      return prefix2 + url;
    } else if (url.includes(phrase5)) {
      return prefix3 + url;
    }
    return url;
  });

  /***********************************************************************************************************/

  /****************************************************************/
  /***Text areas***/
  //elements of all of the text areas
  let coursesTextArea = document.getElementById("course_name");
  let reasonTextArea = document.getElementById("broken_reason");
  let locationTextArea = document.getElementById("broken_locations");
  let titlesTextArea = document.getElementById("link_text");
  let linkTextTextarea = document.getElementById("page_urls");
  let brokenLinkTextArea = document.getElementById("broken_links");
  
  // loading state
  reasonTextArea.value = "Loading...";
  //turns all the arrays to a string
  titlesTextArea.value = Titles.join("\n");
  linkTextTextarea.value = PageUrlArray.join("\n");
  brokenLinkTextArea.value = BrokenLinkArray.join("\n");

  /****************************************************************/

  /**************************************************************************/
  /*** Copy Titles Button ***/
  let copyTitlesButton = document.getElementById("copyLinkTextButton");

  function CopyTitles() {
    titlesTextArea.select();
    navigator.clipboard.writeText(titlesTextArea.value);
  }

  copyTitlesButton.addEventListener("click", CopyTitles);
  /**************************************************************************/

  /**************************************************************************/
  /*** Copy Page urls Button ***/
  let copyPageUrlsButton = document.getElementById("copyPageUrlsButton");

  function copyPageUrls() {
    linkTextTextarea.select();
    navigator.clipboard.writeText(linkTextTextarea.value);
  }

  copyPageUrlsButton.addEventListener("click", copyPageUrls);
  /**************************************************************************/

  /**************************************************************************/
  /***Copy Links Button***/
  let copyBrokenLinksButton = document.getElementById("copyBrokenLinksButton");

  function copyBrokenLinks() {
    brokenLinkTextArea.select();
    navigator.clipboard.writeText(brokenLinkTextArea.value);
  }

  copyBrokenLinksButton.addEventListener("click", copyBrokenLinks);
  /**************************************************************************/

  /**************************************************************************/
  /***Copies all of the links at once Button ***/
  let copyAllButton = document.getElementById("copyAllButton");

  function CopyAll() {
    const coursesTextArea = document.getElementById("course_name");
    const reasonTextArea = document.getElementById("broken_reason");
    const locationTextArea = document.getElementById("broken_location");
    const titlesTextArea = document.getElementById("link_text");
    const linkTextTextarea = document.getElementById("page_urls");
    const brokenLinkTextArea = document.getElementById("broken_links");

    const courses = coursesTextArea.value.split('\n');
    const reasons = reasonTextArea.value.split('\n');
    const locations = locationTextArea.value.split('\n');
    const titles = titlesTextArea.value.split('\n');
    const pageUrls = linkTextTextarea.value.split('\n');
    const brokenLinks = brokenLinkTextArea.value.split('\n');

    let combinedText = "";
    for (let i = 0; i < courses.length; i++) {
      combinedText += [
        courses[i],
        "", // Status is missing in the provided JavaScript code. Place an empty string here as a placeholder
        reasons[i],
        locations[i],
        titles[i],
        pageUrls[i],
        brokenLinks[i],
      ].join("\t") + "\n"; // Join with tabs and add a newline at the end
  }

  navigator.clipboard.writeText(combinedText).then(function() {
    console.log('Copying to clipboard was successful!');
  }, function(err) {
    console.error('Could not copy text: ', err);
  });
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

//FUNCTION: takes all the urls, cleans them//
//PARAMETERS: the Broken Link array
//RETURNS a list of broken link urls       //

function populateReasons(BrokenLinkArray2) {
  chrome.storage.local.get(["currentUrl"], function (result) {
    if (result.currentUrl) {
      let storedCurrentUrl = result.currentUrl;

      /***Cleans Array of Broken links***/
      let prefix2 = "https://byui.instructure.com/";
      let prefix3 = `https://byui.instructure.com/courses/${result.currentUrl}/`;

      // urls with these prases require the prefix to be added maunualy
      let phrase1 = "$CANVAS_COURSE_REFERENCE$";
      let phrase2 = "/courses";
      let phrase3 = "$CANVAS_OBJECT_REFERENCE$";
      let phrase4 = "media_objects_iframe";
      let phrase5 = "%24CANVAS_OBJECT_REFERENCE%24";
      //console.log("Retrieved URL from Chrome.storage.local", storedCurrentUrl);

      //Retreives a cleaned array of Broken links
      let BrokenLinkArrayForReasons = BrokenLinkArray2.map((url) => {
        if (
          url.includes(phrase1) ||
          url.includes(phrase2) ||
          url.includes(phrase3) ||
          url.includes(phrase4)
        ) {
          return prefix2 + url;
        } else if (url.includes(phrase5)) {
          return prefix3 + url;
        }
        return url;
      });

      // Use storedCurrentUrl as the course URL to get the main course ID
      const mainCourseID = getMainCourseId(storedCurrentUrl);

      // Assuming BrokenLinkArrayForReasons is already defined and populated
      // Process the links stored in BrokenLinkArrayForReasons
      processUrls(BrokenLinkArrayForReasons, mainCourseID);
    }
  });

  // FUNCTION: This extracts the main course id //
  // PARAMETERS: A url                          //
  // Returns: the Main Course id                //
  const getMainCourseId = (url) => {
    let parts = url.split("/");
    return parts[4]; // Adjust index based on URL structure
  };

  // FUNCTION: this is to get the course ID from a URL, if the url incluedes byui.instructure and not REFERENCE //
  // PARAMETERS: url                                                                                            //
  // RETURNS: Course code ID                                                                                    //
  function getCoursesId(url) {
    let parts = url.split("/");
    if (url.includes("byui.instructure") && !url.includes("REFERENCE$")) {
      return parts[5]; // Adjust index based on URL structure
    } else {
      return null;
    }
  }

  // FUNCTION: is used to fetch the status code of a given URL //
  // PARAMETER: url                                            //
  // RETURNS: url, status code, response url                   //
  //          if error: url, status, error                     //
  async function fetchStatusCode(url) {
    try {
      const response = await fetch(url /*,{mode: 'no-cors'}*/);
      //console.log(response.url)
      return { url, status: response.status, responseUrl: response.url };
    } catch (error) {
      //console.log("error fetching", url, error);
      return { url, status: "Error", error: error };
    }
  }

  // Function to process each URL in the given array and log relevant information
  async function processUrls(urls, mainCourseID) {
    const fetchPromises = urls.map((url) => fetchStatusCode(url));
    const results = await Promise.all(fetchPromises);
    let arrayOfReasons = [];

    function logAndAddReason(url, coursesId, status, responseURL, reason) {
      console.log(
        `URL: ${url}, Course ID: ${coursesId}, Status Code: ${status}, Response Url:${responseURL} ,${reason}`
      );
      arrayOfReasons.push(reason);
    }

    function normalizeUrl(url) {
      return url.replace(/([^:]\/)\/+/g, "$1").split('#')[0];
    }

    results.forEach((result) => {
      const coursesId = getCoursesId(result.url);

      if (coursesId !== null) {
        if (coursesId.length < 6) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Hidden Link"
          );
        } else if (
          coursesId != mainCourseID &&
          !result.url.includes("REFERENCE")
        ) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "From External Course"
          );
        } else if (
          result.status === 200 &&
          normalizeUrl(result.responseUrl).includes(normalizeUrl(result.url)) &&
          result.responseUrl.includes("edit")
        ) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Page Doesn't Exist (Canvas) - Deleted Course Content"
          );
        } else if (
          result.status === 400  &&
          normalizeUrl(result.responseUrl) === normalizeUrl(result.url)
        ) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Page Doesn't Exist (Canvas) - Deleted Course Content"
          );
        } else if (
          result.status === 200  &&
          normalizeUrl(result.url).includes(normalizeUrl(result.responseUrl))
        ) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Page Doesn't Exist (Canvas) - Deleted Course Content"
          );
        } else {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Uncertain"
          );
        }
      } else {
        // Specific checks for false positives and page not found
        if (result.status === 200 && result.url.includes("content.byui.edu/")) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Equella"
          );
        } else if (
          !result.url.includes("byui.instructure") &&
          result.url.includes("link.gale.com")
        ) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Library Resource"
          );
        } else if (
          (result.status === 200 && !result.url.includes("byui.instructure")) ||
          result.url.includes("byui.edu/media") ||
          result.status === 307
        ) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "From External Resource"
          );
        } else if (result.url.includes("preview")) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Image"
          );
        } else if (result.status === 404 || result.status === 410) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Page Not Found"
          );
        } else if (
          result.status == "Error" &&
          result.responseUrl == undefined
        ) {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Site Can't Be Reached"
          );
        } else {
          logAndAddReason(
            result.url,
            coursesId,
            result.status,
            result.responseUrl,
            "Uncertain"
          );
        }
      }
    });

    //console.log(arrayOfReasons);
    /****************************************************************/
    /*** Reasons Text areas***/

    let reasonsTextArea = document.getElementById("broken_reason");
    reasonsTextArea.value = arrayOfReasons.join("\n");
    /****************************************************************/

    /****************************************************************/
    /*** Reasons Text Copy Button***/

    let reasonsCopyButton = document.getElementById("copyBrokenReasonsButton");

    function copyReasons() {
      reasonsTextArea.select();
      navigator.clipboard.writeText(reasonsTextArea.value);
    }

    reasonsCopyButton.addEventListener("click", copyReasons);

    /****************************************************************/
  }
}

function populateCourseNames(length) {
  courseNames = [];
  //console.log("the populate Course Names Function is being called");
  chrome.storage.local.get(["courseName"], (result) => {
    if (result.courseName) {
      const courseName = result.courseName;

      /************************************************************************/
      /*** Course Name Text Area ***/

      for (let i = 0; i < length; i++) {
        courseNames.push(courseName);
      }

      let courseNameTextArea = document.getElementById("course_name");
      courseNameTextArea.value = courseNames.join("\n");

      /************************************************************************/

      /************************************************************************/
      /*** Course Names Copy Button ***/

      let courseNamesCopyButton = document.getElementById(
        "copyCourseNameButton"
      );

      function copyCourseNames() {
        courseNameTextArea.select();
        navigator.clipboard.writeText(courseNameTextArea.value);
      }

      courseNamesCopyButton.addEventListener("click", copyCourseNames);

      /************************************************************************/
    } else {
      console.log("ERROR: Course name not found");
    }
  });
}

function populateLocations() {
  console.log("the populate Locations Function is being called");
  chrome.storage.local.get(["brokenLinksLocations"], (result) => {
    if (result.brokenLinksLocations) {
      const locations = result.brokenLinksLocations;

      let locationsTextArea = document.getElementById("broken_location");
      locationsTextArea.value = locations.join("\n");

      let locationsCopyButton = document.getElementById(
        "copyBrokenLocationsButton"
      );

      function copyLocations() {
        locationsTextArea.select();
        navigator.clipboard.writeText(locationsTextArea.value);
      }

      locationsCopyButton.addEventListener("click", copyLocations);
    } else {
      console.log("Error");
    }
  });
}
