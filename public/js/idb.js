let db;

const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_txn", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadTxn();
  }
};

request.onerror = function (e) {
  console.log(e.target.errorCode);
};

// This fn will exe if we submit txn w/o internet
function saveRecord(record) {
  // open a new txn to db w/ read/write permissions
  const txn = db.transaction(["new_txn"], "readwrite");

  // access object store new txn
  const txnObjectStore = txn.objectStore("new_txn");

  // add record to store w/ add method
  txnObjectStore.add(record);
}

function uploadTxn() {
  const txn = db.transaction(["new_txn"], "readwrite");

  const txnObjectStore = txn.objectStore("new_txn");

  const getAll = txnObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const txn = db.transaction(["new_txn"], "readwrite");
          const txnObjectStore = txn.objectStore("new_txn");
          txnObjectStore.clear();

          alert("All saved transactions have been submitted");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener('online', uploadTxn);