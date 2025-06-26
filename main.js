// Select elements
let countSpan = document.querySelector(".count span");
let bulletsContainer = document.querySelector(".bullets .spans");
let bullets = document.querySelector(".bullets");
let quizArea = document.querySelector(".quiz-area");
let answersArea = document.querySelector(".answers-area");
let submitButton = document.querySelector(".submit-button");
let results = document.querySelector(".results");
let countdownElement = document.querySelector(".countdown");
let categorySpan = document.querySelector(".category span"); // Added this to update category
let restartButton = document.querySelector(".restart");

// Selection Modal Elements
let selectionModal = document.getElementById("selectionModal");
let selectButtons = document.querySelectorAll(".selection-options .select-btn");
let quizAppContainer = document.querySelector(".quiz-app"); // Reference to the main quiz container

// Settings
let currentIndex = 0;
let correctAnswers = 0;
let countdownInterval;
let questionsData = []; // To store the fetched questions (all questions from JSON)
let displayedQuestions = []; // To store the 10 randomly selected questions
let selectedQuizCategory = ""; // To store the selected category name
const QUESTIONS_TO_DISPLAY = 10; // New constant for number of questions

// Function to initialize the quiz
function startQuiz(jsonFile, categoryName) {
  // Reset quiz state for a new game
  currentIndex = 0;
  correctAnswers = 0;
  clearInterval(countdownInterval); // Clear any previous countdown

  // Hide the selection modal
  selectionModal.style.display = "none";
  // Show the quiz app
  quizAppContainer.style.display = "block";
  results.style.display = "none"; // Ensure results area is hidden

  // Re-append quiz elements if they were removed by showResults previously
  if (!quizArea.parentNode)
    document.querySelector(".quiz-app").prepend(quizArea);
  if (!answersArea.parentNode) quizArea.after(answersArea); // Or append to quiz-app
  if (!submitButton.parentNode) answersArea.after(submitButton);
  if (!bullets.parentNode) submitButton.after(bullets);

  selectedQuizCategory = categoryName;
  categorySpan.textContent = categoryName; // Update category in quiz info

  let request = new XMLHttpRequest();

  request.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      questionsData = JSON.parse(this.responseText); // Store all questions from JSON

      // --- NEW: Select 10 random questions ---
      displayedQuestions = shuffleArray(questionsData).slice(
        0,
        QUESTIONS_TO_DISPLAY
      );
      let totalQuestions = displayedQuestions.length; // Now total questions is 10

      createBullets(totalQuestions);
      addQuestionData(displayedQuestions[currentIndex], totalQuestions);
      countdown(180, totalQuestions); // Set your desired countdown duration

      submitButton.onclick = () => {
        let correctAnswer = displayedQuestions[currentIndex].true_answer; // Use displayedQuestions
        currentIndex++;

        checkAnswer(correctAnswer, totalQuestions);

        // Clear previous question and answers
        quizArea.innerHTML = "";
        answersArea.innerHTML = "";

        // Add next question or show results
        if (currentIndex < totalQuestions) {
          addQuestionData(displayedQuestions[currentIndex], totalQuestions); // Use displayedQuestions
          handleBullets();
          clearInterval(countdownInterval);
          countdown(180, totalQuestions); // Reset countdown for new question
        } else {
          showResults(totalQuestions);
          clearInterval(countdownInterval); // Stop countdown when quiz ends
        }
      };
    }
  };

  request.open("GET", `json/${jsonFile}`, true); // Use the selected JSON file
  request.send();
}

// Event Listeners for selection buttons
selectButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const jsonFile = this.dataset.file;
    const categoryName = this.textContent.trim(); // Get category name from button text
    startQuiz(jsonFile, categoryName);
  });
});

// --- NEW: Fisher-Yates Shuffle Algorithm for arrays ---
function shuffleArray(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

// Create question bullets
function createBullets(num) {
  countSpan.innerHTML = num;
  // Clear existing bullets before creating new ones
  bulletsContainer.innerHTML = "";
  for (let i = 0; i < num; i++) {
    let bullet = document.createElement("span");
    if (i === 0) bullet.className = "on";
    bulletsContainer.appendChild(bullet);
  }
}

// Add question data
function addQuestionData(obj, count) {
  if (currentIndex < count) {
    let questionTitle = document.createElement("h2");
    questionTitle.textContent = obj.title;
    quizArea.appendChild(questionTitle);

    // --- NEW: Randomize answers ---
    let allAnswers = [obj.answer_1, obj.answer_2, obj.answer_3, obj.answer_4];
    let shuffledAnswers = shuffleArray(allAnswers); // Shuffle the answers

    for (let i = 0; i < shuffledAnswers.length; i++) {
      // Loop through shuffled answers
      let answerDiv = document.createElement("div");
      answerDiv.className = "answer";

      let radioInput = document.createElement("input");
      radioInput.type = "radio";
      radioInput.name = "question";
      radioInput.id = `answer_${i}`; // Use i for unique ID
      radioInput.dataset.answer = shuffledAnswers[i]; // Assign shuffled answer

      let label = document.createElement("label");
      label.htmlFor = `answer_${i}`;
      label.textContent = shuffledAnswers[i]; // Display shuffled answer

      answerDiv.appendChild(radioInput);
      answerDiv.appendChild(label);
      answersArea.appendChild(answerDiv);
    }

    // Make the entire answer div clickable
    document.querySelectorAll(".answer").forEach((div) => {
      div.addEventListener("click", function () {
        const input = this.querySelector('input[type="radio"]');
        if (input) input.checked = true;
      });
    });
  }
}

// Check the selected answer
function checkAnswer(correctAnswer, total) {
  let selected;
  document.getElementsByName("question").forEach((input) => {
    if (input.checked) selected = input.dataset.answer;
  });

  if (selected === correctAnswer) correctAnswers++;
}

// Update bullets
function handleBullets() {
  let allBullets = document.querySelectorAll(".bullets .spans span");
  allBullets.forEach((span, index) => {
    span.className = index === currentIndex ? "on" : "";
  });
}

// Show results
function showResults(total) {
  // Hide bullets and countdown when results are shown
  if (quizArea) quizArea.remove();
  if (answersArea) answersArea.remove();
  if (submitButton) submitButton.remove();
  if (bullets) bullets.remove();

  let resultHTML;
  // Calculate percentage for more robust result display
  let scorePercentage = (correctAnswers / total) * 100;

  if (scorePercentage < 50) {
    resultHTML = `<span class="bad">Bad</span> You answered <span class="bad">${correctAnswers}</span> out of ${total}.`;
  } else if (scorePercentage >= 50 && scorePercentage < 90) {
    // Good for 50% to 89%
    resultHTML = `<span class="good">Good</span> You answered <span class="good">${correctAnswers}</span> out of ${total}.`;
  } else {
    // Perfect for 90% or more
    resultHTML = `<span class="perfect">Perfect</span> You answered <span class="perfect">${correctAnswers}</span> out of ${total}.`;
  }

  results.style.display = "block";
  results.innerHTML = resultHTML;
  restartButton.style.display = "block";
  ////////////////
  // resart button
  restartButton.addEventListener("click", function () {
    location.reload();
  });
  ////////////////
}

// Countdown timer
function countdown(duration, total) {
  // Clear any existing interval to prevent multiple timers
  clearInterval(countdownInterval);

  if (currentIndex < total) {
    let minutes, seconds;
    countdownInterval = setInterval(() => {
      minutes = String(Math.floor(duration / 60)).padStart(2, "0");
      seconds = String(duration % 60).padStart(2, "0");

      countdownElement.textContent = `${minutes} : ${seconds}`;
      if (--duration < 0) {
        clearInterval(countdownInterval);
        submitButton.click(); // Automatically submit and move to next question
      }
    }, 1000);
  }
}
