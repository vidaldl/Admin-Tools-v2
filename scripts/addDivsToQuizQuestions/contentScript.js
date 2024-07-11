chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
    console.log("Received message:", message);
    try {
        if (message.type === "ADD_DIV") {
            const questionLink = document.getElementsByClassName("question_name question_teaser_link");
            console.log("questionLink length:", questionLink.length); // Log the length
  
            if (questionLink.length > 5) {
                console.log("Calling MoreQuestionsPage");
                await MoreQuestionsPage();
            } else {
                console.log("Calling NormalPage");
                await NormalPage();
            }
            sendResponse({ status: "Action performed" });
        }
    } catch (error) {
        console.error("Error processing message:", error);
        sendResponse({ status: "Error occurred", error: error.toString() });
    }
    return true;
  });
  
  function NormalPage() {
    try {
      let className = document.querySelector(
        "#breadcrumbs > ul > li:nth-child(2) > a > span"
      );
      console.log(className.textContent);
  
      let courseName; //this is the courseName Example: child210
      let correctDiv; //this is the courseDiv Example: <div class="byui child210">
  
      if (className) {
        let fullCourseName = className.textContent.trim();
        let parts = fullCourseName.split(" ");
        let coursePrefix = parts[0].toLowerCase();
        let courseNumber = parts[1];
  
        courseName = coursePrefix + courseNumber;
        correctDiv = `<div class="byui ${courseName}">`;
      }
  
      console.log(courseName);
      console.log(correctDiv);
  
      let questions = document.querySelectorAll("#questions > div");
  
      questions.forEach((question) => {
        let editArea = question.querySelector(
          "div.text > div.original_question_text > textarea.textarea_question_text"
        );
        //console.log(editArea);
  
        if (editArea) {
          let currentValue = editArea.value;
          let updatedValue = updateByuiDivs(editArea.value, courseName);
  
          if (currentValue.includes(courseName)) {
            console.log("Already has it");
          } else if (!currentValue.includes(`div class="byui ${courseName}">`)) {
            editArea.value = correctDiv + updatedValue;
          } else {
            editArea.value = updatedValue;
          }
        }
  
        const editButton = question.querySelector(".edit_question_link");
        editButton.click();
  
        const updateButton = document.querySelector("button.btn.btn-small.submit_button.btn-primary");
        updateButton.click();
      });
  
      function updateByuiDivs(value, courseName) {
        // Regex to find <div> with "byui" class and capture up to the closing tag of that div
        let pattern = /<div class="byui [^"]*">([\s\S]*?)<\/div>/g;
  
        // Replace function to check if the existing div has the correct courseName
        return value.replace(pattern, function (match, innerContent) {
          if (!match.includes(`byui ${courseName}">`)) {
            // If the div class doesn't match the courseName, remove it
            return innerContent;
          }
          return match; // If the class name is correct, keep it
        });
      }
    } catch (error) {
      console.error("Error in Main function:", error);
    }
  }
  
  
  
  
  
  /***Utility Functions***/
  async function clickAllMoreQuestions() {
    let previousQuestionCount = 0;
  
    while (true) {
      const moreQuestionButton = document.querySelector("#more_questions > a");
      console.log("Checking for 'more questions' button...");
  
      if (moreQuestionButton) {
        console.log("Clicking 'more questions' button...");
        moreQuestionButton.click();
  
        // Scroll to the bottom of the page to load more questions
        window.scrollTo(0, document.body.scrollHeight);
  
        // Add a delay to allow questions to load
        await new Promise((resolve) => setTimeout(resolve, 1000));
  
        const currentQuestionCount = document.getElementsByClassName("quiz_sortable question_holder question_teaser").length;
        console.log(`Previous question count: ${previousQuestionCount}, Current question count: ${currentQuestionCount}`);
  
        // If no new questions are loaded, exit the loop
        if (currentQuestionCount <= previousQuestionCount) {
          console.log("No new questions loaded. Exiting loop.");
          break;
        }
  
        previousQuestionCount = currentQuestionCount;
      } else {
        console.log("'More questions' button not found. Exiting loop.");
        break;
      }
    }
    console.log("Finished clicking all 'more questions' buttons.");
  }
  
  
  async function addCorrectDiv() {
    // Counter for the question we are on
    let counter = 1;
  
    // Gets the Correct Div from the page
    const className = document.querySelector(
      "#breadcrumbs > ul > li:nth-child(2) > a > span"
    );
    console.log(className.textContent);
  
    let courseName; // This is the courseName Example: child210
    let correctDiv; // This is the courseDiv Example: <div class="byui child210">
  
    if (className) {
      const fullCourseName = className.textContent.trim();
      const parts = fullCourseName.split(" ");
      const coursePrefix = parts[0].toLowerCase();
      const courseNumber = parts[1];
  
      courseName = coursePrefix + courseNumber;
      correctDiv = `<div class="byui ${courseName}">`;
    }
  
    console.log(courseName);
    console.log(correctDiv);
  
    // This gets all of the question HTML objects of the page
    const questionObjs = document.getElementsByClassName(
      "quiz_sortable question_holder question_teaser"
    );
    console.log(questionObjs);
  
    // Convert HTMLCollection to an array
    const questionObjsArray = Array.from(questionObjs);
  
    for (const questionObj of questionObjsArray) {
      console.log(` Question Number ${counter}`);
      counter += 1;
      // Click the edit button
      const editButton = questionObj.querySelector(".edit_teaser_link.no-hover");
      editButton.click();
      console.log("Edit button clicked");
  
      await new Promise(resolve => setTimeout(resolve, 200)); // 2 seconds delay
  
      const iframes = document.getElementsByClassName("tox-edit-area__iframe");
      console.log("Now about to get the iframe");
  
      if (iframes.length > 0) {
        const iframe = iframes[0];
        console.log("Iframe found");
        console.log(iframe);
  
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  
        if (iframeDoc) {
          const bodyContent = iframeDoc.body.innerHTML;
          const updatedContent = updateByuiDivs(bodyContent, courseName);
  
          if (bodyContent.includes(courseName)) {
            console.log("Already has it");
          } else if (!bodyContent.includes(`div class="byui ${courseName}">`)) {
            iframeDoc.body.innerHTML = correctDiv + updatedContent;
          } else {
            iframeDoc.body.innerHTML = updatedContent;
          }
          console.log("Iframe content changed");
        } else {
          console.log("Unable to access iframe document");
        }
      } else {
        console.log("Iframe not found");
      }
  
      // Update Button
      const updateButton = document.getElementsByClassName("btn btn-small submit_button btn-primary");
      if (updateButton.length > 0) {
        updateButton[0].click();
        console.log("Update Button Clicked");
      } else {
        console.log("Update Button not found");
      }
    }
  }
  
  function updateByuiDivs(value, courseName) {
    // Regex to find <div> with "byui" class and capture up to the closing tag of that div
    const pattern = /<div class="byui [^"]*">([\s\S]*?)<\/div>/g;
  
    // Replace function to check if the existing div has the correct courseName
    return value.replace(pattern, (match, innerContent) => {
      if (!match.includes(`byui ${courseName}">`)) {
        // If the div class doesn't match the courseName, remove it
        return innerContent;
      }
      return match; // If the class name is correct, keep it
    });
  }
  
  
  
  /********************************************/
  
  async function MoreQuestionsPage() {
    await clickAllMoreQuestions();
    await addCorrectDiv();
  }
  
  
  
  