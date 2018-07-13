// const habits = [];

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const today = new Date();
const month = today.getMonth();
const date = today.getDate();


//render month in header
document.getElementById('month-header').textContent = months[month];


// CREATE DAY & DATE HEADER CELLS

const getMonthStartDay = () => {
  const currDate = today.getDate();
  const currDay = today.getDay();
  let startDay = 0;

  let dayCount = currDay;

  for (let dateCount = currDate; dateCount > 0; dateCount--) {
    if (dayCount === -1) { dayCount = 6 }
    if (dateCount === 1) { startDay = dayCount }
    dayCount--;
  }
  return startDay;
}

const dateHeaderRow = document.getElementById('date-header-row');

const addDayAndDateCells = () => {
  const startDay = getMonthStartDay();
  const monthLength = monthLengths[month];

  const addEmptyCell = date => {
    const emptyCell = document.createElement('td');
    emptyCell.textContent = date;
    emptyCell.classList.add('cell', 'date-cell', 'empty-date-cell');
    dateHeaderRow.appendChild(emptyCell);
  }

  // add empty cells to beginning 
  // ex: if previous month had 30 days and currMonth started on 2, 
  // the first 2 cells should show 29 & 30
  for (let i = startDay; i > 0; i++) {
    const prevMonth = month - 1;
    if (prevMonth === -1) { prevMonth = 11 };
    const prevMonthLength = monthLengths[prevMonth];

    addEmptyCell(prevMonthLength - i - 1);
  }

  // add date cells
  for (let i = 1; i <= monthLength; i++) {
    const cell = document.createElement('td');
    cell.classList.add('cell', 'date-cell');
    cell.textContent = i;
    if (i === date) {
      cell.classList.add('highlight');
    }
    dateHeaderRow.appendChild(cell);
  }
  // add empty cells to end
  for (let i = 0; i < (35 - monthLength + startDay); i++) {
    addEmptyCell(i + 1);
  }

  // add days above dates
  const allDateCells = document.querySelectorAll('.date-cell');
  for (let i = 0; i < allDateCells.length; i++) {
    const day = document.createElement('div');
    day.textContent = days[i % 7];
    allDateCells[i].prepend(day);
  }

}

addDayAndDateCells();


// RENDER HABITS

const addHabitTitle = (habit, row) => {
  const title = document.createElement('td');
  title.classList.add('cell', 'habit-title-cell');
  title.textContent = habit.title;
  row.appendChild(title);
  return row;
};

const addDailyCells = row => {
  for (let i = 0; i < 35; i++) {
    const cell = document.createElement('td');
    cell.classList.add('cell', 'daily-cell');

    cell.addEventListener('click', () => changeCellColor(cell));

    row.appendChild(cell);
  }
}

const addWeeklyCells = row => {
  for (let i = 0; i < 5; i++) {
    const cell = document.createElement('td');
    cell.classList.add('cell', 'weekly-cell');
    cell.setAttribute('colspan', '7');

    cell.addEventListener("click", () => changeCellColor(cell));

    row.appendChild(cell);
  }
}

// const renderHabit = habit => {
//   let row = document.createElement('tr');
//   row = addHabitTitle(habit, row);

//   if (habit.type === 'weekly') {
//     addWeeklyCells(row);
//   } else {
//     addDailyCells(row);
//   }

//   document.getElementById('table-body').appendChild(row);
// }

// render any saved habits
// if (habits) {
//   habits.forEach(habit => {
//     renderHabit(habit);
//   });
// }


// OPTIONS

// basic change a cell's color (default -> complete -> incomplete -> default)
const changeCellColor = cell => {
  if (cell.classList.contains('complete')) { 
    cell.classList.toggle('complete'); 
    cell.classList.toggle('incomplete');
  } else if (cell.classList.contains('incomplete')) {
    cell.classList.toggle('incomplete');
  } else {
    cell.classList.toggle('complete');
  }
}


// ADD HABITS
// turn into popover?

const form = document.getElementById('form');

const resetForm = () => {
  document.getElementById('habit-title-input').value = ""; // clear new habit title input
  document.getElementById('habit-type-daily').checked = true;
}

// create unique identifier function

// form.addEventListener('submit', event => {
//   event.preventDefault();

//   const data = new FormData(form);
//   let newHabit = {};
//   for (const entry of data) {
//     if (entry[0] === 'habit-title') { newHabit.title = entry[1] };
//     if (entry[0] === 'habit-type') { newHabit.type = entry[1] };
//   }
//   habits.push(newHabit);
//   renderHabit(newHabit);

//   resetForm();
// });





// localStorage database
// instance of object used to store the database of habtis for the user
let db;

window.onload = function() {
  let request = window.indexedDB.open('habits', 1); // opens db; creates if not already existing

  request.onerror = function() {
    console.log('database failed to open');
  }
  request.onsuccess = function() {
    console.log('database opened successfully');
    db = request.result; // object representing db

    displayData();
  }

  // runs if db not setup, or is opened with greater version number
  request.onupgradeneeded = function(e) {
    let db = e.target.result; // equivalent to db = request.result

    // create single table in db system
    let objectStore = db.createObjectStore('habits', { keyPath: 'id', autoIncrement: true });

    // define what data items it will contain
    objectStore.createIndex('title', 'title', { unique: false });
    objectStore.createIndex('type', 'type', { unique: false });

    console.log('database setup complete');
  }

  form.onsubmit = addData;

  function addData(e) {
    e.preventDefault();

    const titleInput = document.getElementById('habit-title-input').value;
    const typeInput = document.getElementById('habit-type-daily').checked ? 
                        document.getElementById('habit-type-daily').value :
                        document.getElementById('habit-type-weekly').value;

    let newHabit = { title: titleInput, type: typeInput };

    let transaction = db.transaction(['habits'], 'readwrite');
    let objectStore = transaction.objectStore('habits');

    var request = objectStore.add(newHabit);

    request.onsuccess = function() {
      resetForm();
    }

    transaction.oncomplete = function() {
      console.log('transaction complete: database modification finished');
      displayData();
    }

    transaction.onerror = function() {
      console.log('transaction not opened due to error');
    }
  }

  function displayData() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    // open object store and get cursor (iterates through all data items in store)
    let objectStore = db.transaction('habits').objectStore('habits');
    objectStore.openCursor().onsuccess = function(e) {
      // get reference to cursor
      let cursor = e.target.result;

      if (cursor) {
        let habit = cursor.value;

        let row = document.createElement('tr');

        addHabitTitle(habit, row);

        if (habit.type === "weekly") {
          addWeeklyCells(row);
        } else {
          addDailyCells(row);
        }
        row.setAttribute('data-habit-id', habit.id);

        // create a delete button here and append as well if applicable

        tableBody.appendChild(row);

        // iterator to next item in cursor
        cursor.continue();
      } else {
        if (!tableBody.innerHTML) {
          let row = document.createElement('tr');
          let cell = document.createElement('td');
          cell.textContent = 'no habits yet!';
          row.appendChild(cell);
          tableBody.appendChild(row);
        }
        console.log('Notes all displayed');
      }
    }
  }

}

// DELETE HABITS

