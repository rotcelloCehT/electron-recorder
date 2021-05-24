const { ipcRenderer, remote } = require('electron');
var exifr = require('exifr');
//require path and fs modules for loading in images into 
const path = require('path');
const fs = require('fs');
const { url } = require('inspector');
const { cpuUsage } = require('process');

// GLOBALS
var srcPath; // SOURCE PATH
var outPath; // OUTPUT PATH
var imageArray = [];
var folderArray = [];
// USE VARIABLE THAT CHANGES WHEN THE THEME CHANGES SO THAT NEWLY ADDED FOLDERS HAVE THE PROPER BACKGROUND
var folderImgSource = './images/folder-dark.svg';
// console
photoCounter = 0;
folderCounter = 0;


// TITLE INSERT FROM <HEAD>
const Title = 'VOFOLD';
var title = document.getElementById('title').innerHTML;
document.getElementById('titleShown').innerHTML = title;

// CLOSE BUTTON ELECTRON
const closeBtn = document.getElementById('closeBtn');
closeBtn.addEventListener('click', function() {
  var window = remote.getCurrentWindow();
  window.close();
})
// MINIMIZE BUTTON ELECTRON
const minBtn = document.getElementById('minBtn');
minBtn.addEventListener('click', function() {
  var window = remote.getCurrentWindow();
  window.minimize();
})
// MAXIMIZES BUTTON ELECTRON
const maxBtn = document.getElementById('maxBtn');
maxBtn.addEventListener('click', function() {
  var window = remote.getCurrentWindow();
  window.isMaximized() ? window.unmaximize() : window.maximize()
})


// THEME DARK AND LIGHT -------------------------------------------------------------
// CHECKBOX THEME EVENT LISTENER
var checkbox = document.querySelector("input[name=checkbox]");
var folderListContainer = document.getElementsByClassName('folder-list-container');
var folderImg = document.getElementsByClassName('folder-img');
var folderSize = document.getElementsByClassName('folder-size');
var folderSizeColors = ["#3E4954", "#5E7285"];

checkbox.addEventListener('change', function() {
  if (this.checked) {
    folderImgSource = './images/folder-light.svg';
    document.body.style.backgroundColor = '#fff';
    document.body.style.color = '#4f5f72';
    folderListContainer[0].style.background = 'linear-gradient(160deg, #6484A4,#fff)';
    folderSizeColors = ["#c6d2df", "#8199B1"];
    for(var i=0; i<folderImg.length; i++){
      folderImgSource = './images/folder-light.svg';
      folderImg[i].src = folderImgSource;
      folderSize[i].style.color = "#c6d2df";
      folderSize[i].style.backgroundColor = "#8199B1";
    }
  } 
  else {
    folderImgSource = './images/folder-dark.svg';
    document.body.style.backgroundColor = '#2D3640';
    document.body.style.color = '#fff';
    folderListContainer[0].style.background = 'linear-gradient(160deg, #4F5861,#6484A4)';
    folderSizeColors = ["#3E4954", "#5E7285"];
    for(var i=0; i<folderImg.length; i++){
      folderImgSource = './images/folder-dark.svg';
      folderImg[i].src = folderImgSource;
      folderSize[i].style.color = "#3E4954";
      folderSize[i].style.backgroundColor = "#5E7285";
    }
  }
});

// SOURCE
const srcButton = document.getElementById('source');
srcButton.addEventListener('click', function (event) {
    ipcRenderer.send('open-file-source')
});
ipcRenderer.on('selected-dir-source', function (event, path) {
  srcPath = path;
  //passing sourcePath and callback function
  var dirArray = fs.readdirSync(srcPath);
  folderArray = [];
  createImageObjects(dirArray, srcPath).then(function () {createFolders(imageArray.sort((a, b) => b.date - a.date))});
  // NOTIFICAITON: 
  if (dirArray.length === 0) {
    title = 'Invalid Source';
    document.getElementById('titleShown').innerHTML = title;
  }
  else {
    title = Title;
    document.getElementById('titleShown').innerHTML = title;

    const myNotification = new Notification('Source Loaded', {
      body: 'Source path set succesfully'
    });
  }
  
});

// OUTPUT
const outButton = document.getElementById('output');
outButton.addEventListener('click', function (event) {
    ipcRenderer.send('open-file-output')
});

ipcRenderer.on('selected-dir-output', function (event, path) {
  outPath = path;
  console.log('Full OUTPUT path: ', path);
  // NOTIFICAITON:  
  if (outPath === undefined) {
    title = 'Invalid Output';
    document.getElementById('titleShown').innerHTML = title;
  }
  else {
    title = Title;
    document.getElementById('titleShown').innerHTML = title;

    const myNotification = new Notification('Output Loaded', {
      body: 'Output path set succesfully'
    });
  }

});


// ORGANIZE
const organiseButton = document.getElementById('organise');
organiseButton.addEventListener('click', function (event) {
  if ( srcPath === undefined){
    title = 'Source Needed';
    document.getElementById('titleShown').innerHTML = title;
  }
  else if ( outPath === undefined) {
    title = 'Output Needed';
    document.getElementById('titleShown').innerHTML = title;
  }
  else {
    for (var folderIndex=0 ; folderIndex < folderArray.length; folderIndex++) {
      for (var imageIndex=0 ; imageIndex < folderArray[folderIndex].imageArray.length ;  imageIndex++) {
        var oldPath = folderArray[folderIndex].imageArray[imageIndex].sourcePath;
        var newPath = outPath + "/" + folderArray[folderIndex].name + "/" + folderArray[folderIndex].imageArray[imageIndex].name;

        if (!fs.existsSync(outPath + "/" + folderArray[folderIndex].name)){
          fs.mkdirSync(outPath + "/" + folderArray[folderIndex].name);
        }

        fs.copyFile(oldPath, newPath, function (err) {
          if (err) throw err
        });
      }
    };

    console.log('File have been organised!')
    const folderList = document.getElementById("folder-list");
    folderList.innerHTML = "";
    // NOTIFICAITON: 
    const myNotification = new Notification('Organised!', {
      body: 'Photos were succesfully organised'
    });
  }
});





// CONSTRUCTOR FOR Image CLASS
// ////////////////////////////////////////////////////////////////////////////////////////////////////
class Image {
    constructor(name, date, sourcePath, index) {
      this.name = name;
      this.sourcePath = sourcePath;
      this.date = date;
      this.index = index;
    };
};

// CREATE IMAGE OBJECTS 
async function createImageObjects(dirArray, srcPath) {
    imageArray = [];
    // post condition: appends only images to imageArray.
    // for loop to allow await and then.
    for (var i = 0; i < dirArray.length; i++) { // forEach(function(value, index))
        // SPECIFY ACCEPTED FILE FORMATS
        if (dirArray[i].match(/.(jpg|jpeg|png|gif|arw|raw|tif|svg)$/i)){
            // await response of exifr before continuing loop.
            var date = await exifr.parse( path.join(srcPath, dirArray[i]), ['DateTimeOriginal'] )
            // convert date format to string format.
            if ( date === undefined ) {
              dateTime = "Unknown";
            }
            else {
              dateTime = (date.DateTimeOriginal.toISOString()).slice(0,10);
            }
            // set output path to src path just incase they click sort by accident. Check for equality and prompt error.
            var image = new Image(dirArray[i], dateTime, path.join(srcPath, dirArray[i]), i);
            // append to imageArray
            imageArray.push(image);
        };
    };
};

class Folder {
  constructor(name, images) {
    this.name = name;
    this.imageArray = images;
  };
};

// DISPLAY CONTENTS OF imageArray
function displayImages (imageArray) {
    imageArray.forEach(function(image) {
        console.log('name: ' + image.name  +  ', sourcePath: '  + image.sourcePath +  ', date: '  + image.date + ', index: ' + image.index);
    }); 
};



// /////////////////////////////////////////////////////////////////////////////////////////
// FOLDERS
// document.addEventListener('DOMContentLoaded', getFolders);

function createFolders(imageArray){
    folderArray = [];
    // for loop to allow await and then.
    for (var i = 0; i < imageArray.length; i++) { // forEach(function(value, index))
      if ( folderArray.some(x => x.name.includes(imageArray[i].date))) {
        // SELECTED FOLDER NAME MATCHES THE DATE OF THE PHOTO TAKEN
        let folder = folderArray.find(obj => obj.name == imageArray[i].date);
        // PUSH THE IMAGE TO THE IMAGE ARRAY OF THE SELECTED FOLDER
        folder.imageArray.push(imageArray[i]);
      }
      else {
        let folder = new Folder(imageArray[i].date, [imageArray[i]]);
        folderArray.push(folder);
      }
    }
    displayFolders(folderArray);
    
};

function displayFolders(folderArray) {
  // RESET THE HTML FOR THE FOLDER LIST CONTAINING ALL APPENDED FOLDERS
  const folderList = document.getElementById("folder-list");
  folderList.innerHTML = "";
  folderArray.forEach(function(folder){
    // FOLDER CONTAINER DIV
    const folderListContainerDiv = document.createElement("div");
    folderListContainerDiv.classList.add("folder-container")
    // FOLDER DIV
    const folderDiv = document.createElement("div");
    folderDiv.classList.add("folder");
    folderListContainerDiv.appendChild(folderDiv);
    // FOLDER IMG
    const folderImg = document.createElement('img');
    folderImg.src = folderImgSource;
    folderImg.classList.add("folder-img");
    folderDiv.appendChild(folderImg);
    // FOLDER SIZE
    const folderSize = document.createElement('p');
    folderSize.classList.add("folder-size");
    folderSize.innerHTML = folder.imageArray.length;
    folderSize.style.color = folderSizeColors[0];
    folderSize.style.backgroundColor = folderSizeColors[1];
    folderDiv.appendChild(folderSize);
    // FOLDER DATE
    const folderName = document.createElement('p');
    folderName.classList.add("folder-name");
    folderName.innerHTML = folder.name;
    folderDiv.appendChild(folderName);
    // APPEND FOLDER DIV TO FOLDER-ITEM DIV( container div)
    folderList.appendChild(folderListContainerDiv);
  });
  updateConsole(imageArray,folderArray);
};

//TEST DIRECTORIES
// const sourcePath = path.join('C:/Users/Anthony Radin/Desktop/images');
// const outputPath = path.join('C:/Users/Anthony Radin/Desktop/output');




// CONSOLE STATS
function updateConsole(imageArray, folderArray) {
  var photoCount = document.getElementById('photo-count');
  var folderCount = document.getElementById('folder-count');
  
  photoCount.innerHTML = imageArray.length;
  folderCount.innerHTML = folderArray.length;
};



