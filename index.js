// set up client-side storage 
let db;
window.onload = function() {
  let request = window.indexedDB.open('habits', 1); // opens db; creates if not already existing

  request.onerror = function() {
    console.log('database failed to open');
  }
  request.onsuccess = function() {
    console.log('database opened successfully');
    db = request.result; // object representing db
    displayHabits();
  }

  // runs if db not setup, or is opened with greater version number
  request.onupgradeneeded = function(e) {
    let db = e.target.result; // equivalent to db = request.result

    // create single table in db system
    let objectStore = db.createObjectStore('habits', { keyPath: 'id', autoIncrement: true });

    // define what data items it will contain
    objectStore.createIndex('title', 'title', { unique: false });
    objectStore.createIndex('type', 'type', { unique: false });
    objectStore.createIndex('history', 'history', { unique: false });
    objectStore.createIndex('start', 'start', { unique: false });

    console.log('database setup complete');
  }

  document.getElementById('form').onsubmit = addHabit;
}




//****************** VARIABLES *******************//

// for date header & page header
const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const today = new Date();
const day = today.getDay();
const date = today.getDate();
const month = today.getMonth();
const year = today.getFullYear();

// for matching Date.getDateString() output, used for storing responses
const days2 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months2 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];



//****************** VIEW *******************//

const todayHeader = `${daysFull[day].toLowerCase()}, ${months[month].toLowerCase()} ${date}, ${year}`;
const monthHeader = `${months[month]} ${year}`;

let currentView = 'today'; 
document.getElementById('view-header').textContent = todayHeader;

const toggleView = () => {
  document.getElementById('view-header').textContent = currentView === 'today' ? todayHeader : monthHeader;

  document.querySelectorAll('.view-option').forEach(viewoption => viewoption.classList.toggle('selected-view'));

  document.getElementById('today-view').classList.toggle('hidden');
  document.getElementById('month-view').classList.toggle('hidden');
};

document.querySelectorAll('.view-option').forEach(viewoption => {
  viewoption.addEventListener('click', (e) => { 
    let selectedView = e.target.id;
    if (selectedView !== currentView) {
      currentView = selectedView;
      toggleView();
    }
  });
});


//****************** DISPLAY HABITS *******************//

function displayHabits() {
  const monthTable = document.getElementById('month-table-body');
  const todayTable = document.getElementById('today-table-body');
  monthTable.innerHTML = todayTable.innerHTML = "";

  // open object store and get cursor (iterates through all data items in store)
  let objectStore = db.transaction('habits').objectStore('habits');
  objectStore.openCursor().onsuccess = function(e) {
    // get reference to cursor
    let cursor = e.target.result;

    if (cursor) {
      let habit = cursor.value;
      
      // display month table
      let monthRow = document.createElement('tr');
      addHabitTitleCell(habit, monthRow, 'month-habit-title-cell', 'month');
      addDailyCells(habit, monthRow);
      monthRow.setAttribute('data-habit-id', habit.id);
      monthTable.appendChild(monthRow);

      // display today table
      let todayRow = document.createElement('tr');
      addCheckboxCell(habit, todayRow);
      addHabitTitleCell(habit, todayRow, 'today-habit-title-cell', 'daily');
      todayRow.setAttribute("data-habit-id", habit.id);
      todayTable.appendChild(todayRow);

      // iterator to next item in cursor
      cursor.continue();

    } else {
      if (!monthTable.innerHTML) {
        let monthRow = document.createElement('tr');
        let cell = document.createElement('td');
        cell.textContent = `no habits started!`;
        cell.setAttribute('colspan', 40);
        monthRow.appendChild(cell);
        monthTable.appendChild(monthRow);
      }
      if (!todayTable.innerHTML) {
        let todayRow = document.createElement('tr');
        let cell = document.createElement("td");
        cell.textContent = `no habits started!`;
        cell.setAttribute("colspan", 40);
        todayRow.appendChild(cell);
        todayTable.appendChild(todayRow);
      }
    }
  }
}

const addCheckboxCell = (habit, row) => {
  const checkboxCell = document.createElement('td');
  checkboxCell.classList.add('cell', 'checkbox-cell');

  let dateKey = `${days2[day]} ${months2[month]} ${date} ${year}`;
  let response = habit.history[dateKey]; // 'complete', 'incomplete', null/undefined

  if (response) {
    checkboxCell.classList.add(response);

    if (response === "complete") {
      checkboxCell.innerHTML = '<i class="fas fa-check"></i>';
    } else if (response === "incomplete") {
      checkboxCell.innerHTML = '<i class="fas fa-times"></i>';
    }
  }
  checkboxCell.addEventListener("click", () => { updateHabit(habit.id, dateKey) });
  row.appendChild(checkboxCell);
}

const addHabitTitleCell = (habit, row, classname, type) => {
  const title = document.createElement('td');
  title.classList.add('cell', classname);
  title.textContent = habit.title;
  row.appendChild(title);

  let deleteButton = document.createElement('button');
  deleteButton.textContent = 'X';
  deleteButton.addEventListener('click', () => {
    deleteHabit(habit.id);
  });
  if (type === 'month') { 
    deleteButton.classList.add('month-delete');
    title.appendChild(deleteButton) 
  } else { 
    deleteButton.classList.add('today-delete');
    title.appendChild(deleteButton);
  }
  

  return row;
};

const addDailyCells = (habit, row) => {
  // for comparing whether day falls after habit start date
  const habitStart = habit.start;
  const habitStartNumber = Number(`${habitStart.getFullYear()}${habitStart.getMonth()}${habitStart.getDate()}`);

  let currDay = startDay;
  for (i = 1; i <= monthLength; i++) {
    let currDate = i;
    let currDateNumber = Number('' + year + month + i);

    let dateKey = `${days2[currDay]} ${months2[month]} ${i} ${year}`;

    const cell = document.createElement('td');
    cell.classList.add('cell', 'daily-cell');

    let response = habit.history[dateKey]; // 'complete', 'incomplete', null/undefined

    if (currDateNumber === habitStartNumber) {
      cell.classList.add("start-date");
    }

    if (response) {
      cell.classList.add(response);
      if (response === 'complete') {
        cell.innerHTML = '<i class="fas fa-check"></i>';
      } else if (response === 'incomplete') {
        cell.innerHTML = '<i class="fas fa-times"></i>';
      }
    // if no response recorded from previous day yet habit was active auto-mark as incomplete
    } else if (currDateNumber >= habitStartNumber) {
      if (i < date && !response) {
        response = "incomplete";
        cell.classList.add("incomplete");
        cell.innerHTML = '<i class="fas fa-times"></i>';
      }
    }
    // prevent responses being added to future dates
    if (i <= date) {
      cell.addEventListener('click', () => { updateHabit(habit.id, dateKey)});
    }
    row.appendChild(cell);

    currDay++;
    if (currDay === 7) { currDay = 0 };
  }
}

// const addWeeklyCells = row => {
//   for (let i = 0; i < 5; i++) {
//     const cell = document.createElement('td');
//     cell.classList.add('cell', 'weekly-cell');
//     cell.setAttribute('colspan', '7');

//     cell.addEventListener("click", () => changeCellColor(cell));

//     row.appendChild(cell);
//   }
// }


//****************** ADD HABITS *******************//

function addHabit(e) {
  e.preventDefault();

  const titleInput = document.getElementById('habit-title-input').value;
  // const typeInput = document.getElementById('habit-type-daily').checked
  //   ? document.getElementById('habit-type-daily').value
  //   : document.getElementById('habit-type-weekly').value;
  const typeInput = 'daily';

  let newHabit = { title: titleInput, type: typeInput, history: {}, start: new Date() };

  let transaction = db.transaction(['habits'], 'readwrite');
  let objectStore = transaction.objectStore("habits");

  var request = objectStore.add(newHabit);

  request.onsuccess = function() {
    document.getElementById('habit-title-input').value = ''; // clear new habit title input
    // document.getElementById('habit-type-daily').checked = true;
  };

  transaction.oncomplete = function() {
    console.log('transaction complete: database modification finished');
    displayHabits();
  };

  transaction.onerror = function() {
    console.log('transaction not opened due to error');
  };
}

//****************** UPDATE HABITS *******************//

function updateHabit(habitId, dateKey) {
  var objectStore = db.transaction(['habits'], 'readwrite').objectStore('habits');
  var objectStoreHabitRequest = objectStore.get(habitId);

  objectStoreHabitRequest.onsuccess = function() {
    var habit = objectStoreHabitRequest.result;

    let currResponse = habit.history[dateKey];
    let newResponse;

    if (currResponse === 'complete') {
      newResponse = 'incomplete';
    } else if (currResponse === 'incomplete') {
      newResponse = null;
    } else {
      newResponse = 'complete';
    }
    habit.history[dateKey] = newResponse;

    console.log(habit);

    var updateHabitRequest = objectStore.put(habit);
    updateHabitRequest.onsuccess = function() {
      displayHabits();
      console.log('habit response saved');
    }
  }
} 

//****************** DELETE HABITS *******************//

function deleteHabit(habitId) {
  var deleteRequest = db.transaction(['habits'], 'readwrite')
                        .objectStore('habits')
                        .delete(habitId);
  deleteRequest.onsuccess = function() {
    console.log('habit successfully deleted');
    displayHabits();
  }
}

//****************** DISPLAY DATE HEADERS *******************//

const getMonthStartDay = () => {
  const currDate = today.getDate();
  const currDay = today.getDay();
  let startDay = 0;

  let dayCount = currDay;

  for (let dateCount = currDate; dateCount > 0; dateCount--) {
    if (dayCount === -1) {
      dayCount = 6;
    }
    if (dateCount === 1) {
      startDay = dayCount;
    }
    dayCount--;
  }
  return startDay;
};

const dateHeaderRow = document.getElementById("date-header-row");

const startDay = getMonthStartDay();
const monthLength = monthLengths[month];

const addDayAndDateCells = () => {
  // const addEmptyCell = date => {
  //   const emptyCell = document.createElement('td');
  //   emptyCell.textContent = date;
  //   emptyCell.classList.add('cell', 'date-cell', 'empty-date-cell');
  //   dateHeaderRow.appendChild(emptyCell);
  // }

  // add empty cells to beginning
  // ex: if previous month had 30 days and currMonth started on 2,
  // the first 2 cells should show 29 & 30
  // for (let i = startDay; i > 0; i++) {
  //   const prevMonth = month - 1;
  //   if (prevMonth === -1) { prevMonth = 11 };
  //   const prevMonthLength = monthLengths[prevMonth];

  //   addEmptyCell(prevMonthLength - i - 1);
  // }

  // add date cells
  for (let i = 1; i <= monthLength; i++) {
    const cell = document.createElement("td");
    cell.classList.add("cell", "date-cell");
    cell.textContent = i;
    if (i === date) {
      cell.classList.add("highlight");
    }
    dateHeaderRow.appendChild(cell);
  }
  // add empty cells to end
  // for (let i = 0; i < (35 - monthLength + startDay); i++) {
  //   addEmptyCell(i + 1);
  // }

  // add days above dates
  const allDateCells = document.querySelectorAll(".date-cell");
  for (let i = 0; i < allDateCells.length; i++) {
    const day = document.createElement("div");
    day.textContent = days[i % 7];
    allDateCells[i].prepend(day);
  }
};
addDayAndDateCells();



/*
stop auto fills for days occurring before habit start date

 - add start date key to each habit in db
 - when creating daily cells, only mark as incomplete if current date falls after habit start day
     - if (date right now > date when habit was created)
       then okay to mark as incomplete if there was no response

 - what i have:

  start date (full datetime format)
  curr iterating date (month, date, day, year, but not in datetime format) => 6 16 2018

  2018 11 16
  2018 9 27
*/